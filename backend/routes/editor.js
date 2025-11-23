const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor, requireSuperAdmin } = require('../middleware/editorAuth');
const { logActivity } = require('../middleware/activityLogger');
const { catchAsync, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { avatarUpload } = require('../middleware/avatarUpload');
const { sendSuspensionEmail, sendUnsuspensionEmail } = require('../services/emailService');

// Root Admin Login - NO AUTH REQUIRED
router.post('/root-login', catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Hardcoded root admin credentials
  const ROOT_EMAIL = 'root@thulobazaar.com';
  const ROOT_PASSWORD = 'rootadmin';

  if (email !== ROOT_EMAIL || password !== ROOT_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if root user exists in database
  let rootUser = await pool.query(
    'SELECT id, email, full_name, role FROM users WHERE email = $1 AND role = $2',
    [ROOT_EMAIL, 'root']
  );

  // If root user doesn't exist, create it
  if (rootUser.rows.length === 0) {
    const bcrypt = require('bcrypt');
    const { SECURITY } = require('../config/constants');
    const hashedPassword = await bcrypt.hash(ROOT_PASSWORD, SECURITY.BCRYPT_SALT_ROUNDS);

    rootUser = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, 'Root Administrator', 'root', true)
       RETURNING id, email, full_name, role`,
      [ROOT_EMAIL, hashedPassword]
    );
  }

  const user = rootUser.rows[0];

  // Update last_login
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const jwt = require('jsonwebtoken');
  const config = require('../config/env');
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    config.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    }
  });
}));

// Middleware for root-only routes
function requireRoot(req, res, next) {
  if (!req.user || req.user.role !== 'root') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Root Admin role required.'
    });
  }
  next();
}

// All editor routes require authentication and editor role
router.use(authenticateToken);
router.use(requireEditor);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Generate a unique shop_slug by checking for collisions and appending numbers
 * @param {string} name - The business/individual name to convert to slug
 * @returns {Promise<string>} - Unique slug (e.g., "chetan-thapa" or "chetan-thapa-1")
 */
async function generateUniqueShopSlug(name) {
  // Generate base slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Check if base slug is available
  const existingResult = await pool.query(
    'SELECT id FROM users WHERE shop_slug = $1 LIMIT 1',
    [baseSlug]
  );

  // If no collision, return base slug
  if (existingResult.rows.length === 0) {
    return baseSlug;
  }

  // Collision detected - find next available number
  let counter = 1;
  while (true) {
    const testSlug = `${baseSlug}-${counter}`;
    const result = await pool.query(
      'SELECT id FROM users WHERE shop_slug = $1 LIMIT 1',
      [testSlug]
    );

    if (result.rows.length === 0) {
      return testSlug; // Found unique slug
    }

    counter++;
  }
}

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

router.get('/stats', catchAsync(async (req, res) => {
  const stats = await pool.query(`
    SELECT
      -- Total counts
      (SELECT COUNT(*) FROM ads WHERE deleted_at IS NULL) as total_ads,
      (SELECT COUNT(*) FROM ads WHERE status = 'pending' AND deleted_at IS NULL) as pending_ads,
      (SELECT COUNT(*) FROM ads WHERE status = 'approved' AND deleted_at IS NULL) as active_ads,
      (SELECT COUNT(*) FROM ads WHERE status = 'rejected' AND deleted_at IS NULL) as rejected_ads,

      -- Pending verifications count (business + individual)
      (
        (SELECT COUNT(*) FROM business_verification_requests WHERE status = 'pending') +
        (SELECT COUNT(*) FROM individual_verification_requests WHERE status = 'pending')
      ) as pending_verifications
  `);

  // Convert snake_case to camelCase for frontend
  const result = stats.rows[0];
  res.json({
    success: true,
    data: {
      totalAds: parseInt(result.total_ads),
      pendingAds: parseInt(result.pending_ads),
      activeAds: parseInt(result.active_ads),
      rejectedAds: parseInt(result.rejected_ads),
      pendingVerifications: parseInt(result.pending_verifications)
    }
  });
}));

// Get editor's work stats for today
router.get('/my-work-today', catchAsync(async (req, res) => {
  const editorId = req.user.userId;

  const stats = await pool.query(`
    SELECT
      -- Ads approved today by this editor
      (SELECT COUNT(*) FROM ads
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as ads_approved_today,

      -- Ads rejected today by this editor
      (SELECT COUNT(*) FROM ads
       WHERE reviewed_by = $1
       AND status = 'rejected'
       AND DATE(reviewed_at) = CURRENT_DATE) as ads_rejected_today,

      -- Ads edited today by this editor (from activity logs)
      (SELECT COUNT(*) FROM admin_activity_logs
       WHERE admin_id = $1
       AND action_type IN ('edit_ad', 'update_ad')
       AND DATE(created_at) = CURRENT_DATE) as ads_edited_today,

      -- Business verifications approved today by this editor
      (SELECT COUNT(*) FROM business_verification_requests
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as business_verifications_today,

      -- Individual verifications approved today by this editor
      (SELECT COUNT(*) FROM individual_verification_requests
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as individual_verifications_today
  `, [editorId]);

  const result = stats.rows[0];

  res.json({
    success: true,
    data: {
      adsApprovedToday: parseInt(result.ads_approved_today),
      adsRejectedToday: parseInt(result.ads_rejected_today),
      adsEditedToday: parseInt(result.ads_edited_today),
      businessVerificationsToday: parseInt(result.business_verifications_today),
      individualVerificationsToday: parseInt(result.individual_verifications_today)
    }
  });
}));

// Get editor's profile with last login
router.get('/profile', catchAsync(async (req, res) => {
  const editorId = req.user.userId;
  const role = req.user.role;

  // Query from users table where editors and super_admins are stored
  const result = await pool.query(
    `SELECT id, email, full_name, is_active, created_at, last_login, avatar
     FROM users
     WHERE id = $1 AND (role = 'editor' OR role = 'super_admin')`,
    [editorId]
  );

  const profile = result.rows[0];

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  res.json({
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      isActive: profile.is_active,
      lastLogin: profile.last_login,
      createdAt: profile.created_at,
      avatar: profile.avatar
    }
  });
}));

// Get reported ads count (pending reports)
router.get('/reported-ads/count', catchAsync(async (req, res) => {
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM ad_reports
    WHERE status = 'pending'
  `);

  res.json({
    success: true,
    data: {
      count: parseInt(result.rows[0].count)
    }
  });
}));

// Get all reported ads with details
router.get('/reported-ads', catchAsync(async (req, res) => {
  const { status = 'pending', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await pool.query(`
    SELECT
      ar.id as report_id,
      ar.ad_id,
      ar.reason,
      ar.description,
      ar.status,
      ar.created_at as reported_at,
      ar.reporter_id,
      a.title as ad_title,
      a.description as ad_description,
      a.price,
      a.status as ad_status,
      u_reporter.full_name as reporter_name,
      u_reporter.email as reporter_email,
      u_seller.full_name as seller_name,
      u_seller.email as seller_email
    FROM ad_reports ar
    LEFT JOIN ads a ON ar.ad_id = a.id
    LEFT JOIN users u_reporter ON ar.reporter_id = u_reporter.id
    LEFT JOIN users u_seller ON a.user_id = u_seller.id
    WHERE ar.status = $1
    ORDER BY ar.created_at DESC
    LIMIT $2 OFFSET $3
  `, [status, parseInt(limit), offset]);

  res.json({
    success: true,
    data: result.rows.map(row => ({
      reportId: row.report_id,
      adId: row.ad_id,
      adTitle: row.ad_title,
      adDescription: row.ad_description,
      price: row.price,
      adStatus: row.ad_status,
      reason: row.reason,
      description: row.description,
      status: row.status,
      reportedAt: row.reported_at,
      reporterId: row.reporter_id,
      reporterName: row.reporter_name,
      reporterEmail: row.reporter_email,
      sellerName: row.seller_name,
      sellerEmail: row.seller_email,
    }))
  });
}));

// =====================================================
// AD MANAGEMENT
// =====================================================

// Get all ads with filters
router.get('/ads', catchAsync(async (req, res) => {
  const {
    status,
    category,
    location,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    includeDeleted = 'false'
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Filter by soft delete
  if (includeDeleted === 'false') {
    whereConditions.push('a.deleted_at IS NULL');
  }

  // Filter by status
  if (status) {
    whereConditions.push(`a.status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }

  // Filter by category
  if (category) {
    whereConditions.push(`a.category_id = $${paramCount}`);
    params.push(category);
    paramCount++;
  }

  // Filter by location
  if (location) {
    whereConditions.push(`a.location_id = $${paramCount}`);
    params.push(location);
    paramCount++;
  }

  // Search
  if (search) {
    whereConditions.push(`(a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM ads a ${whereClause}`,
    params
  );

  // Get ads
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT
       a.id, a.title, a.description, a.price, a.condition, a.status,
       a.view_count, a.created_at, a.updated_at, a.deleted_at,
       a.deleted_by, a.deletion_reason, a.reviewed_by, a.reviewed_at,
       c.name as category_name,
       l.name as location_name,
       u.full_name as seller_name, u.email as seller_email,
       reviewer.full_name as reviewer_name,
       deleter.full_name as deleted_by_name
     FROM ads a
     LEFT JOIN categories c ON a.category_id = c.id
     LEFT JOIN locations l ON a.location_id = l.id
     LEFT JOIN users u ON a.user_id = u.id
     LEFT JOIN users reviewer ON a.reviewed_by = reviewer.id
     LEFT JOIN users deleter ON a.deleted_by = deleter.id
     ${whereClause}
     ORDER BY a.${sortBy} ${sortOrder}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Approve ad
router.put('/ads/:id/approve',
  logActivity('approve_ad', 'ad'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const editorId = req.user.userId;

    const result = await pool.query(
      `UPDATE ads
       SET status = 'approved',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [editorId, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Ad not found or already deleted');
    }

    res.json({
      success: true,
      message: 'Ad approved successfully',
      data: result.rows[0]
    });
  })
);

// Reject ad
router.put('/ads/:id/reject',
  logActivity('reject_ad', 'ad'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const editorId = req.user.userId;

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    const result = await pool.query(
      `UPDATE ads
       SET status = 'rejected',
           reviewed_by = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [editorId, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Ad not found or already deleted');
    }

    res.json({
      success: true,
      message: 'Ad rejected successfully',
      data: result.rows[0]
    });
  })
);

// Soft delete ad
router.delete('/ads/:id',
  logActivity('delete_ad', 'ad'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const editorId = req.user.userId;

    const result = await pool.query(
      `UPDATE ads
       SET deleted_at = CURRENT_TIMESTAMP,
           deleted_by = $1,
           deletion_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [editorId, reason || 'No reason provided', id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Ad not found or already deleted');
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully',
      data: result.rows[0]
    });
  })
);

// Restore deleted ad
router.put('/ads/:id/restore',
  logActivity('restore_ad', 'ad'),
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE ads
       SET deleted_at = NULL,
           deleted_by = NULL,
           deletion_reason = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Deleted ad not found');
    }

    res.json({
      success: true,
      message: 'Ad restored successfully',
      data: result.rows[0]
    });
  })
);

// Bulk actions on ads
router.post('/ads/bulk-action',
  logActivity('bulk_action_ads', 'ad'),
  catchAsync(async (req, res) => {
    const { action, adIds, reason } = req.body;
    const editorId = req.user.userId;

    if (!action || !adIds || !Array.isArray(adIds) || adIds.length === 0) {
      throw new ValidationError('Action and adIds array are required');
    }

    let query;
    let params;

    switch (action) {
      case 'approve':
        query = `UPDATE ads
                 SET status = 'approved',
                     reviewed_by = $1,
                     reviewed_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ANY($2) AND deleted_at IS NULL
                 RETURNING id`;
        params = [editorId, adIds];
        break;

      case 'reject':
        if (!reason) {
          throw new ValidationError('Rejection reason is required');
        }
        query = `UPDATE ads
                 SET status = 'rejected',
                     reviewed_by = $1,
                     reviewed_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ANY($2) AND deleted_at IS NULL
                 RETURNING id`;
        params = [editorId, adIds];
        break;

      case 'delete':
        query = `UPDATE ads
                 SET deleted_at = CURRENT_TIMESTAMP,
                     deleted_by = $1,
                     deletion_reason = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ANY($3) AND deleted_at IS NULL
                 RETURNING id`;
        params = [editorId, reason || 'Bulk deletion', adIds];
        break;

      case 'restore':
        query = `UPDATE ads
                 SET deleted_at = NULL,
                     deleted_by = NULL,
                     deletion_reason = NULL,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ANY($1) AND deleted_at IS NOT NULL
                 RETURNING id`;
        params = [adIds];
        break;

      default:
        throw new ValidationError('Invalid action. Must be: approve, reject, delete, or restore');
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: `${action} completed successfully`,
      data: {
        affected: result.rows.length,
        ids: result.rows.map(row => row.id)
      }
    });
  })
);

// =====================================================
// USER MANAGEMENT
// =====================================================

// Get all users with filters
router.get('/users', catchAsync(async (req, res) => {
  const {
    role,
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Exclude editor, super_admin, and root roles by default (only show regular users)
  if (!role) {
    whereConditions.push(`u.role NOT IN ('editor', 'super_admin', 'root')`);
  } else {
    // Filter by specific role if provided
    whereConditions.push(`u.role = $${paramCount}`);
    params.push(role);
    paramCount++;
  }

  // Filter by active/suspended status
  if (status === 'active') {
    whereConditions.push('u.is_active = true AND u.is_suspended = false');
  } else if (status === 'suspended') {
    whereConditions.push('u.is_suspended = true');
  }

  // Search
  if (search) {
    whereConditions.push(`(u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );

  // Get users
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT
       u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.is_verified,
       u.is_suspended, u.suspended_until, u.suspension_reason,
       u.account_type, u.business_name, u.business_verification_status, u.individual_verified,
       u.created_at, u.avatar, u.shop_slug,
       l.name as location_name,
       suspender.full_name as suspended_by_name,
       (SELECT COUNT(*) FROM ads WHERE user_id = u.id AND deleted_at IS NULL) as ad_count
     FROM users u
     LEFT JOIN locations l ON u.location_id = l.id
     LEFT JOIN users suspender ON u.suspended_by = suspender.id
     ${whereClause}
     ORDER BY u.${sortBy} ${sortOrder}
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Suspend user
router.put('/users/:id/suspend',
  logActivity('suspend_user', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason, duration } = req.body; // duration in days, null = permanent
    const editorId = req.user.userId;

    if (!reason) {
      throw new ValidationError('Suspension reason is required');
    }

    let suspendedUntil = null;
    if (duration && duration > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + duration);
    }

    const result = await pool.query(
      `UPDATE users
       SET is_suspended = true,
           suspended_at = CURRENT_TIMESTAMP,
           suspended_until = $1,
           suspended_by = $2,
           suspension_reason = $3,
           is_active = false
       WHERE id = $4
       RETURNING id, full_name, email, is_suspended, suspended_until, suspension_reason`,
      [suspendedUntil, editorId, reason, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];

    // Send suspension email notification
    try {
      await sendSuspensionEmail(
        { email: user.email, full_name: user.full_name },
        {
          reason: user.suspension_reason,
          suspendedUntil: user.suspended_until,
          isPermanent: !user.suspended_until
        }
      );
    } catch (emailError) {
      console.error('Failed to send suspension email:', emailError);
      // Don't fail the suspension if email fails
    }

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: user
    });
  })
);

// Unsuspend user
router.put('/users/:id/unsuspend',
  logActivity('unsuspend_user', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET is_suspended = false,
           suspended_at = NULL,
           suspended_until = NULL,
           suspended_by = NULL,
           suspension_reason = NULL,
           is_active = true
       WHERE id = $1
       RETURNING id, full_name, email, is_suspended`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = result.rows[0];

    // Send unsuspension email notification
    try {
      await sendUnsuspensionEmail({
        email: user.email,
        full_name: user.full_name
      });
    } catch (emailError) {
      console.error('Failed to send unsuspension email:', emailError);
      // Don't fail the unsuspension if email fails
    }

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      data: user
    });
  })
);

// Verify user
router.put('/users/:id/verify',
  logActivity('verify_user', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const editorId = req.user.userId;

    const result = await pool.query(
      `UPDATE users
       SET is_verified = true,
           verified_at = CURRENT_TIMESTAMP,
           verified_by = $1
       WHERE id = $2
       RETURNING id, full_name, email, is_verified, verified_at`,
      [editorId, id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      message: 'User verified successfully',
      data: result.rows[0]
    });
  })
);

// Unverify user
router.put('/users/:id/unverify',
  logActivity('unverify_user', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET is_verified = false,
           verified_at = NULL,
           verified_by = NULL
       WHERE id = $1
       RETURNING id, full_name, email, is_verified`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      message: 'User verification removed successfully',
      data: result.rows[0]
    });
  })
);

// =====================================================
// ACTIVITY LOGS
// =====================================================

// Get activity logs
router.get('/activity-logs', catchAsync(async (req, res) => {
  const {
    adminId,
    actionType,
    targetType,
    page = 1,
    limit = 50
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  if (adminId) {
    whereConditions.push(`admin_id = $${paramCount}`);
    params.push(adminId);
    paramCount++;
  }

  if (actionType) {
    whereConditions.push(`action_type = $${paramCount}`);
    params.push(actionType);
    paramCount++;
  }

  if (targetType) {
    whereConditions.push(`target_type = $${paramCount}`);
    params.push(targetType);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM admin_activity_logs ${whereClause}`,
    params
  );

  // Get logs
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT
       l.id, l.action_type, l.target_type, l.target_id, l.details,
       l.ip_address, l.created_at,
       u.full_name as admin_name, u.email as admin_email
     FROM admin_activity_logs l
     LEFT JOIN users u ON l.admin_id = u.id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// =====================================================
// VERIFICATION MANAGEMENT
// =====================================================

// Get all pending verifications (business + individual)
router.get('/verifications', catchAsync(async (req, res) => {
  // Get pending business verifications
  const businessVerifications = await pool.query(`
    SELECT
      bvr.id,
      bvr.user_id,
      bvr.business_name,
      bvr.business_license_document,
      bvr.business_category,
      bvr.business_description,
      bvr.business_website,
      bvr.business_phone,
      bvr.business_address,
      bvr.payment_reference,
      bvr.payment_amount,
      bvr.status,
      bvr.created_at,
      u.email,
      u.full_name,
      'business' as type
    FROM business_verification_requests bvr
    LEFT JOIN users u ON bvr.user_id = u.id
    WHERE bvr.status = 'pending'
    ORDER BY bvr.created_at DESC
  `);

  // Get pending individual verifications
  const individualVerifications = await pool.query(`
    SELECT
      ivr.id,
      ivr.user_id,
      ivr.full_name,
      ivr.id_document_type,
      ivr.id_document_number,
      ivr.id_document_front,
      ivr.id_document_back,
      ivr.selfie_with_id,
      ivr.status,
      ivr.created_at,
      u.email,
      'individual' as type
    FROM individual_verification_requests ivr
    LEFT JOIN users u ON ivr.user_id = u.id
    WHERE ivr.status = 'pending'
    ORDER BY ivr.created_at DESC
  `);

  // Combine both arrays
  const allVerifications = [
    ...businessVerifications.rows,
    ...individualVerifications.rows
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({
    success: true,
    data: allVerifications
  });
}));

// Review business verification
router.post('/verifications/business/:id/:action', catchAsync(async (req, res) => {
  const { id, action } = req.params;
  const { reason } = req.body;
  const editorId = req.user.userId;

  if (!['approve', 'reject'].includes(action)) {
    throw new ValidationError('Invalid action. Must be approve or reject');
  }

  if (action === 'reject' && !reason) {
    throw new ValidationError('Rejection reason is required');
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update verification request
  const result = await pool.query(
    `UPDATE business_verification_requests
     SET status = $1,
         rejection_reason = $2,
         reviewed_by = $3,
         reviewed_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND status = 'pending'
     RETURNING *`,
    [newStatus, action === 'reject' ? reason : null, editorId, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Verification request not found or already processed');
  }

  const verificationData = result.rows[0];

  // If approved, update user's profile to business account
  if (action === 'approve') {
    // Generate unique shop_slug from business_name (handles collisions with -1, -2, etc.)
    const shopSlug = await generateUniqueShopSlug(verificationData.business_name);

    await pool.query(
      `UPDATE users
       SET account_type = 'business',
           business_verification_status = 'approved',
           business_name = $2,
           shop_slug = $3,
           full_name = $2
       WHERE id = $1`,
      [verificationData.user_id, verificationData.business_name, shopSlug]
    );

    console.log(`✅ Business verification approved: ${verificationData.business_name}`);
    console.log(`   Shop URL: /shop/${shopSlug}`);
    console.log(`   Profile name updated and locked to: ${verificationData.business_name}`);
  } else if (action === 'reject') {
    // Update user's business_verification_status to 'rejected'
    await pool.query(
      `UPDATE users
       SET business_verification_status = 'rejected'
       WHERE id = $1`,
      [verificationData.user_id]
    );

    console.log(`❌ Business verification rejected for user ID ${verificationData.user_id}`);
    console.log(`   Reason: ${reason}`);
  }

  res.json({
    success: true,
    message: `Business verification ${action}d successfully`,
    data: result.rows[0]
  });
}));

// Review individual verification
router.post('/verifications/individual/:id/:action', catchAsync(async (req, res) => {
  const { id, action } = req.params;
  const { reason } = req.body;
  const editorId = req.user.userId;

  if (!['approve', 'reject'].includes(action)) {
    throw new ValidationError('Invalid action. Must be approve or reject');
  }

  if (action === 'reject' && !reason) {
    throw new ValidationError('Rejection reason is required');
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  // Update verification request
  const result = await pool.query(
    `UPDATE individual_verification_requests
     SET status = $1,
         rejection_reason = $2,
         reviewed_by = $3,
         reviewed_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND status = 'pending'
     RETURNING *`,
    [newStatus, action === 'reject' ? reason : null, editorId, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Verification request not found or already processed');
  }

  // If approved, update user's individual_verified status
  if (action === 'approve') {
    const verificationData = result.rows[0];

    // Generate unique shop_slug from full_name (handles collisions with -1, -2, etc.)
    const shopSlug = await generateUniqueShopSlug(verificationData.full_name);

    await pool.query(
      `UPDATE users
       SET individual_verified = true,
           full_name = $2,
           seller_slug = $3,
           shop_slug = $3
       WHERE id = $1`,
      [verificationData.user_id, verificationData.full_name, shopSlug]
    );

    console.log(`✅ Individual verification approved: ${verificationData.full_name}`);
    console.log(`   Shop URL: /shop/${shopSlug}`);
    console.log(`   Profile name updated and locked to: ${verificationData.full_name}`);
  }

  res.json({
    success: true,
    message: `Individual verification ${action}d successfully`,
    data: result.rows[0]
  });
}));

// =====================================================
// SUPER ADMIN ONLY - EDITOR MANAGEMENT
// =====================================================

// Get all editors (only editors, not super-admins)
router.get('/editors', /* requireSuperAdmin, */ catchAsync(async (req, res) => {
  const result = await pool.query(
    `SELECT
       id, full_name, email, role, is_active, created_at, avatar, last_login,
       (SELECT COUNT(*) FROM admin_activity_logs WHERE admin_id = users.id) as total_actions
     FROM users
     WHERE role = 'editor'
     ORDER BY created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
}));

// Create new editor (Super Admin only)
router.post('/editors', /* requireSuperAdmin, */ avatarUpload.single('avatar'), catchAsync(async (req, res) => {
  const { fullName, email, password } = req.body;
  const avatarFile = req.file;

  // Validation
  if (!fullName || !email || !password) {
    throw new ValidationError('Full name, email, and password are required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  // Check if email already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already exists');
  }

  // Hash password
  const bcrypt = require('bcrypt');
  const { SECURITY } = require('../config/constants');
  const hashedPassword = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

  // Create editor with avatar if provided
  let query, values;
  if (avatarFile) {
    query = `INSERT INTO users (email, password_hash, full_name, role, is_active, avatar)
             VALUES ($1, $2, $3, 'editor', true, $4)
             RETURNING id, email, full_name, role, is_active, avatar, created_at`;
    values = [email, hashedPassword, fullName, avatarFile.filename];
  } else {
    query = `INSERT INTO users (email, password_hash, full_name, role, is_active)
             VALUES ($1, $2, $3, 'editor', true)
             RETURNING id, email, full_name, role, is_active, avatar, created_at`;
    values = [email, hashedPassword, fullName];
  }

  const result = await pool.query(query, values);
  const newEditor = result.rows[0];

  // Log activity
  await pool.query(
    `INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details)
     VALUES ($1, 'create_editor', 'user', $2, $3)`,
    [req.user.userId, newEditor.id, JSON.stringify({ email, fullName, avatar: !!avatarFile })]
  );

  res.status(201).json({
    success: true,
    message: 'Editor created successfully',
    data: {
      id: newEditor.id,
      email: newEditor.email,
      fullName: newEditor.full_name,
      role: newEditor.role,
      isActive: newEditor.is_active,
      avatar: newEditor.avatar,
      createdAt: newEditor.created_at
    }
  });
}));

// Update editor (Super Admin only)
router.put('/editors/:id', /* requireSuperAdmin, */ avatarUpload.single('avatar'), catchAsync(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password } = req.body;

  // Validation
  if (!fullName || !email) {
    throw new ValidationError('Full name and email are required');
  }

  // Check if editor exists and is an editor or super_admin
  const editorCheck = await pool.query(
    'SELECT id, email, avatar FROM users WHERE id = $1 AND role IN (\'editor\', \'super_admin\')',
    [id]
  );

  if (editorCheck.rows.length === 0) {
    throw new NotFoundError('Editor not found');
  }

  const existingEditor = editorCheck.rows[0];

  // Check if email already exists for a different user
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
    [email, id]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already exists');
  }

  // Build update query
  let updateQuery = '';
  let queryParams = [];
  let paramCount = 1;

  // Always update full_name and email
  updateQuery = `UPDATE users SET full_name = $${paramCount}, email = $${paramCount + 1}`;
  queryParams.push(fullName, email);
  paramCount += 2;

  // Update avatar if a new one was uploaded
  if (req.file) {
    updateQuery += `, avatar = $${paramCount}`;
    queryParams.push(req.file.filename);
    paramCount++;

    // Delete old avatar file if it exists
    if (existingEditor.avatar) {
      const fs = require('fs');
      const path = require('path');
      const oldAvatarPath = path.join('uploads/avatars', existingEditor.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
  }

  // Update password if provided
  if (password) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const bcrypt = require('bcrypt');
    const { SECURITY } = require('../config/constants');
    const hashedPassword = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

    updateQuery += `, password_hash = $${paramCount}`;
    queryParams.push(hashedPassword);
    paramCount++;
  }

  updateQuery += ` WHERE id = $${paramCount} RETURNING id, email, full_name, role, is_active, created_at, avatar`;
  queryParams.push(id);

  // Execute update
  const result = await pool.query(updateQuery, queryParams);
  const updatedEditor = result.rows[0];

  // Log activity
  const activityDetails = { email, fullName };
  if (password) {
    activityDetails.passwordChanged = true;
  }
  if (req.file) {
    activityDetails.avatarUpdated = true;
  }

  await pool.query(
    `INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details)
     VALUES ($1, 'update_editor', 'user', $2, $3)`,
    [req.user.userId, updatedEditor.id, JSON.stringify(activityDetails)]
  );

  res.json({
    success: true,
    message: 'Editor updated successfully',
    data: {
      id: updatedEditor.id,
      email: updatedEditor.email,
      fullName: updatedEditor.full_name,
      role: updatedEditor.role,
      isActive: updatedEditor.is_active,
      createdAt: updatedEditor.created_at,
      avatar: updatedEditor.avatar
    }
  });
}));

// Promote user to editor
router.put('/users/:id/promote-editor',
  /* requireSuperAdmin, */
  logActivity('promote_editor', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET role = 'editor'
       WHERE id = $1 AND role = 'user'
       RETURNING id, full_name, email, role`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found or already an editor/admin');
    }

    res.json({
      success: true,
      message: 'User promoted to editor successfully',
      data: result.rows[0]
    });
  })
);

// Demote editor to user
router.put('/users/:id/demote-editor',
  /* requireSuperAdmin, */
  logActivity('demote_editor', 'user'),
  catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users
       SET role = 'user'
       WHERE id = $1 AND role = 'editor'
       RETURNING id, full_name, email, role`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Editor not found');
    }

    res.json({
      success: true,
      message: 'Editor demoted to user successfully',
      data: result.rows[0]
    });
  })
);

// =====================================================
// ROOT ADMIN ONLY - SUPER ADMIN MANAGEMENT
// =====================================================

// Get all super-admins (Root Admin can manage, Super Admin can view)
router.get('/super-admins', catchAsync(async (req, res) => {
  // Both root and super_admin can view the list
  if (req.user.role !== 'root' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super Admin or Root Admin role required.',
    });
  }


  const result = await pool.query(`
    SELECT
      u.id, u.full_name, u.email, u.is_active, u.created_at, u.avatar,
      u.last_login, u.suspended_at, u.two_factor_enabled,
      NULL as created_by_name,
      (SELECT COUNT(*) FROM admin_activity_logs WHERE admin_id = u.id) as total_actions,
      0 as editors_created
    FROM users u
    WHERE u.role = 'super_admin'
    ORDER BY u.created_at DESC
  `);

  res.json({
    success: true,
    data: result.rows,
  });
}));

// Create new super-admin (Root Admin only)
router.post('/super-admins', requireRoot, catchAsync(async (req, res) => {
  const { email, full_name, password } = req.body;
  const ownerId = req.user.userId;

  // Validation
  if (!email || !full_name || !password) {
    throw new ValidationError('Email, full name, and password are required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  // Check if email already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ValidationError('Email already exists');
  }

  // Hash password
  const bcrypt = require('bcrypt');
  const { SECURITY } = require('../config/constants');
  const hashedPassword = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);

  // Create super-admin
  const result = await pool.query(`
    INSERT INTO users (email, password_hash, full_name, role, is_active)
    VALUES ($1, $2, $3, 'super_admin', true)
    RETURNING id, email, full_name, role, created_at
  `, [email, hashedPassword, full_name]);

  // Log the action
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, 'super_admin_created', 'user', $2, $3, $4)
  `, [
    ownerId,
    result.rows[0].id,
    JSON.stringify({ email, full_name }),
    req.ip,
  ]);

  res.json({
    success: true,
    data: result.rows[0],
    message: 'Super-admin created successfully',
  });
}));

// Suspend/Unsuspend super-admin (Root Admin only)
router.patch('/super-admins/:id/suspend', requireRoot, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { suspend } = req.body; // true to suspend, false to unsuspend
  const ownerId = req.user.userId;

  // Prevent self-suspension
  if (parseInt(id) === ownerId) {
    throw new ValidationError('You cannot suspend yourself');
  }

  const result = await pool.query(`
    UPDATE users
    SET
      is_active = $1,
      suspended_at = $2,
      suspended_by = $3
    WHERE id = $4 AND role = 'super_admin'
    RETURNING id, email, full_name, is_active, suspended_at
  `, [
    !suspend,
    suspend ? new Date() : null,
    suspend ? ownerId : null,
    id,
  ]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Super-admin not found');
  }

  // Log the action
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, 'user', $3, $4, $5)
  `, [
    ownerId,
    suspend ? 'super_admin_suspended' : 'super_admin_unsuspended',
    id,
    JSON.stringify({ email: result.rows[0].email }),
    req.ip,
  ]);

  res.json({
    success: true,
    data: result.rows[0],
    message: suspend ? 'Super-admin suspended' : 'Super-admin reactivated',
  });
}));

// Update super-admin (Root Admin or self)
router.patch('/super-admins/:id', catchAsync(async (req, res) => {
  const { id } = req.params;
  const { email, password, full_name, two_factor_enabled } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Only root or the super_admin themselves can update
  const isSelf = parseInt(id) === userId;
  const isRoot = userRole === 'root';

  if (!isSelf && !isRoot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only edit your own profile or you must be a Root Admin.',
    });
  }

  // Validation
  if (!email && !password && !full_name && two_factor_enabled === undefined) {
    throw new ValidationError('At least one field (email, password, full_name, or two_factor_enabled) must be provided');
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCounter = 1;

  if (email) {
    // Check if email is already in use by another user
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (existingUser.rows.length > 0) {
      throw new ValidationError('Email already exists');
    }
    updates.push(`email = $${paramCounter++}`);
    values.push(email);
  }

  if (full_name) {
    updates.push(`full_name = $${paramCounter++}`);
    values.push(full_name);
  }

  if (two_factor_enabled !== undefined) {
    updates.push(`two_factor_enabled = $${paramCounter++}`);
    values.push(two_factor_enabled);
  }

  if (password) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    // Hash password
    const bcrypt = require('bcrypt');
    const { SECURITY } = require('../config/constants');
    const hashedPassword = await bcrypt.hash(password, SECURITY.BCRYPT_SALT_ROUNDS);
    updates.push(`password_hash = $${paramCounter++}`);
    values.push(hashedPassword);
  }

  if (updates.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  // Add ID to values
  values.push(id);

  const result = await pool.query(`
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter} AND role = 'super_admin'
    RETURNING id, email, full_name, role, is_active, created_at
  `, values);

  if (result.rows.length === 0) {
    throw new NotFoundError('Super-admin not found');
  }

  // Log the action
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, 'super_admin_updated', 'user', $2, $3, $4)
  `, [
    userId,
    id,
    JSON.stringify({ email, updated_fields: Object.keys(req.body) }),
    req.ip,
  ]);

  res.json({
    success: true,
    data: result.rows[0],
    message: 'Super-admin updated successfully',
  });
}));

