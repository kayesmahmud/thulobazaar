const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for individual verification document uploads
const individualStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/individual_verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const individualUpload = multer({
  storage: individualStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// Configure multer for business verification document uploads
const businessStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/business_verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'biz-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const businessUpload = multer({
  storage: businessStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  }
});

// For backwards compatibility
const upload = individualUpload;

// =====================================================
// GET UNIFIED VERIFICATION STATUS (Business + Individual)
// Route: GET /api/verification/status
// =====================================================
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Get user account type and verification status
    const userQuery = `
      SELECT
        account_type,
        business_verification_status,
        individual_verified
      FROM users
      WHERE id = $1
    `;

    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Initialize response
    const response = {
      success: true,
      data: {
        accountType: user.account_type,
        businessVerification: {
          status: user.business_verification_status || 'none',
          verified: user.business_verification_status === 'approved'
        },
        individualVerification: {
          verified: user.individual_verified || false
        }
      }
    };

    // Get pending business verification requests
    if (user.account_type === 'business') {
      const businessReqQuery = `
        SELECT id, status, business_name, created_at, rejection_reason
        FROM business_verification_requests
        WHERE user_id = $1 AND status IN ('pending', 'rejected')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const businessReq = await pool.query(businessReqQuery, [userId]);

      if (businessReq.rows.length > 0) {
        response.data.businessVerification.hasRequest = true;
        response.data.businessVerification.request = businessReq.rows[0];
      } else {
        response.data.businessVerification.hasRequest = false;
      }
    }

    // Get pending individual verification requests
    const individualReqQuery = `
      SELECT id, status, full_name, id_document_type, created_at, rejection_reason
      FROM individual_verification_requests
      WHERE user_id = $1 AND status IN ('pending', 'rejected')
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const individualReq = await pool.query(individualReqQuery, [userId]);

    if (individualReq.rows.length > 0) {
      response.data.individualVerification.hasRequest = true;
      response.data.individualVerification.request = individualReq.rows[0];
    } else {
      response.data.individualVerification.hasRequest = false;
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching verification status'
    });
  }
});

// =====================================================
// SUBMIT INDIVIDUAL SELLER VERIFICATION REQUEST
// Route: POST /api/verification/individual
// =====================================================
router.post('/individual', authenticateToken, upload.fields([
  { name: 'id_document_front', maxCount: 1 },
  { name: 'id_document_back', maxCount: 1 },
  { name: 'selfie_with_id', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { full_name, id_document_type, id_document_number } = req.body;

    // Check if user exists and is individual account
    const userCheck = await pool.query(
      'SELECT account_type, individual_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userCheck.rows[0].individual_verified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified'
      });
    }

    // Check for pending requests
    const pendingCheck = await pool.query(
      'SELECT id FROM individual_verification_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request'
      });
    }

    // Validate required files
    if (!req.files || !req.files.id_document_front || !req.files.selfie_with_id) {
      return res.status(400).json({
        success: false,
        message: 'ID document front and selfie with ID are required'
      });
    }

    // Validate full_name
    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    // Insert verification request
    const insertQuery = `
      INSERT INTO individual_verification_requests (
        user_id, full_name, id_document_type, id_document_number,
        id_document_front, id_document_back, selfie_with_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      userId,
      full_name.trim(),
      id_document_type,
      id_document_number,
      req.files.id_document_front[0].filename,
      req.files.id_document_back ? req.files.id_document_back[0].filename : null,
      req.files.selfie_with_id[0].filename
    ]);

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: { requestId: result.rows[0].id }
    });

  } catch (error) {
    console.error('Error submitting individual verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting verification request',
      error: error.message
    });
  }
});

// =====================================================
// SUBMIT BUSINESS VERIFICATION REQUEST
// Route: POST /api/verification/business
// =====================================================
router.post('/business', authenticateToken, businessUpload.fields([
  { name: 'business_license_document', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      business_name,
      business_category,
      business_description,
      business_website,
      business_phone,
      business_address
    } = req.body;

    console.log('📝 Business verification request:', { userId, business_name });

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT business_verification_status FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (userCheck.rows[0].business_verification_status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Your business is already verified'
      });
    }

    // Check for pending requests
    const pendingCheck = await pool.query(
      'SELECT id FROM business_verification_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending verification request'
      });
    }

    // Validate required files
    if (!req.files || !req.files.business_license_document) {
      return res.status(400).json({
        success: false,
        message: 'Business license document is required'
      });
    }

    // Validate required fields
    if (!business_name || !business_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Business name is required'
      });
    }

    // Insert verification request
    const insertQuery = `
      INSERT INTO business_verification_requests (
        user_id, business_name, business_license_document,
        business_category, business_description, business_website,
        business_phone, business_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      userId,
      business_name.trim(),
      req.files.business_license_document[0].filename,
      business_category || null,
      business_description || null,
      business_website || null,
      business_phone || null,
      business_address || null
    ]);

    console.log('✅ Business verification request submitted:', result.rows[0].id);

    res.json({
      success: true,
      message: 'Business verification request submitted successfully',
      data: { requestId: result.rows[0].id }
    });

  } catch (error) {
    console.error('❌ Error submitting business verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting verification request'
    });
  }
});

module.exports = router;
