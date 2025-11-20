const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Check if shop slug is available
router.get('/check-slug', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Slug is required',
      });
    }

    // Validate slug format (lowercase alphanumeric and hyphens only)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      });
    }

    // Check if slug is already taken by another user
    const result = await pool.query(
      'SELECT id FROM users WHERE custom_shop_slug = $1 AND id != $2',
      [slug, req.user.userId]
    );

    const available = result.rows.length === 0;

    res.json({
      success: true,
      data: {
        available,
        slug,
      },
    });
  } catch (error) {
    console.error('Error checking shop slug availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check slug availability',
    });
  }
});

// Update shop slug for authenticated user
router.put('/update-slug', authenticateToken, async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Slug is required',
      });
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      });
    }

    // Check if user has business verification
    const userCheck = await pool.query(
      'SELECT business_verification_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const verificationStatus = userCheck.rows[0].business_verification_status;
    if (verificationStatus !== 'approved' && verificationStatus !== 'verified') {
      return res.status(403).json({
        success: false,
        message: 'Only verified businesses can set custom shop URLs',
      });
    }

    // Check if slug is available
    const availabilityCheck = await pool.query(
      'SELECT id FROM users WHERE custom_shop_slug = $1 AND id != $2',
      [slug, req.user.userId]
    );

    if (availabilityCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This shop URL is already taken',
      });
    }

    // Update the custom shop slug
    const updateResult = await pool.query(
      'UPDATE users SET custom_shop_slug = $1 WHERE id = $2 RETURNING custom_shop_slug',
      [slug, req.user.userId]
    );

    res.json({
      success: true,
      data: {
        shopSlug: updateResult.rows[0].custom_shop_slug,
      },
      message: 'Shop URL updated successfully',
    });
  } catch (error) {
    console.error('Error updating shop slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop URL',
    });
  }
});

module.exports = router;