// Setup 2FA - Generate secret and QR code
router.post('/super-admins/:id/2fa/setup', catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Only root or self can setup 2FA
  const isSelf = parseInt(id) === userId;
  const isRoot = userRole === 'root';

  if (!isSelf && !isRoot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  // Get user info
  const userResult = await pool.query(
    'SELECT email, full_name FROM users WHERE id = $1 AND role = \'super_admin\'',
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundError('Super-admin not found');
  }

  const user = userResult.rows[0];
  const speakeasy = require('speakeasy');
  const QRCode = require('qrcode');

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Thulobazaar (${user.email})`,
    issuer: 'Thulobazaar',
    length: 32,
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    },
  });
}));

// Verify and enable 2FA
router.post('/super-admins/:id/2fa/verify', catchAsync(async (req, res) => {
  const { id } = req.params;
  const { secret, token } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Only root or self
  const isSelf = parseInt(id) === userId;
  const isRoot = userRole === 'root';

  if (!isSelf && !isRoot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  if (!secret || !token) {
    throw new ValidationError('Secret and token are required');
  }

  const speakeasy = require('speakeasy');
  const crypto = require('crypto');

  // Verify the token
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2,
  });

  if (!verified) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code. Please try again.',
    });
  }

  // Generate backup codes
  const backupCodes = [];
  for (let i = 0; i < 10; i++) {
    backupCodes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }

  // Store secret and enable 2FA
  await pool.query(
    `UPDATE users
     SET two_factor_enabled = true,
         two_factor_secret = $1,
         two_factor_backup_codes = $2
     WHERE id = $3`,
    [secret, JSON.stringify(backupCodes), id]
  );

  // Log action
  await pool.query(
    `INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
     VALUES ($1, 'two_factor_enabled', 'user', $2, $3, $4)`,
    [userId, id, JSON.stringify({ email: req.user.email }), req.ip]
  );

  res.json({
    success: true,
    data: {
      backupCodes: backupCodes,
    },
    message: '2FA enabled successfully',
  });
}));

// Disable 2FA
router.post('/super-admins/:id/2fa/disable', catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  // Only root or self
  const isSelf = parseInt(id) === userId;
  const isRoot = userRole === 'root';

  if (!isSelf && !isRoot) {
    return res.status(403).json({
      success: false,
      message: 'Access denied.',
    });
  }

  // Disable 2FA
  await pool.query(
    `UPDATE users
     SET two_factor_enabled = false,
         two_factor_secret = NULL,
         two_factor_backup_codes = NULL
     WHERE id = $1`,
    [id]
  );

  // Log action
  await pool.query(
    `INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
     VALUES ($1, 'two_factor_disabled', 'user', $2, $3, $4)`,
    [userId, id, JSON.stringify({ email: req.user.email }), req.ip]
  );

  res.json({
    success: true,
    message: '2FA disabled successfully',
  });
}));

// Delete super-admin (Root Admin only)
router.delete('/super-admins/:id', requireRoot, catchAsync(async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.userId;

  // Prevent self-deletion
  if (parseInt(id) === ownerId) {
    throw new ValidationError('You cannot delete yourself');
  }

  // Get super-admin details before deletion
  const superAdmin = await pool.query(
    'SELECT email, full_name FROM users WHERE id = $1 AND role = $2',
    [id, 'super_admin']
  );

  if (superAdmin.rows.length === 0) {
    throw new NotFoundError('Super-admin not found');
  }

  // Delete the super-admin
  await pool.query('DELETE FROM users WHERE id = $1', [id]);

  // Log the action
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, 'super_admin_deleted', 'user', $2, $3, $4)
  `, [
    ownerId,
    id,
    JSON.stringify(superAdmin.rows[0]),
    req.ip,
  ]);

  res.json({
    success: true,
    message: 'Super-admin deleted successfully',
  });
}));

