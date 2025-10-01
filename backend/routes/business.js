const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor } = require('../middleware/editorAuth');
const { logActivity } = require('../middleware/activityLogger');
const { catchAsync, NotFoundError, ValidationError } = require('../middleware/errorHandler');

// Configure multer for business license uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/business-licenses';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'license-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// =====================================================
// USER-FACING ROUTES
// =====================================================

// Submit business verification request
router.post('/verify-request',
  authenticateToken,
  upload.single('businessLicense'),
  catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const {
      businessName,
      businessCategory,
      businessDescription,
      businessWebsite,
      businessPhone,
      businessAddress,
      paymentReference,
      paymentAmount
    } = req.body;

    if (!businessName) {
      throw new ValidationError('Business name is required');
    }

    if (!req.file) {
      throw new ValidationError('Business license document is required');
    }

    // Check if user already has a pending or approved request
    const existing = await pool.query(
      'SELECT id, status FROM business_verification_requests WHERE user_id = $1 AND status IN ($2, $3)',
      [userId, 'pending', 'approved']
    );

    if (existing.rows.length > 0) {
      throw new ValidationError('You already have a pending or approved business verification request');
    }

    // Insert verification request
    const result = await pool.query(
      `INSERT INTO business_verification_requests
       (user_id, business_name, business_license_document, business_category,
        business_description, business_website, business_phone, business_address,
        payment_reference, payment_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        userId,
        businessName,
        req.file.filename,
        businessCategory,
        businessDescription,
        businessWebsite,
        businessPhone,
        businessAddress,
        paymentReference,
        paymentAmount
      ]
    );

    // Update user's business_verification_status to pending
    await pool.query(
      'UPDATE users SET business_verification_status = $1 WHERE id = $2',
      ['pending', userId]
    );

    res.json({
      success: true,
      message: 'Business verification request submitted successfully',
      data: result.rows[0]
    });
  })
);

// Get user's business verification status
router.get('/verification-status', authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT id, business_name, status, rejection_reason, created_at, reviewed_at
     FROM business_verification_requests
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  const user = await pool.query(
    `SELECT account_type, business_verification_status, business_name,
            business_subscription_status, business_subscription_end
     FROM users
     WHERE id = $1`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      latestRequest: result.rows[0] || null,
      userStatus: user.rows[0]
    }
  });
}));

// Get promotion pricing
router.get('/promotion-pricing', catchAsync(async (req, res) => {
  const { accountType } = req.query;

  let query = 'SELECT * FROM promotion_pricing WHERE is_active = true';
  const params = [];

  if (accountType) {
    query += ' AND account_type = $1';
    params.push(accountType);
  }

  query += ' ORDER BY promotion_type, duration_days';

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: result.rows
  });
}));

// Purchase ad promotion
router.post('/promote-ad',
  authenticateToken,
  catchAsync(async (req, res) => {
    const userId = req.user.userId;
    const {
      adId,
      promotionType, // 'bump_up', 'sticky', 'urgent'
      durationDays, // 3, 7, 15
      paymentReference,
      paymentMethod
    } = req.body;

    if (!adId || !promotionType || !durationDays) {
      throw new ValidationError('Ad ID, promotion type, and duration are required');
    }

    // Verify ad belongs to user
    const adCheck = await pool.query(
      'SELECT id, user_id FROM ads WHERE id = $1',
      [adId]
    );

    if (adCheck.rows.length === 0) {
      throw new NotFoundError('Ad not found');
    }

    if (adCheck.rows[0].user_id !== userId) {
      throw new ValidationError('You can only promote your own ads');
    }

    // Get user's account type
    const userResult = await pool.query(
      'SELECT account_type FROM users WHERE id = $1',
      [userId]
    );
    const accountType = userResult.rows[0].account_type;

    // Get pricing
    const pricingResult = await pool.query(
      `SELECT price FROM promotion_pricing
       WHERE promotion_type = $1 AND duration_days = $2 AND account_type = $3 AND is_active = true`,
      [promotionType, durationDays, accountType]
    );

    if (pricingResult.rows.length === 0) {
      throw new NotFoundError('Pricing not found for this promotion');
    }

    const price = pricingResult.rows[0].price;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

    // Insert promotion record
    const promotionResult = await pool.query(
      `INSERT INTO ad_promotions
       (ad_id, user_id, promotion_type, duration_days, price_paid, account_type,
        payment_reference, payment_method, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [adId, userId, promotionType, durationDays, price, accountType, paymentReference, paymentMethod, expiresAt]
    );

    // Update ad table with promotion flags
    const updateFields = [];
    const updateParams = [adId];
    let paramCount = 2;

    if (promotionType === 'bump_up') {
      updateFields.push(`is_bumped = true, bump_expires_at = $${paramCount}, last_promoted_at = CURRENT_TIMESTAMP`);
      updateParams.push(expiresAt);
      paramCount++;
    } else if (promotionType === 'sticky') {
      updateFields.push(`is_sticky = true, sticky_expires_at = $${paramCount}, last_promoted_at = CURRENT_TIMESTAMP`);
      updateParams.push(expiresAt);
      paramCount++;
    } else if (promotionType === 'urgent') {
      updateFields.push(`is_urgent = true, urgent_expires_at = $${paramCount}, last_promoted_at = CURRENT_TIMESTAMP`);
      updateParams.push(expiresAt);
      paramCount++;
    }

    updateFields.push(`total_promotions = total_promotions + 1`);

    await pool.query(
      `UPDATE ads SET ${updateFields.join(', ')} WHERE id = $1`,
      updateParams
    );

    res.json({
      success: true,
      message: 'Ad promoted successfully',
      data: promotionResult.rows[0]
    });
  })
);

