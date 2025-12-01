/**
 * AD PROMOTION SERVICE
 * ====================
 * Handles activation and management of ad promotions
 *
 * Promotion Types:
 * - Featured: Homepage + Search + Category visibility
 * - Urgent: Priority placement, quick sales
 * - Sticky/Bump Up: Move to top of listings, cost-effective boost
 *
 * Duration Options: 3, 7, 15 days
 * Pricing by User Type: Individual, Individual Verified, Business Verified
 */

import { prisma } from '@thulobazaar/database';

export type PromotionType = 'featured' | 'urgent' | 'sticky';
export type AccountType = 'individual' | 'individual_verified' | 'business';

interface PricingStructure {
  [key: string]: {
    [duration: number]: {
      individual: number;
      individual_verified: number;
      business: number;
    };
  };
}

interface ActivationResult {
  success: boolean;
  promotionId: number;
  adId: number;
  promotionType: string;
  durationDays: number;
  startedAt: Date;
  expiresAt: Date;
  amountPaid: number;
  transactionId: string;
}

class PromotionService {
  /**
   * Get promotion pricing structure
   */
  getPricing(): PricingStructure {
    return {
      featured: {
        3: { individual: 1000, individual_verified: 800, business: 600 },
        7: { individual: 2000, individual_verified: 1600, business: 1200 },
        15: { individual: 3500, individual_verified: 2800, business: 2100 },
      },
      urgent: {
        3: { individual: 500, individual_verified: 400, business: 300 },
        7: { individual: 1000, individual_verified: 800, business: 600 },
        15: { individual: 1750, individual_verified: 1400, business: 1050 },
      },
      sticky: {
        3: { individual: 100, individual_verified: 85, business: 70 },
        7: { individual: 200, individual_verified: 170, business: 140 },
        15: { individual: 350, individual_verified: 297, business: 245 },
      },
    };
  }

  /**
   * Determine account type based on user verification status
   */
  async getUserAccountType(userId: number): Promise<AccountType> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        individual_verified: true,
        business_verification_status: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.business_verification_status === 'verified' || user.business_verification_status === 'approved') {
      return 'business';
    } else if (user.individual_verified) {
      return 'individual_verified';
    } else {
      return 'individual';
    }
  }

  /**
   * Calculate promotion price
   */
  async calculatePrice(promotionType: PromotionType, durationDays: number, userId: number) {
    const pricing = this.getPricing();

    if (!pricing[promotionType]) {
      throw new Error(`Invalid promotion type: ${promotionType}`);
    }

    if (![3, 7, 15].includes(durationDays)) {
      throw new Error(`Invalid duration: ${durationDays}. Must be 3, 7, or 15 days.`);
    }

    const accountType = await this.getUserAccountType(userId);
    const price = pricing[promotionType][durationDays][accountType];

    return {
      promotionType,
      durationDays,
      accountType,
      price,
      currency: 'NPR',
    };
  }

  /**
   * Activate promotion after successful payment
   */
  async activatePromotion(
    adId: number,
    userId: number,
    promotionType: PromotionType,
    durationDays: number,
    amount: number,
    transactionId: string
  ): Promise<ActivationResult> {
    console.log('🚀 Activating promotion:', {
      adId,
      userId,
      promotionType,
      durationDays,
      amount,
      transactionId,
    });

    // 1. Verify ad exists and belongs to user
    const ad = await prisma.ads.findFirst({
      where: { id: adId },
      select: { id: true, user_id: true, title: true, status: true },
    });

    if (!ad) {
      throw new Error('Ad not found');
    }

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

    // 3. Determine account type
    const accountType = await this.getUserAccountType(userId);

    // 4. Create promotion record using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Insert promotion
      const promotion = await tx.ad_promotions.create({
        data: {
          ad_id: adId,
          user_id: userId,
          promotion_type: promotionType,
          duration_days: durationDays,
          price_paid: amount,
          payment_reference: transactionId,
          account_type: accountType,
          payment_method: 'mock',
          starts_at: startDate,
          expires_at: expiryDate,
          is_active: true,
        },
      });

      // Deactivate any existing active promotions for this ad
      await tx.ad_promotions.updateMany({
        where: {
          ad_id: adId,
          is_active: true,
          id: { not: promotion.id },
        },
        data: { is_active: false },
      });

      // Update ad with promotion flags
      const updateData: any = {
        promoted_at: new Date(),
        is_featured: false,
        featured_until: null,
        is_urgent: false,
        urgent_until: null,
        is_sticky: false,
        sticky_until: null,
        is_bumped: false,
        bump_expires_at: null,
      };

      // Set the specific promotion flag
      if (promotionType === 'featured') {
        updateData.is_featured = true;
        updateData.featured_until = expiryDate;
      } else if (promotionType === 'urgent') {
        updateData.is_urgent = true;
        updateData.urgent_until = expiryDate;
      } else if (promotionType === 'sticky') {
        updateData.is_sticky = true;
        updateData.sticky_until = expiryDate;
        updateData.is_bumped = true;
        updateData.bump_expires_at = expiryDate;
      }

      await tx.ads.update({
        where: { id: adId },
        data: updateData,
      });

      return promotion;
    });

    console.log('✅ Promotion activated successfully:', {
      promotionId: result.id,
      adId,
      promotionType,
      expiresAt: expiryDate,
    });

    return {
      success: true,
      promotionId: result.id,
      adId,
      promotionType,
      durationDays,
      startedAt: startDate,
      expiresAt: expiryDate,
      amountPaid: amount,
      transactionId,
    };
  }

  /**
   * Deactivate expired promotions (cron job)
   */
  async deactivateExpiredPromotions() {
    console.log('🔄 Checking for expired promotions...');

    const expiredPromotions = await prisma.ad_promotions.findMany({
      where: {
        is_active: true,
        expires_at: { lt: new Date() },
      },
    });

    if (expiredPromotions.length === 0) {
      console.log('✅ No expired promotions found');
      return { deactivated: 0 };
    }

    console.log(`📊 Found ${expiredPromotions.length} expired promotions`);

    for (const promo of expiredPromotions) {
      try {
        await prisma.$transaction(async (tx) => {
          // Mark promotion as inactive
          await tx.ad_promotions.update({
            where: { id: promo.id },
            data: { is_active: false },
          });

          // Remove promotion flag from ad
          const updateData: any = {};
          if (promo.promotion_type === 'featured') {
            updateData.is_featured = false;
            updateData.featured_until = null;
          } else if (promo.promotion_type === 'urgent') {
            updateData.is_urgent = false;
            updateData.urgent_until = null;
          } else if (promo.promotion_type === 'sticky') {
            updateData.is_sticky = false;
            updateData.sticky_until = null;
            updateData.is_bumped = false;
            updateData.bump_expires_at = null;
          }

          await tx.ads.update({
            where: { id: promo.ad_id },
            data: updateData,
          });
        });

        console.log(`✅ Deactivated ${promo.promotion_type} promotion for ad ${promo.ad_id}`);
      } catch (error) {
        console.error(`❌ Error deactivating promotion ${promo.id}:`, error);
      }
    }

    return { deactivated: expiredPromotions.length };
  }
}

export const promotionService = new PromotionService();
export default promotionService;