// =====================================================
// FINANCIAL TRACKING
// =====================================================

// Get financial statistics
router.get('/financial/stats', catchAsync(async (req, res) => {
  const { period = '30days', startDate, endDate } = req.query;

  // Calculate date range based on period or custom dates
  let dateFilter = '';

  // If custom date range is provided, use it
  if (startDate && endDate) {
    dateFilter = `created_at >= '${startDate}'::date AND created_at < '${endDate}'::date + INTERVAL '1 day'`;
  } else if (startDate) {
    // Only start date provided
    dateFilter = `created_at >= '${startDate}'::date`;
  } else if (endDate) {
    // Only end date provided
    dateFilter = `created_at < '${endDate}'::date + INTERVAL '1 day'`;
  } else {
    // Use preset periods
    if (period === '7days') {
      dateFilter = "created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === '30days') {
      dateFilter = "created_at >= NOW() - INTERVAL '30 days'";
    } else if (period === '90days') {
      dateFilter = "created_at >= NOW() - INTERVAL '90 days'";
    } else if (period === 'today') {
      dateFilter = "DATE(created_at) = CURRENT_DATE";
    } else if (period === 'yesterday') {
      dateFilter = "DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'";
    } else if (period === 'thisweek') {
      dateFilter = "created_at >= DATE_TRUNC('week', CURRENT_DATE)";
    } else if (period === 'thismonth') {
      dateFilter = "created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (period === 'all') {
      dateFilter = '1=1';
    }
  }

  // Total revenue from verified payments
  const totalRevenue = await pool.query(`
    SELECT
      COALESCE(SUM(amount), 0) as total,
      COUNT(*) as count
    FROM payment_transactions
    WHERE status = 'verified' AND ${dateFilter}
  `);

  // Revenue by payment gateway
  const revenueByGateway = await pool.query(`
    SELECT
      payment_gateway,
      COALESCE(SUM(amount), 0) as revenue,
      COUNT(*) as transactions
    FROM payment_transactions
    WHERE status = 'verified' AND ${dateFilter}
    GROUP BY payment_gateway
    ORDER BY revenue DESC
  `);

  // Revenue by payment type
  const revenueByType = await pool.query(`
    SELECT
      payment_type,
      COALESCE(SUM(amount), 0) as revenue,
      COUNT(*) as transactions
    FROM payment_transactions
    WHERE status = 'verified' AND ${dateFilter}
    GROUP BY payment_type
    ORDER BY revenue DESC
  `);

  // Failed transactions
  const failedTransactions = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM payment_transactions
    WHERE status = 'failed' AND ${dateFilter}
  `);

  // Pending transactions
  const pendingTransactions = await pool.query(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount
    FROM payment_transactions
    WHERE status = 'pending' AND ${dateFilter}
  `);

  // Promotion stats
  const promotionStats = await pool.query(`
    SELECT
      promotion_type,
      COUNT(*) as total_promotions,
      COALESCE(SUM(price_paid), 0) as total_revenue,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_promotions
    FROM ad_promotions
    WHERE ${dateFilter.replace('created_at', 'ad_promotions.created_at')}
    GROUP BY promotion_type
    ORDER BY total_revenue DESC
  `);

  // Daily revenue trend (last 30 days)
  const dailyRevenue = await pool.query(`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(amount), 0) as revenue,
      COUNT(*) as transactions
    FROM payment_transactions
    WHERE status = 'verified' AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `);

  // Top customers by revenue
  const topCustomers = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      COALESCE(SUM(pt.amount), 0) as total_spent,
      COUNT(pt.id) as transactions
    FROM users u
    INNER JOIN payment_transactions pt ON u.id = pt.user_id
    WHERE pt.status = 'verified' AND ${dateFilter.replace('created_at', 'pt.created_at')}
    GROUP BY u.id, u.full_name, u.email
    ORDER BY total_spent DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        totalTransactions: parseInt(totalRevenue.rows[0].count),
        failedTransactions: {
          count: parseInt(failedTransactions.rows[0].count),
          amount: parseFloat(failedTransactions.rows[0].amount),
        },
        pendingTransactions: {
          count: parseInt(pendingTransactions.rows[0].count),
          amount: parseFloat(pendingTransactions.rows[0].amount),
        },
      },
      revenueByGateway: revenueByGateway.rows.map(row => ({
        gateway: row.payment_gateway,
        revenue: parseFloat(row.revenue),
        transactions: parseInt(row.transactions),
      })),
      revenueByType: revenueByType.rows.map(row => ({
        type: row.payment_type,
        revenue: parseFloat(row.revenue),
        transactions: parseInt(row.transactions),
      })),
      promotionStats: promotionStats.rows.map(row => ({
        promotionType: row.promotion_type,
        totalPromotions: parseInt(row.total_promotions),
        totalRevenue: parseFloat(row.total_revenue),
        activePromotions: parseInt(row.active_promotions),
      })),
      dailyRevenue: dailyRevenue.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
        transactions: parseInt(row.transactions),
      })),
      topCustomers: topCustomers.rows.map(row => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        totalSpent: parseFloat(row.total_spent),
        transactions: parseInt(row.transactions),
      })),
    },
  });
}));

