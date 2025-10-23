const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor, requireSuperAdmin } = require('../middleware/editorAuth');
const { logActivity } = require('../middleware/activityLogger');
const { catchAsync, NotFoundError, ValidationError } = require('../middleware/errorHandler');

// All editor routes require authentication and editor role
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

  // Exclude editor and super_admin roles by default
  if (!role) {
    whereConditions.push(`role NOT IN ('editor', 'super_admin')`);
  } else {
    // Filter by specific role if provided
    whereConditions.push(`role = $${paramCount}`);
    params.push(role);
    paramCount++;
  }

  // Filter by active/suspended status
  if (status === 'active') {
    whereConditions.push('is_active = true AND is_suspended = false');
  } else if (status === 'suspended') {
    whereConditions.push('is_suspended = true');
  }

  // Search
  if (search) {
    whereConditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM users ${whereClause}`,
    params
  );

  // Get users
  params.push(limit);
  params.push(offset);

  const result = await pool.query(
    `SELECT
       u.id, u.full_name, u.email, u.role, u.is_active, u.is_verified,
       u.is_suspended, u.suspended_until, u.suspension_reason,
       u.created_at, u.avatar,
       l.name as location_name,
       suspender.full_name as suspended_by_name,
       (SELECT COUNT(*) FROM ads WHERE user_id = u.id AND deleted_at IS NULL) as total_ads
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

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: result.rows[0]
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

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      data: result.rows[0]
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

  // If approved, update user's profile to business account
  if (action === 'approve') {
    const verificationData = result.rows[0];

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

// Get all editors
router.get('/editors', /* requireSuperAdmin, */ catchAsync(async (req, res) => {
  const result = await pool.query(
    `SELECT
       id, full_name, email, role, is_active, created_at, avatar,
       (SELECT COUNT(*) FROM admin_activity_logs WHERE admin_id = users.id) as total_actions
     FROM users
     WHERE role IN ('editor', 'super_admin')
     ORDER BY created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
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

module.exports = router;
