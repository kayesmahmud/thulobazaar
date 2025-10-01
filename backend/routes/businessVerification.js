const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { catchAsync, ValidationError } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/business-licenses');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for business license upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'business-license-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed'));
    }
  }
});

// Submit business verification request
router.post('/submit', upload.single('business_license'), catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const {
    business_name,
    business_category,
    business_description,
    business_website,
    business_phone,
    business_address,
    payment_reference,
    payment_amount
  } = req.body;

  // Validation
  if (!business_name) {
    throw new ValidationError('Business name is required');
  }

  if (!req.file) {
    throw new ValidationError('Business license document is required');
  }

  // Check if user already has a pending or approved request
  const existingRequest = await pool.query(
    `SELECT id, status FROM business_verification_requests
     WHERE user_id = $1 AND status IN ('pending', 'approved')
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (existingRequest.rows.length > 0) {
    const status = existingRequest.rows[0].status;
    if (status === 'approved') {
      throw new ValidationError('Your business account is already verified');
    }
    if (status === 'pending') {
      throw new ValidationError('You already have a pending verification request. Please wait for review.');
    }
  }

  // If there was a rejected request, user can reapply (no error thrown)

  // Insert business verification request
  const result = await pool.query(
    `INSERT INTO business_verification_requests (
      user_id, business_name, business_license_document, business_category,
      business_description, business_website, business_phone, business_address,
      payment_reference, payment_amount, status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, status, created_at`,
    [
      userId,
      business_name,
      req.file.filename,
      business_category || null,
      business_description || null,
      business_website || null,
      business_phone || null,
      business_address || null,
      payment_reference || null,
      payment_amount || null
    ]
  );

  res.json({
    success: true,
    message: 'Business verification request submitted successfully',
    data: result.rows[0]
  });
}));

// Get user's business verification status
router.get('/status', catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT
      id, business_name, business_category, business_description,
      business_website, business_phone, business_address,
      payment_reference, payment_amount, status,
      reviewed_at, rejection_reason, created_at
    FROM business_verification_requests
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: null
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Get business verification pricing/info
router.get('/info', catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: {
      verification_fee: 1000, // NPR 1000 for business verification
      benefits: [
        'Golden verified badge on your profile and ads',
        '30-40% discount on ad promotions',
        'Priority customer support',
        'Increased trust and credibility',
        'Business profile page'
      ],
      required_documents: [
        'Business registration certificate',
        'Tax registration document (PAN)',
        'Or any government-issued business license'
      ],
      processing_time: '1-2 business days'
    }
  });
}));

module.exports = router;