// Get recent transactions with pagination
router.get('/financial/transactions', catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    gateway,
    type,
  } = req.query;

  const offset = (page - 1) * limit;
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  if (status) {
    whereConditions.push(`pt.status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }

  if (gateway) {
    whereConditions.push(`pt.payment_gateway = $${paramCount}`);
    params.push(gateway);
    paramCount++;
  }

  if (type) {
    whereConditions.push(`pt.payment_type = $${paramCount}`);
    params.push(type);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM payment_transactions pt ${whereClause}`,
    params
  );
  const totalCount = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  // Get transactions
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT
       pt.*,
       u.full_name,
       u.email
     FROM payment_transactions pt
     LEFT JOIN users u ON pt.user_id = u.id
     ${whereClause}
     ORDER BY pt.created_at DESC
     LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
    params
  );

  res.json({
    success: true,
    data: {
      transactions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages,
      },
    },
  });
}));

// =====================================================
// ADMIN DASHBOARD STATISTICS
// =====================================================

router.get('/stats', requireSuperAdmin, catchAsync(async (req, res) => {
  // Get total users count
  const totalUsersResult = await pool.query(
    'SELECT COUNT(*) FROM users WHERE role = $1',
    ['user']
  );
  const totalUsers = parseInt(totalUsersResult.rows[0].count);

  // Get total ads count
  const totalAdsResult = await pool.query(
    'SELECT COUNT(*) FROM ads WHERE deleted_at IS NULL'
  );
  const totalAds = parseInt(totalAdsResult.rows[0].count);

  // Get active ads count
  const activeAdsResult = await pool.query(
    'SELECT COUNT(*) FROM ads WHERE status = $1 AND deleted_at IS NULL',
    ['active']
  );
  const activeAds = parseInt(activeAdsResult.rows[0].count);

  // Get pending ads count
  const pendingAdsResult = await pool.query(
    'SELECT COUNT(*) FROM ads WHERE status = $1 AND deleted_at IS NULL',
    ['pending']
  );
  const pendingAds = parseInt(pendingAdsResult.rows[0].count);

  // Get ads created this week
  const adsThisWeekResult = await pool.query(
    `SELECT COUNT(*) FROM ads
     WHERE created_at >= NOW() - INTERVAL '7 days'
     AND deleted_at IS NULL`
  );
  const adsThisWeek = parseInt(adsThisWeekResult.rows[0].count);

  // Get users created this week
  const usersThisWeekResult = await pool.query(
    `SELECT COUNT(*) FROM users
     WHERE created_at >= NOW() - INTERVAL '7 days'
     AND role = $1`,
    ['user']
  );
  const usersThisWeek = parseInt(usersThisWeekResult.rows[0].count);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalAds,
      activeAds,
      pendingAds,
      adsThisWeek,
      usersThisWeek,
    },
  });
}));

