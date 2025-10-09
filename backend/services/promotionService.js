/**
 * AD PROMOTION SERVICE
 * ====================
 * Handles activation and management of ad promotions
 *
 * Promotion Types:
 * - Featured (🌟): Homepage + Search + Category visibility
 * - Urgent (🔥): Priority placement, quick sales
 * - Bump Up (📈): Move to top of listings, cost-effective boost
 *
 * Duration Options: 3, 7, 15, 30 days
 * Business Discount: 30-40% off for verified businesses
 */

const pool = require('../config/db');

class PromotionService {
  /**
   * Get promotion pricing
   * @returns {Object} Pricing structure for all promotion types
   */
  getPricing() {
    return {
      featured: {
        3: { individual: 500, business: 350 },  // 30% discount
        7: { individual: 1000, business: 700 },
        15: { individual: 1800, business: 1080 } // 40% discount
      },
      urgent: {
        3: { individual: 300, business: 210 },
        7: { individual: 600, business: 420 },
        15: { individual: 1000, business: 600 }
      },
      bump_up: {
        3: { individual: 150, business: 105 },
        7: { individual: 300, business: 210 },
        15: { individual: 500, business: 300 }
      }
    };
  }

  /**
   * Calculate promotion price
   * @param {string} promotionType - featured, urgent, or bump_up
   * @param {number} durationDays - 3, 7, 15, or 30 days
   * @param {boolean} isVerifiedBusiness - Whether user is verified business
   * @returns {number} Price in NPR
   */
  calculatePrice(promotionType, durationDays, isVerifiedBusiness = false) {
    const pricing = this.getPricing();

    if (!pricing[promotionType]) {
      throw new Error(`Invalid promotion type: ${promotionType}`);
    }

    if (![3, 7, 15].includes(durationDays)) {
      throw new Error(`Invalid duration: ${durationDays}. Must be 3, 7, or 15 days.`);
    }

    const accountType = isVerifiedBusiness ? 'business' : 'individual';
    return pricing[promotionType][durationDays][accountType];
  }

  /**
   * Activate promotion after successful payment
   * @param {number} adId - Ad ID to promote
   * @param {number} userId - User ID
   * @param {string} promotionType - featured, urgent, or bump_up
   * @param {number} durationDays - 3, 7, 15, or 30 days
   * @param {number} amount - Payment amount
   * @param {string} transactionId - Payment transaction ID
   * @returns {Promise<Object>} Activation result
   */
  async activatePromotion(adId, userId, promotionType, durationDays, amount, transactionId) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      console.log('🚀 Activating promotion:', {
        adId,
        userId,
        promotionType,
        durationDays,
        amount,
        transactionId
      });

      // 1. Verify ad exists and belongs to user
      const adCheck = await client.query(
        `SELECT id, user_id, title, status
         FROM ads
         WHERE id = $1`,
        [adId]
      );

      if (adCheck.rows.length === 0) {
        throw new Error('Ad not found');
      }

      const ad = adCheck.rows[0];

      if (ad.user_id !== userId) {
        throw new Error('Unauthorized: Ad does not belong to user');
      }

      if (ad.status !== 'active' && ad.status !== 'approved') {
        throw new Error('Cannot promote inactive ad');
      }

