const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Middleware to require editor/admin role
const requireEditor = (req, res, next) => {
  if (!req.user || (req.user.role !== 'editor' && req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Editor or admin role required.'
    });
  }
  next();
};

/**
 * GET /api/promotion-pricing
 * Get all active promotion pricing (public endpoint for users to see prices)
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        promotion_type,
        duration_days,
        account_type,
        price,
        discount_percentage,
        is_active
      FROM promotion_pricing
      WHERE is_active = true
      ORDER BY
        CASE promotion_type
          WHEN 'featured' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'sticky' THEN 3
          WHEN 'bump_up' THEN 4
        END,
        duration_days ASC,
        account_type DESC
    `);

    // Group by promotion type and duration for easier frontend use
    const pricingMap = {};
    result.rows.forEach(row => {
      if (!pricingMap[row.promotion_type]) {
        pricingMap[row.promotion_type] = {};
      }
      if (!pricingMap[row.promotion_type][row.duration_days]) {
        pricingMap[row.promotion_type][row.duration_days] = {};
      }
      pricingMap[row.promotion_type][row.duration_days][row.account_type] = {
        id: row.id,
        price: parseFloat(row.price),
        discount_percentage: row.discount_percentage
      };
    });

    res.json({
      success: true,
      data: {
        pricing: pricingMap,
        raw: result.rows // Also send raw data for flexibility
      }
    });
  } catch (error) {
    console.error('Error fetching promotion pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion pricing'
    });
  }
});

/**
 * GET /api/promotion-pricing/calculate
 * Calculate price for a specific promotion
 */
router.get('/calculate', authenticateToken, async (req, res) => {
  try {
    const { promotionType, durationDays, adId } = req.query;

    if (!promotionType || !durationDays) {
      return res.status(400).json({
        success: false,
        message: 'Promotion type and duration are required'
      });
    }

    // Get user's account type
    const userResult = await pool.query(
      'SELECT account_type, business_verification_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const accountType = user.business_verification_status === 'verified' ? 'business' : 'individual';

    // Get pricing
    const pricingResult = await pool.query(
      `SELECT price, discount_percentage
       FROM promotion_pricing
       WHERE promotion_type = $1
         AND duration_days = $2
         AND account_type = $3
         AND is_active = true`,
      [promotionType, parseInt(durationDays), accountType]
    );

    if (pricingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found for the selected options'
      });
    }

    const pricing = pricingResult.rows[0];

    res.json({
      success: true,
      data: {
        promotionType,
        durationDays: parseInt(durationDays),
        accountType,
        price: parseFloat(pricing.price),
        discountPercentage: pricing.discount_percentage,
        currency: 'NPR'
      }
    });
  } catch (error) {
    console.error('Error calculating promotion price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price'
    });
  }
});

/**
 * ADMIN ENDPOINTS - Require editor/admin role
 */

/**
 * GET /api/promotion-pricing/admin/all
 * Get ALL promotion pricing including inactive (admin only)
 */
router.get('/admin/all', authenticateToken, requireEditor, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        promotion_type,
        duration_days,
        account_type,
        price,
        discount_percentage,
        is_active,
        created_at,
        updated_at
      FROM promotion_pricing
      ORDER BY
        CASE promotion_type
          WHEN 'featured' THEN 1
          WHEN 'urgent' THEN 2
          WHEN 'sticky' THEN 3
          WHEN 'bump_up' THEN 4
        END,
        duration_days ASC,
        account_type DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all promotion pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion pricing'
    });
  }
});

/**
 * PUT /api/promotion-pricing/:id
 * Update promotion pricing (admin only)
 */
router.put('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const { price, discount_percentage, is_active } = req.body;

    if (price === undefined || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    const result = await pool.query(
      `UPDATE promotion_pricing
       SET price = $1,
           discount_percentage = $2,
           is_active = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [price, discount_percentage || 0, is_active !== undefined ? is_active : true, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing entry not found'
      });
    }

    console.log(`✅ Promotion pricing updated by ${req.user.email}:`, result.rows[0]);

    res.json({
      success: true,
      message: 'Promotion pricing updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating promotion pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion pricing'
    });
  }
});

/**
 * POST /api/promotion-pricing
 * Create new promotion pricing entry (admin only)
 */
router.post('/', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { promotion_type, duration_days, account_type, price, discount_percentage } = req.body;

    if (!promotion_type || !duration_days || !account_type || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Promotion type, duration, account type, and price are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO promotion_pricing
       (promotion_type, duration_days, account_type, price, discount_percentage, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [promotion_type, duration_days, account_type, price, discount_percentage || 0]
    );

    console.log(`✅ Promotion pricing created by ${req.user.email}:`, result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Promotion pricing created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Pricing for this combination already exists'
      });
    }
    console.error('Error creating promotion pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promotion pricing'
    });
  }
});

/**
 * DELETE /api/promotion-pricing/:id
 * Soft delete (deactivate) promotion pricing (admin only)
 */
router.delete('/:id', authenticateToken, requireEditor, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE promotion_pricing
       SET is_active = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pricing entry not found'
      });
    }

    console.log(`✅ Promotion pricing deactivated by ${req.user.email}:`, result.rows[0]);

    res.json({
      success: true,
      message: 'Promotion pricing deactivated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting promotion pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion pricing'
    });
  }
});

module.exports = router;