// =====================================================
// SYSTEM HEALTH MONITORING
// =====================================================

router.get('/system-health', requireSuperAdmin, catchAsync(async (req, res) => {
  const startTime = Date.now();

  // 1. Service Status Checks
  const serviceStatus = {};

  // PostgreSQL Database Check
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    serviceStatus.postgresql = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
      message: 'Database connection successful'
    };
  } catch (error) {
    serviceStatus.postgresql = {
      status: 'unhealthy',
      responseTime: null,
      message: error.message
    };
  }

  // Typesense Search Check
  try {
    const typesenseStart = Date.now();
    const axios = require('axios');
    const TYPESENSE_URL = process.env.TYPESENSE_URL || 'http://localhost:8108';
    const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'xyz';

    await axios.get(`${TYPESENSE_URL}/health`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
      timeout: 5000
    });

    serviceStatus.typesense = {
      status: 'healthy',
      responseTime: Date.now() - typesenseStart,
      message: 'Search service operational'
    };
  } catch (error) {
    serviceStatus.typesense = {
      status: 'unhealthy',
      responseTime: null,
      message: error.code === 'ECONNREFUSED' ? 'Service not reachable' : error.message
    };
  }

  // Backend API Check
  serviceStatus.backend = {
    status: 'healthy',
    responseTime: Date.now() - startTime,
    message: 'API responding normally'
  };

  // 2. Database Health Metrics
  const databaseHealth = {};

  // Connection pool status
  try {
    const poolStats = await pool.query(`
      SELECT
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as total_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'active') as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle') as idle_connections
    `);
    databaseHealth.connections = poolStats.rows[0];
  } catch (error) {
    databaseHealth.connections = { error: error.message };
  }

  // Database size
  try {
    const dbSize = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    databaseHealth.databaseSize = dbSize.rows[0].size;
  } catch (error) {
    databaseHealth.databaseSize = 'Unknown';
  }

  // Table sizes (top 10)
  try {
    const tableSizes = await pool.query(`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
      LIMIT 10
    `);
    databaseHealth.topTables = tableSizes.rows;
  } catch (error) {
    databaseHealth.topTables = [];
  }

  // Recent slow queries (queries taking >500ms in last hour)
  try {
    const slowQueries = await pool.query(`
      SELECT
        COUNT(*) as slow_query_count
      FROM pg_stat_statements
      WHERE mean_exec_time > 500
      AND calls > 0
    `);
    databaseHealth.slowQueries = slowQueries.rows[0]?.slow_query_count || 0;
  } catch (error) {
    // pg_stat_statements might not be enabled
    databaseHealth.slowQueries = 'N/A';
  }

  // 3. Application Performance Metrics
  const performanceMetrics = {};

  // Recent errors from admin activity logs
  try {
    const recentErrors = await pool.query(`
      SELECT COUNT(*) as error_count
      FROM admin_activity_logs
      WHERE action_type LIKE '%error%' OR action_type LIKE '%failed%'
      AND created_at >= NOW() - INTERVAL '24 hours'
    `);
    performanceMetrics.errorsLast24h = parseInt(recentErrors.rows[0].error_count);
  } catch (error) {
    performanceMetrics.errorsLast24h = 0;
  }

  // Active sessions (logged in users in last 30 minutes)
  try {
    const activeSessions = await pool.query(`
      SELECT COUNT(DISTINCT id) as active_users
      FROM users
      WHERE last_login >= NOW() - INTERVAL '30 minutes'
    `);
    performanceMetrics.activeUsers = parseInt(activeSessions.rows[0].active_users);
  } catch (error) {
    performanceMetrics.activeUsers = 0;
  }

  // 4. Business Metrics
  const businessMetrics = {};

  // Ads statistics
  try {
    const adsStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'approved' AND deleted_at IS NULL) as active_ads,
        COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL) as pending_ads,
        COUNT(*) FILTER (WHERE status = 'rejected' AND deleted_at IS NULL) as rejected_ads,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_ads,
        COUNT(*) as total_ads
      FROM ads
    `);
    businessMetrics.ads = adsStats.rows[0];
  } catch (error) {
    businessMetrics.ads = { error: error.message };
  }

  // User statistics
  try {
    const userStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_active = true AND is_suspended = false) as active_users,
        COUNT(*) FILTER (WHERE is_suspended = true) as suspended_users,
        COUNT(*) FILTER (WHERE business_verification_status = 'approved') as verified_businesses,
        COUNT(*) FILTER (WHERE individual_verified = true) as verified_individuals,
        COUNT(*) as total_users
      FROM users
      WHERE role = 'user'
    `);
    businessMetrics.users = userStats.rows[0];
  } catch (error) {
    businessMetrics.users = { error: error.message };
  }

  // Pending verifications
  try {
    const verifications = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM business_verification_requests WHERE status = 'pending') as pending_business,
        (SELECT COUNT(*) FROM individual_verification_requests WHERE status = 'pending') as pending_individual
    `);
    businessMetrics.pendingVerifications = verifications.rows[0];
  } catch (error) {
    businessMetrics.pendingVerifications = { error: error.message };
  }

  // Payment statistics (last 24h)
  try {
    const payments = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'verified') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'verified'), 0) as total_revenue_24h
      FROM payment_transactions
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    businessMetrics.paymentsLast24h = payments.rows[0];
  } catch (error) {
    businessMetrics.paymentsLast24h = { error: error.message };
  }

  // 5. Recent Critical Events
  const criticalEvents = [];

  // Failed logins (potential security issues)
  try {
    const failedLogins = await pool.query(`
      SELECT COUNT(*) as count
      FROM admin_activity_logs
      WHERE action_type = 'failed_login'
      AND created_at >= NOW() - INTERVAL '1 hour'
    `);

    const count = parseInt(failedLogins.rows[0].count);
    if (count > 0) {
      criticalEvents.push({
        type: 'security',
        severity: count > 10 ? 'high' : 'medium',
        message: `${count} failed login attempts in the last hour`,
        timestamp: new Date()
      });
    }
  } catch (error) {
    // Ignore if table doesn't exist
  }

  // Check if any services are unhealthy
  Object.entries(serviceStatus).forEach(([service, status]) => {
    if (status.status === 'unhealthy') {
      criticalEvents.push({
        type: 'service',
        severity: 'high',
        message: `${service.toUpperCase()} is unhealthy: ${status.message}`,
        timestamp: new Date()
      });
    }
  });

  // 6. System Information
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
    cpuUsage: process.cpuUsage(),
  };

  res.json({
    success: true,
    data: {
      timestamp: new Date(),
      serviceStatus,
      databaseHealth,
      performanceMetrics,
      businessMetrics,
      criticalEvents,
      systemInfo,
    },
  });
}));

// =====================================================
// SECURITY & AUDIT
// =====================================================

router.get('/security-audit', requireSuperAdmin, catchAsync(async (req, res) => {
  const { timeRange = '24h', page = 1, limit = 50 } = req.query;

  // Calculate time range
  let timeFilter = "created_at >= NOW() - INTERVAL '24 hours'";
  if (timeRange === '7d') timeFilter = "created_at >= NOW() - INTERVAL '7 days'";
  else if (timeRange === '30d') timeFilter = "created_at >= NOW() - INTERVAL '30 days'";
  else if (timeRange === '1h') timeFilter = "created_at >= NOW() - INTERVAL '1 hour'";

  // 1. Security Overview
  const securityOverview = {};

  // Failed logins
  try {
    const failedLogins = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT details->>'email') as unique_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as last_hour,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h
      FROM admin_activity_logs
      WHERE action_type IN ('failed_login', 'login_failed')
      AND ${timeFilter}
    `);
    securityOverview.failedLogins = failedLogins.rows[0];
  } catch (error) {
    securityOverview.failedLogins = { total: 0, unique_users: 0, last_hour: 0, last_24h: 0 };
  }

  // Successful logins
  try {
    const successfulLogins = await pool.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE last_login >= NOW() - INTERVAL '24 hours'
      AND role IN ('editor', 'super_admin')
    `);
    securityOverview.successfulLogins = parseInt(successfulLogins.rows[0].count);
  } catch (error) {
    securityOverview.successfulLogins = 0;
  }

  // 2FA Status
  try {
    const twoFactorStats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE two_factor_enabled = true) as enabled,
        COUNT(*) FILTER (WHERE two_factor_enabled = false OR two_factor_enabled IS NULL) as disabled,
        COUNT(*) as total
      FROM users
      WHERE role = 'super_admin'
    `);
    securityOverview.twoFactorAuth = twoFactorStats.rows[0];
  } catch (error) {
    securityOverview.twoFactorAuth = { enabled: 0, disabled: 0, total: 0 };
  }

  // Suspended accounts
  try {
    const suspensions = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE suspended_at >= NOW() - INTERVAL '24 hours') as last_24h
      FROM users
      WHERE is_suspended = true
    `);
    securityOverview.suspensions = suspensions.rows[0];
  } catch (error) {
    securityOverview.suspensions = { total: 0, last_24h: 0 };
  }

  // 2. Recent Failed Login Attempts
  const failedLoginAttempts = [];
  try {
    const attempts = await pool.query(`
      SELECT
        id,
        admin_id,
        action_type,
        details,
        ip_address,
        created_at
      FROM admin_activity_logs
      WHERE action_type IN ('failed_login', 'login_failed', 'invalid_credentials')
      AND ${timeFilter}
      ORDER BY created_at DESC
      LIMIT 100
    `);

    failedLoginAttempts.push(...attempts.rows.map(row => ({
      id: row.id,
      email: row.details?.email || 'Unknown',
      ipAddress: row.ip_address,
      timestamp: row.created_at,
      reason: row.action_type
    })));
  } catch (error) {
    console.error('Error fetching failed logins:', error);
  }

  // 3. Admin Activity Logs (with pagination)
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let activityLogs = [];
  let activityTotal = 0;

  try {
    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM admin_activity_logs
      WHERE ${timeFilter}
    `);
    activityTotal = parseInt(countResult.rows[0].count);

    // Get logs
    const logs = await pool.query(`
      SELECT
        l.id,
        l.admin_id,
        l.action_type,
        l.target_type,
        l.target_id,
        l.details,
        l.ip_address,
        l.created_at,
        u.full_name as admin_name,
        u.email as admin_email,
        u.role as admin_role
      FROM admin_activity_logs l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE ${timeFilter}
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2
    `, [parseInt(limit), offset]);

    activityLogs = logs.rows.map(row => ({
      id: row.id,
      adminId: row.admin_id,
      adminName: row.admin_name || 'System',
      adminEmail: row.admin_email,
      adminRole: row.admin_role,
      actionType: row.action_type,
      targetType: row.target_type,
      targetId: row.target_id,
      details: row.details,
      ipAddress: row.ip_address,
      timestamp: row.created_at
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
  }

  // 4. Active Sessions
  const activeSessions = [];
  try {
    const sessions = await pool.query(`
      SELECT
        id,
        full_name,
        email,
        role,
        last_login,
        avatar
      FROM users
      WHERE role IN ('editor', 'super_admin')
      AND last_login >= NOW() - INTERVAL '30 minutes'
      ORDER BY last_login DESC
    `);

    activeSessions.push(...sessions.rows.map(row => ({
      userId: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      lastActivity: row.last_login,
      avatar: row.avatar
    })));
  } catch (error) {
    console.error('Error fetching active sessions:', error);
  }

  // 5. Recent Security Events (high-priority actions)
  const securityEvents = [];
  try {
    const events = await pool.query(`
      SELECT
        l.id,
        l.action_type,
        l.details,
        l.ip_address,
        l.created_at,
        u.full_name as admin_name,
        u.email as admin_email
      FROM admin_activity_logs l
      LEFT JOIN users u ON l.admin_id = u.id
      WHERE l.action_type IN (
        'super_admin_created',
        'super_admin_deleted',
        'super_admin_suspended',
        'editor_created',
        'editor_deleted',
        'two_factor_enabled',
        'two_factor_disabled',
        'suspend_user',
        'unsuspend_user',
        'password_changed'
      )
      AND ${timeFilter}
      ORDER BY l.created_at DESC
      LIMIT 50
    `);

    securityEvents.push(...events.rows.map(row => ({
      id: row.id,
      actionType: row.action_type,
      adminName: row.admin_name || 'System',
      adminEmail: row.admin_email,
      details: row.details,
      ipAddress: row.ip_address,
      timestamp: row.created_at
    })));
  } catch (error) {
    console.error('Error fetching security events:', error);
  }

  // 6. IP Address Analysis (top IPs)
  const topIpAddresses = [];
  try {
    const ips = await pool.query(`
      SELECT
        ip_address,
        COUNT(*) as request_count,
        COUNT(DISTINCT admin_id) as unique_users,
        MAX(created_at) as last_seen
      FROM admin_activity_logs
      WHERE ${timeFilter}
      AND ip_address IS NOT NULL
      GROUP BY ip_address
      ORDER BY request_count DESC
      LIMIT 20
    `);

    topIpAddresses.push(...ips.rows);
  } catch (error) {
    console.error('Error fetching IP analysis:', error);
  }

  // 7. Action Type Statistics
  const actionTypeStats = [];
  try {
    const stats = await pool.query(`
      SELECT
        action_type,
        COUNT(*) as count
      FROM admin_activity_logs
      WHERE ${timeFilter}
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 20
    `);

    actionTypeStats.push(...stats.rows);
  } catch (error) {
    console.error('Error fetching action stats:', error);
  }

  res.json({
    success: true,
    data: {
      timestamp: new Date(),
      timeRange,
      securityOverview,
      failedLoginAttempts,
      activityLogs,
      activityPagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: activityTotal,
        totalPages: Math.ceil(activityTotal / parseInt(limit))
      },
      activeSessions,
      securityEvents,
      topIpAddresses,
      actionTypeStats
    }
  });
}));