      // 2. Calculate expiry date
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + durationDays);

      // 2. Determine account type (for tracking purposes)
      const userResult = await client.query(
        `SELECT business_verification_status FROM users WHERE id = $1`,
        [userId]
      );
      const accountType = userResult.rows[0]?.business_verification_status === 'approved'
        ? 'business'
        : 'individual';

      // 3. Insert into ad_promotions table
      const promotionResult = await client.query(
        `INSERT INTO ad_promotions (
          ad_id, user_id, promotion_type, duration_days,
          price_paid, payment_reference, account_type, payment_method,
          starts_at, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING id, starts_at, expires_at`,
        [
          adId,
          userId,
          promotionType,
          durationDays,
          amount,
          transactionId,
          accountType,
          'mock', // payment_method
          startDate,
          expiryDate
        ]
      );

      const promotion = promotionResult.rows[0];

      // 4. First, clear ALL promotion flags (to prevent multiple active promotions)
      await client.query(
        `UPDATE ads
         SET
           is_featured = false,
           featured_until = NULL,
           is_urgent = false,
           urgent_until = NULL,
           is_sticky = false,
           sticky_until = NULL
         WHERE id = $1`,
        [adId]
      );

      // 5. Deactivate any existing active promotions for this ad
      await client.query(
        `UPDATE ad_promotions
         SET is_active = false
         WHERE ad_id = $1 AND is_active = true AND id != $2`,
        [adId, promotion.id]
      );

      // 6. Set the NEW promotion flag (map bump_up to sticky in database)
      const dbPromotionType = promotionType === 'bump_up' ? 'sticky' : promotionType;
      await client.query(
        `UPDATE ads
         SET
           is_${dbPromotionType} = true,
           ${dbPromotionType}_until = $1,
           promoted_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [expiryDate, adId]
      );

      await client.query('COMMIT');

      console.log('✅ Promotion activated successfully:', {
        promotionId: promotion.id,
        adId,
        promotionType,
        expiresAt: promotion.expires_at
      });

      return {
        success: true,
        promotionId: promotion.id,
        adId,
        promotionType,
        durationDays,
        startedAt: promotion.starts_at,
        expiresAt: promotion.expires_at,
        amountPaid: amount,
        transactionId
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Promotion activation error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Deactivate expired promotions (cron job)
   * @returns {Promise<Object>} Deactivation results
   */
  async deactivateExpiredPromotions() {
    const client = await pool.connect();

    try {
      console.log('🔄 Checking for expired promotions...');

      // Find all expired active promotions
      const expiredResult = await client.query(
        `SELECT id, ad_id, promotion_type
         FROM ad_promotions
         WHERE is_active = true
         AND expires_at < CURRENT_TIMESTAMP`
      );

      const expired = expiredResult.rows;

      if (expired.length === 0) {
        console.log('✅ No expired promotions found');
        return { deactivated: 0 };
      }

      console.log(`📊 Found ${expired.length} expired promotions`);

      // Deactivate each expired promotion
      for (const promo of expired) {
        await client.query('BEGIN');

        try {
          // Mark promotion as expired
          await client.query(
            `UPDATE ad_promotions
             SET is_active = false
             WHERE id = $1`,
            [promo.id]
          );

          // Remove promotion flag from ad
          await client.query(
            `UPDATE ads
             SET
               is_${promo.promotion_type} = false,
               ${promo.promotion_type}_until = NULL
             WHERE id = $1`,
            [promo.ad_id]
          );

          await client.query('COMMIT');

          console.log(`✅ Deactivated ${promo.promotion_type} promotion for ad ${promo.ad_id}`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Error deactivating promotion ${promo.id}:`, error);
        }
      }

      return { deactivated: expired.length };

    } catch (error) {
      console.error('❌ Deactivate expired promotions error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get active promotions for an ad
   * @param {number} adId - Ad ID
   * @returns {Promise<Array>} Active promotions
   */
  async getActivePromotions(adId) {
    const result = await pool.query(
      `SELECT
        id, promotion_type, duration_days,
        price_paid, starts_at, expires_at,
        is_active
       FROM ad_promotions
       WHERE ad_id = $1
       AND is_active = true
       AND expires_at > CURRENT_TIMESTAMP
       ORDER BY starts_at DESC`,
      [adId]
    );

    return result.rows;
  }

  /**
   * Get promotion history for a user
   * @param {number} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} Promotion history
   */
  async getUserPromotionHistory(userId, limit = 20) {
    const result = await pool.query(
      `SELECT
        p.id, p.ad_id, p.promotion_type, p.duration_days,
        p.price_paid, p.starts_at, p.expires_at, p.is_active,
        a.title as ad_title
       FROM ad_promotions p
       JOIN ads a ON p.ad_id = a.id
       WHERE p.user_id = $1
       ORDER BY p.starts_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  /**
   * Check if ad can be promoted
   * @param {number} adId - Ad ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Eligibility check result
   */
  async canPromoteAd(adId, userId) {
    const result = await pool.query(
      `SELECT
        a.id, a.user_id, a.status,
        a.is_featured, a.featured_until,
        a.is_urgent, a.urgent_until,
        a.is_bump_up, a.bump_up_until
       FROM ads a
       WHERE a.id = $1`,
      [adId]
    );

    if (result.rows.length === 0) {
      return {
        canPromote: false,
        reason: 'Ad not found'
      };
    }

    const ad = result.rows[0];

    if (ad.user_id !== userId) {
      return {
        canPromote: false,
        reason: 'Unauthorized: Ad does not belong to user'
      };
    }

    if (ad.status !== 'active' && ad.status !== 'approved') {
      return {
        canPromote: false,
        reason: 'Ad must be active or approved to promote'
      };
    }

    // Check active promotions
    const activePromotions = [];
    const now = new Date();

    if (ad.is_featured && new Date(ad.featured_until) > now) {
      activePromotions.push('featured');
    }
    if (ad.is_urgent && new Date(ad.urgent_until) > now) {
      activePromotions.push('urgent');
    }
    if (ad.is_bump_up && new Date(ad.bump_up_until) > now) {
      activePromotions.push('bump_up');
    }

    return {
      canPromote: true,
      activePromotions,
      availablePromotions: ['featured', 'urgent', 'bump_up'].filter(
        type => !activePromotions.includes(type)
      )
    };
  }
}

// Export singleton instance
module.exports = new PromotionService();
