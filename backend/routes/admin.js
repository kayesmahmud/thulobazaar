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

module.exports = router;