// =====================================================
// CATEGORIES MANAGEMENT
// =====================================================

// Get all categories (with hierarchy)
router.get('/categories', requireSuperAdmin, catchAsync(async (req, res) => {
  const categories = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.icon,
      c.parent_id,
      c.form_template,
      c.created_at,
      pc.name as parent_name,
      (SELECT COUNT(*) FROM ads WHERE category_id = c.id AND deleted_at IS NULL) as ad_count,
      (SELECT COUNT(*) FROM categories WHERE parent_id = c.id) as subcategory_count
    FROM categories c
    LEFT JOIN categories pc ON c.parent_id = pc.id
    ORDER BY
      COALESCE(c.parent_id, c.id),
      c.parent_id NULLS FIRST,
      c.name
  `);

  res.json({
    success: true,
    data: categories.rows
  });
}));

// Create new category
router.post('/categories', requireSuperAdmin, catchAsync(async (req, res) => {
  const { name, slug, icon, parent_id, form_template } = req.body;

  // Validate required fields
  if (!name || !slug) {
    return res.status(400).json({
      success: false,
      error: 'Name and slug are required'
    });
  }

  // Check if slug already exists
  const existing = await pool.query(
    'SELECT id FROM categories WHERE slug = $1',
    [slug]
  );

  if (existing.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'A category with this slug already exists'
    });
  }

  // Insert new category
  const result = await pool.query(`
    INSERT INTO categories (name, slug, icon, parent_id, form_template)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [name, slug, icon || null, parent_id || null, form_template || null]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'category_created',
    'category',
    result.rows[0].id,
    JSON.stringify({ name, slug }),
    req.ip
  ]);

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

// Update category
router.put('/categories/:id', requireSuperAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, slug, icon, parent_id, form_template } = req.body;

  // Check if category exists
  const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }

  // Check if slug is taken by another category
  if (slug) {
    const slugCheck = await pool.query(
      'SELECT id FROM categories WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A category with this slug already exists'
      });
    }
  }

  // Prevent circular parent reference
  if (parent_id) {
    const checkCircular = await pool.query(`
      WITH RECURSIVE parent_chain AS (
        SELECT id, parent_id FROM categories WHERE id = $1
        UNION ALL
        SELECT c.id, c.parent_id
        FROM categories c
        INNER JOIN parent_chain pc ON c.id = pc.parent_id
      )
      SELECT id FROM parent_chain WHERE id = $2
    `, [parent_id, id]);

    if (checkCircular.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot set parent category - this would create a circular reference'
      });
    }
  }

  // Update category
  const result = await pool.query(`
    UPDATE categories
    SET
      name = COALESCE($1, name),
      slug = COALESCE($2, slug),
      icon = $3,
      parent_id = $4,
      form_template = $5
    WHERE id = $6
    RETURNING *
  `, [name, slug, icon, parent_id, form_template, id]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'category_updated',
    'category',
    id,
    JSON.stringify({ name, slug }),
    req.ip
  ]);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Delete category
