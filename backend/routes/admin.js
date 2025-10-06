const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor, requireSuperAdmin } = require('../middleware/editorAuth');
const { catchAsync } = require('../middleware/errorHandler');

// All admin routes require authentication and editor/super admin role
// TEMPORARILY DISABLED FOR DEVELOPMENT
// router.use(authenticateToken);
// router.use(requireEditor);

// Development mock middleware
router.use((req, res, next) => {
  if (!req.user) {
    req.user = { userId: 1, role: 'editor' }; // Mock editor for development
  }
  next();
});

// Get admin dashboard stats
router.get('/stats', catchAsync(async (req, res) => {
  console.log('📊 Admin stats requested by:', req.user);
  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM ads) as total_ads,
      (SELECT COUNT(*) FROM ads WHERE status = 'active') as active_ads,
      (SELECT COUNT(*) FROM ads WHERE status = 'pending') as pending_ads,
      (SELECT COUNT(*) FROM ads WHERE created_at >= NOW() - INTERVAL '7 days') as ads_this_week,
      (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as users_this_week
  `);

  const data = stats.rows[0];

  // Convert to camelCase for frontend
  const response = {
    success: true,
    data: {
      totalUsers: parseInt(data.total_users) || 0,
      totalAds: parseInt(data.total_ads) || 0,
      activeAds: parseInt(data.active_ads) || 0,
      pendingAds: parseInt(data.pending_ads) || 0,
      adsThisWeek: parseInt(data.ads_this_week) || 0,
      usersThisWeek: parseInt(data.users_this_week) || 0,
      totalViews: 0, // TODO: Add views tracking
      todayAds: 0, // TODO: Add today's ads count
      topCategories: [] // TODO: Add top categories
    }
  };
  console.log('📊 Stats response:', response);
  res.json(response);
}));

// Get all ads for admin panel
router.get('/ads', catchAsync(async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT
      a.id,
      a.title,
      a.description,
      a.price,
      a.status,
      a.created_at,
      a.updated_at,
      u.full_name as user_name,
      u.email as user_email,
      c.name as category_name,
      l.name as location_name,
      (SELECT filename FROM ad_images WHERE ad_id = a.id AND is_primary = true LIMIT 1) as primary_image
    FROM ads a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN locations l ON a.location_id = l.id
  `;

  const params = [];
  if (status && status !== 'all') {
    query += ' WHERE a.status = $1';
    params.push(status);
  }

  query += ' ORDER BY a.created_at DESC';

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: result.rows
  });
}));

