const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document uploads
const storage = multer.diskStorage({
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

const upload = multer({
  storage: storage,
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

// =====================================================
// SUBMIT INDIVIDUAL SELLER VERIFICATION REQUEST
// Route: POST /api/individual-verification/submit
// =====================================================
router.post('/submit', authenticateToken, upload.fields([
  { name: 'id_document_front', maxCount: 1 },
  { name: 'id_document_back', maxCount: 1 },
  { name: 'selfie_with_id', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { full_name, id_document_type, id_document_number } = req.body;

    console.log('📝 Individual verification request:', { userId, full_name, id_document_type });

    // Check if user is individual account
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

    if (userCheck.rows[0].account_type !== 'individual') {
      return res.status(400).json({
        success: false,
        message: 'Only individual seller accounts can apply for verification'
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

    console.log('✅ Individual verification request submitted:', result.rows[0].id);

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      data: { requestId: result.rows[0].id }
    });

  } catch (error) {
    console.error('❌ Error submitting individual verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting verification request'
    });
  }
});

// =====================================================
// GET USER'S VERIFICATION STATUS
// Route: GET /api/individual-verification/status
// =====================================================
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const query = `
      SELECT
        ivr.*,
        u.individual_verified
      FROM users u
      LEFT JOIN individual_verification_requests ivr
        ON u.id = ivr.user_id AND ivr.status IN ('pending', 'rejected')
      WHERE u.id = $1
      ORDER BY ivr.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          verified: false,
          hasRequest: false
        }
      });
    }

    const row = result.rows[0];

    res.json({
      success: true,
      data: {
        verified: row.individual_verified,
        hasRequest: !!row.id,
        request: row.id ? {
          id: row.id,
          status: row.status,
          id_document_type: row.id_document_type,
          created_at: row.created_at,
          rejection_reason: row.rejection_reason
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching verification status'
    });
  }
});

module.exports = router;