router.delete('/categories/:id', requireSuperAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if category exists
  const category = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (category.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }

  // Check if category has ads
  const adCount = await pool.query(
    'SELECT COUNT(*) as count FROM ads WHERE category_id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (parseInt(adCount.rows[0].count) > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete category with ${adCount.rows[0].count} active ads`
    });
  }

  // Check if category has subcategories
  const subcategoryCount = await pool.query(
    'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
    [id]
  );

  if (parseInt(subcategoryCount.rows[0].count) > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete category with ${subcategoryCount.rows[0].count} subcategories`
    });
  }

  // Delete category
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'category_deleted',
    'category',
    id,
    JSON.stringify({ name: category.rows[0].name }),
    req.ip
  ]);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
}));

// =====================================================
// LOCATIONS MANAGEMENT
// =====================================================

// Get all locations (with hierarchy)
router.get('/locations', requireSuperAdmin, catchAsync(async (req, res) => {
  const locations = await pool.query(`
    SELECT
      l.id,
      l.name,
      l.slug,
      l.type,
      l.parent_id,
      l.latitude,
      l.longitude,
      l.created_at,
      pl.name as parent_name,
      (SELECT COUNT(*) FROM ads WHERE location_id = l.id AND deleted_at IS NULL) as ad_count,
      (SELECT COUNT(*) FROM users WHERE location_id = l.id) as user_count,
      (SELECT COUNT(*) FROM locations WHERE parent_id = l.id) as sublocation_count
    FROM locations l
    LEFT JOIN locations pl ON l.parent_id = pl.id
    ORDER BY
      COALESCE(l.parent_id, l.id),
      l.parent_id NULLS FIRST,
      l.name
  `);

  res.json({
    success: true,
    data: locations.rows
  });
}));

// Create new location
router.post('/locations', requireSuperAdmin, catchAsync(async (req, res) => {
  const { name, slug, type, parent_id, latitude, longitude } = req.body;

  // Validate required fields
  if (!name || !type) {
    return res.status(400).json({
      success: false,
      error: 'Name and type are required'
    });
  }

  // Validate type
  const validTypes = ['country', 'region', 'city', 'district'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
    });
  }

  // Check if slug already exists
  if (slug) {
    const existing = await pool.query(
      'SELECT id FROM locations WHERE slug = $1',
      [slug]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A location with this slug already exists'
      });
    }
  }

  // Insert new location
  const result = await pool.query(`
    INSERT INTO locations (name, slug, type, parent_id, latitude, longitude)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, slug || null, type, parent_id || null, latitude || null, longitude || null]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'location_created',
    'location',
    result.rows[0].id,
    JSON.stringify({ name, type }),
    req.ip
  ]);

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
}));