// Get user's promotion history
router.get('/my-promotions', authenticateToken, catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT p.*, a.title as ad_title
     FROM ad_promotions p
     LEFT JOIN ads a ON p.ad_id = a.id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows
  });
}));

// =====================================================
// EDITOR ROUTES (Business Verification Management)
// =====================================================

// Get all business verification requests
router.get('/verification-requests',
  authenticateToken,
  requireEditor,
  catchAsync(async (req, res) => {
    const { status = 'pending' } = req.query;

    let query = `
      SELECT
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        reviewer.full_name as reviewed_by_name
      FROM business_verification_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
    `;

    const params = [];
    if (status && status !== 'all') {
      query += ' WHERE r.status = $1';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Approve business verification
router.put('/verification-requests/:id/approve',
  authenticateToken,
  requireEditor,
  logActivity('approve_business', 'business_verification'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const editorId = req.user.userId;
    const { subscriptionMonths = 1 } = req.body;

    // Get request details
    const request = await pool.query(
      'SELECT * FROM business_verification_requests WHERE id = $1',
      [id]
    );

    if (request.rows.length === 0) {
      throw new NotFoundError('Verification request not found');
    }

    const req_data = request.rows[0];

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + subscriptionMonths);

    // Update request status
    await pool.query(
      `UPDATE business_verification_requests
       SET status = 'approved', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [editorId, id]
    );

    // Update user to business account
    await pool.query(
      `UPDATE users SET
         account_type = 'business',
         business_verification_status = 'approved',
         business_name = $1,
         business_license_document = $2,
         business_category = $3,
         business_description = $4,
         business_website = $5,
         business_phone = $6,
         business_address = $7,
         business_verified_at = CURRENT_TIMESTAMP,
         business_verified_by = $8,
         business_subscription_start = CURRENT_TIMESTAMP,
         business_subscription_end = $9,
         business_subscription_status = 'active'
       WHERE id = $10`,
      [
        req_data.business_name,
        req_data.business_license_document,
        req_data.business_category,
        req_data.business_description,
        req_data.business_website,
        req_data.business_phone,
        req_data.business_address,
        editorId,
        subscriptionEnd,
        req_data.user_id
      ]
    );

    // Create subscription record
    await pool.query(
      `INSERT INTO business_subscriptions
       (user_id, plan_name, amount_paid, payment_reference, payment_method, end_date)
       VALUES ($1, $2, $3, $4, 'manual', $5)`,
      [
        req_data.user_id,
        `${subscriptionMonths}-month`,
        req_data.payment_amount,
        req_data.payment_reference,
        subscriptionEnd
      ]
    );

    res.json({
      success: true,
      message: 'Business verification approved successfully'
    });
  })
);

// Reject business verification
router.put('/verification-requests/:id/reject',
  authenticateToken,
  requireEditor,
  logActivity('reject_business', 'business_verification'),
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const editorId = req.user.userId;

    if (!reason) {
      throw new ValidationError('Rejection reason is required');
    }

    // Get request details
    const request = await pool.query(
      'SELECT user_id FROM business_verification_requests WHERE id = $1',
      [id]
    );

    if (request.rows.length === 0) {
      throw new NotFoundError('Verification request not found');
    }

    // Update request status
    await pool.query(
      `UPDATE business_verification_requests
       SET status = 'rejected', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = $2
       WHERE id = $3`,
      [editorId, reason, id]
    );

    // Update user status
    await pool.query(
      `UPDATE users SET
         business_verification_status = 'rejected',
         business_rejection_reason = $1
       WHERE id = $2`,
      [reason, request.rows[0].user_id]
    );

    res.json({
      success: true,
      message: 'Business verification rejected'
    });
  })
);

module.exports = router;