// Get all users for admin panel
router.get('/users', catchAsync(async (req, res) => {
  const result = await pool.query(`
    SELECT
      id,
      email,
      full_name,
      phone,
      is_active,
      role,
      created_at,
      (SELECT COUNT(*) FROM ads WHERE user_id = users.id) as ad_count
    FROM users
    ORDER BY created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows
  });
}));

// Update ad status
router.put('/ads/:id/status', catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['pending', 'active', 'rejected', 'expired'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const result = await pool.query(
    'UPDATE ads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }

  // TODO: Send notification to user about status change

  res.json({
    success: true,
    data: result.rows[0],
    message: `Ad status updated to ${status}`
  });
}));

// Update user status (activate/deactivate) - Super Admin only
router.put('/users/:id/status', /* requireSuperAdmin, */ catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const result = await pool.query(
    'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, full_name, is_active',
    [is_active, id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0],
    message: `User ${is_active ? 'activated' : 'deactivated'} successfully`
  });
}));

// Delete ad - Super Admin only
router.delete('/ads/:id', /* requireSuperAdmin, */ catchAsync(async (req, res) => {
  const { id } = req.params;

  // Delete ad images first
  await pool.query('DELETE FROM ad_images WHERE ad_id = $1', [id]);

  // Delete the ad
  const result = await pool.query('DELETE FROM ads WHERE id = $1 RETURNING *', [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Ad not found'
    });
  }

  res.json({
    success: true,
    message: 'Ad deleted successfully'
  });
}));

// =====================================================
// INDIVIDUAL SELLER VERIFICATION MANAGEMENT
// =====================================================

// Get all individual verification requests
router.get('/individual-verifications', catchAsync(async (req, res) => {
  const { status } = req.query;

  let query = `
    SELECT
      ivr.*,
      u.full_name,
      u.email,
      u.phone
    FROM individual_verification_requests ivr
    JOIN users u ON ivr.user_id = u.id
  `;

  const params = [];
  if (status) {
    query += ' WHERE ivr.status = $1';
    params.push(status);
  }

  query += ' ORDER BY ivr.created_at DESC';

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: result.rows
  });
}));

// Get single verification request details
router.get('/individual-verifications/:id', catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      ivr.*,
      u.full_name,
      u.email,
      u.phone,
      u.seller_slug
    FROM individual_verification_requests ivr
    JOIN users u ON ivr.user_id = u.id
    WHERE ivr.id = $1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Verification request not found'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Approve individual verification
router.post('/individual-verifications/:id/approve', catchAsync(async (req, res) => {
  const { id } = req.params;
  const editorId = req.user.userId;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get the verification request with full_name
    const verificationResult = await client.query(
      'SELECT user_id, full_name FROM individual_verification_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (verificationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Pending verification request not found'
      });
    }

    const userId = verificationResult.rows[0].user_id;
    const fullName = verificationResult.rows[0].full_name;

    // Generate seller slug from user's full name
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .trim()
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-');          // Replace multiple hyphens with single
    };

    let sellerSlug = generateSlug(fullName);

    // Check if slug exists and make it unique
    const existingSlug = await client.query('SELECT id FROM users WHERE seller_slug = $1', [sellerSlug]);
    if (existingSlug.rows.length > 0) {
      sellerSlug = `${sellerSlug}-${Date.now()}`;
    }

    // Update verification request
    await client.query(
      `UPDATE individual_verification_requests
       SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      ['approved', editorId, id]
    );

    // Mark user as verified, update full_name to verified name, set seller_slug and verified_seller_name (locked while verified)
    await client.query(
      `UPDATE users
       SET individual_verified = true,
           individual_verified_at = CURRENT_TIMESTAMP,
           full_name = $1,
           seller_slug = $2,
           verified_seller_name = $3
       WHERE id = $4`,
      [fullName, sellerSlug, fullName, userId]
    );

    await client.query('COMMIT');

    console.log('✅ Individual verification approved:', { id, userId, editorId });

    res.json({
      success: true,
      message: 'Verification request approved successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Reject individual verification
router.post('/individual-verifications/:id/reject', catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const editorId = req.user.userId;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const result = await pool.query(
    `UPDATE individual_verification_requests
     SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $3
     WHERE id = $4 AND status = $5
     RETURNING user_id`,
    ['rejected', editorId, reason, id, 'pending']
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Pending verification request not found'
    });
  }

  console.log('❌ Individual verification rejected:', { id, reason, editorId });

  res.json({
    success: true,
    message: 'Verification request rejected successfully'
  });
}));

// Revoke individual seller verification (for violations)
router.post('/revoke-individual-verification/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const editorId = req.user.userId;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason for revocation is required'
    });
  }

  // Revoke verification and clear expiry date - user becomes normal user immediately
  await pool.query(
    `UPDATE users
     SET individual_verified = false,
         individual_verification_expires_at = NULL,
         verified_seller_name = NULL
     WHERE id = $1 AND individual_verified = true`,
    [userId]
  );

  console.log('🚫 Individual verification revoked:', { userId, reason, editorId });

  res.json({
    success: true,
    message: 'Individual verification revoked successfully. User can now edit their name.'
  });
}));

// Revoke business verification (for violations)
router.post('/revoke-business-verification/:userId', catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const editorId = req.user.userId;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Reason for revocation is required'
    });
  }

  // Revoke verification and clear expiry date - user becomes normal user immediately
  await pool.query(
    `UPDATE users
     SET business_verification_status = 'revoked',
         business_verification_expires_at = NULL,
         account_type = 'individual'
     WHERE id = $1 AND business_verification_status = 'approved'`,
    [userId]
  );

  console.log('🚫 Business verification revoked:', { userId, reason, editorId });

  res.json({
    success: true,
    message: 'Business verification revoked successfully. User reverted to individual account.'
  });
}));

module.exports = router;