// Update location
router.put('/locations/:id', requireSuperAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, slug, type, parent_id, latitude, longitude } = req.body;

  // Check if location exists
  const existing = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }

  // Validate type if provided
  if (type) {
    const validTypes = ['country', 'region', 'city', 'district'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }
  }

  // Check if slug is taken by another location
  if (slug) {
    const slugCheck = await pool.query(
      'SELECT id FROM locations WHERE slug = $1 AND id != $2',
      [slug, id]
    );
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A location with this slug already exists'
      });
    }
  }

  // Prevent circular parent reference
  if (parent_id) {
    const checkCircular = await pool.query(`
      WITH RECURSIVE parent_chain AS (
        SELECT id, parent_id FROM locations WHERE id = $1
        UNION ALL
        SELECT l.id, l.parent_id
        FROM locations l
        INNER JOIN parent_chain pc ON l.id = pc.parent_id
      )
      SELECT id FROM parent_chain WHERE id = $2
    `, [parent_id, id]);

    if (checkCircular.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot set parent location - this would create a circular reference'
      });
    }
  }

  // Update location
  const result = await pool.query(`
    UPDATE locations
    SET
      name = COALESCE($1, name),
      slug = COALESCE($2, slug),
      type = COALESCE($3, type),
      parent_id = $4,
      latitude = $5,
      longitude = $6
    WHERE id = $7
    RETURNING *
  `, [name, slug, type, parent_id, latitude, longitude, id]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'location_updated',
    'location',
    id,
    JSON.stringify({ name, type }),
    req.ip
  ]);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Delete location
router.delete('/locations/:id', requireSuperAdmin, catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if location exists
  const location = await pool.query('SELECT * FROM locations WHERE id = $1', [id]);
  if (location.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Location not found'
    });
  }

  // Check if location has ads
  const adCount = await pool.query(
    'SELECT COUNT(*) as count FROM ads WHERE location_id = $1 AND deleted_at IS NULL',
    [id]
  );

  if (parseInt(adCount.rows[0].count) > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete location with ${adCount.rows[0].count} active ads`
    });
  }

  // Check if location has users
  const userCount = await pool.query(
    'SELECT COUNT(*) as count FROM users WHERE location_id = $1',
    [id]
  );

  if (parseInt(userCount.rows[0].count) > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete location with ${userCount.rows[0].count} users`
    });
  }

  // Check if location has sublocations
  const sublocationCount = await pool.query(
    'SELECT COUNT(*) as count FROM locations WHERE parent_id = $1',
    [id]
  );

  if (parseInt(sublocationCount.rows[0].count) > 0) {
    return res.status(400).json({
      success: false,
      error: `Cannot delete location with ${sublocationCount.rows[0].count} sublocations`
    });
  }

  // Delete location
  await pool.query('DELETE FROM locations WHERE id = $1', [id]);

  // Log activity
  await pool.query(`
    INSERT INTO admin_activity_logs (admin_id, action_type, target_type, target_id, details, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    req.user.id,
    'location_deleted',
    'location',
    id,
    JSON.stringify({ name: location.rows[0].name }),
    req.ip
  ]);

  res.json({
    success: true,
    message: 'Location deleted successfully'
  });
}));

module.exports = router;
