const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { BUSINESS_VERIFICATION_STATUS, isBusinessVerified } = require('../constants/verificationStatus');

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Configure multer for cover photo uploads
const coverStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/covers');
    try {
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `cover-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for avatar
});

const uploadCover = multer({
  storage: coverStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for cover photo
});

// GET /api/profile - Get current user's profile
router.get('/', async (req, res) => {
  try {
    console.log('📋 Profile request - req.user:', req.user);

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    console.log('📋 Using userId:', userId);

    const result = await pool.query(
      `SELECT u.id, u.full_name as name, u.email, u.bio, u.avatar, u.cover_photo, u.phone,
              u.location_id, l.name as location_name, u.role, u.created_at,
              u.shop_slug, u.seller_slug, u.account_type, u.business_verification_status, u.individual_verified, u.business_name, u.custom_shop_slug
       FROM users u
       LEFT JOIN locations l ON u.location_id = l.id
       WHERE u.id = $1`,
      [userId]
    );

    console.log('📋 Query result:', result.rows.length, 'rows');

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Don't send password-related fields
    delete user.password;

    // Transform to camelCase for frontend consistency
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      coverPhoto: user.cover_photo,
      phone: user.phone,
      locationId: user.location_id,
      locationName: user.location_name,
      role: user.role,
      createdAt: user.created_at,
      shopSlug: user.shop_slug,
      sellerSlug: user.seller_slug,
      accountType: user.account_type,
      businessName: user.business_name,
      businessVerificationStatus: user.business_verification_status,
      individualVerified: user.individual_verified,
      customShopSlug: user.custom_shop_slug
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// PUT /api/profile - Update user profile
router.put('/', async (req, res) => {
  try {
    const { name, bio, phone, location_id } = req.body;

    console.log('📝 Profile UPDATE - req.user:', req.user);
    console.log('📝 Profile UPDATE - req.body:', req.body);

    // Validation
    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }

    if (phone && !/^[\d\s\-\+\(\)]{7,20}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const userId = req.user?.userId || req.user?.id;

    // Check if user is trying to change name while verified
    if (name !== undefined) {
      const userCheck = await pool.query(
        'SELECT individual_verified, business_verification_status FROM users WHERE id = $1',
        [userId]
      );

      const user = userCheck.rows[0];

      // Prevent name change if user has individual verification badge
      if (user.individual_verified) {
        return res.status(403).json({
          error: 'Cannot change name while individually verified. Contact support to revoke verification first.'
        });
      }

      // Prevent name change if user has business verification badge
      if (isBusinessVerified(user.business_verification_status)) {
        return res.status(403).json({
          error: 'Cannot change name while business account is verified. Contact support to revoke verification first.'
        });
      }
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`full_name = $${paramCount++}`);
      values.push(name);
      console.log('📝 Updating full_name to:', name);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
      console.log('📝 Updating bio to:', bio);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (location_id !== undefined) {
      updates.push(`location_id = $${paramCount++}`);
      values.push(location_id === 'null' || location_id === '' ? null : location_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    console.log('📝 Updating for userId:', userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, full_name as name, email, bio, avatar, cover_photo, phone, location_id, role, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    console.log('✅ Profile UPDATE result:', result.rows[0]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get location name if location_id was updated
    if (result.rows[0].location_id) {
      const locationResult = await pool.query(
        'SELECT name FROM locations WHERE id = $1',
        [result.rows[0].location_id]
      );
      result.rows[0].location_name = locationResult.rows[0]?.name || null;
    }

    console.log('✅ Profile UPDATE sending back:', result.rows[0]);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profile/avatar - Upload avatar
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;

    // Get old avatar to delete it
    const oldAvatarResult = await pool.query(
      'SELECT avatar FROM users WHERE id = $1',
      [req.user.userId]
    );

    // Update user's avatar in database
    await pool.query(
      'UPDATE users SET avatar = $1, updated_at = NOW() WHERE id = $2',
      [filename, req.user.userId]
    );

    // Delete old avatar file if it exists
    if (oldAvatarResult.rows[0]?.avatar) {
      const oldPath = path.join(__dirname, '../uploads/avatars', oldAvatarResult.rows[0].avatar);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Old avatar file not found or already deleted');
      }
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: filename,
        url: `/uploads/avatars/${filename}`
      }
    });
  } catch (err) {
    console.error('Error uploading avatar:', err);

    // Clean up uploaded file if database update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting uploaded file:', unlinkErr);
      }
    }

    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// POST /api/profile/cover - Upload cover photo
router.post('/cover', uploadCover.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;

    // Get old cover photo to delete it
    const oldCoverResult = await pool.query(
      'SELECT cover_photo FROM users WHERE id = $1',
      [req.user.userId]
    );

    // Update user's cover photo in database
    await pool.query(
      'UPDATE users SET cover_photo = $1, updated_at = NOW() WHERE id = $2',
      [filename, req.user.userId]
    );

    // Delete old cover photo file if it exists
    if (oldCoverResult.rows[0]?.cover_photo) {
      const oldPath = path.join(__dirname, '../uploads/covers', oldCoverResult.rows[0].cover_photo);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.log('Old cover photo not found or already deleted');
      }
    }

    res.json({
      success: true,
      message: 'Cover photo uploaded successfully',
      data: {
        cover_photo: filename,
        url: `/uploads/covers/${filename}`
      }
    });
  } catch (err) {
    console.error('Error uploading cover photo:', err);

    // Clean up uploaded file if database update failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting uploaded file:', unlinkErr);
      }
    }

    res.status(500).json({ error: 'Failed to upload cover photo' });
  }
});

// DELETE /api/profile/avatar - Remove avatar
router.delete('/avatar', async (req, res) => {
  try {
    // Get current avatar
    const result = await pool.query(
      'SELECT avatar FROM users WHERE id = $1',
      [req.user.userId]
    );

    const avatar = result.rows[0]?.avatar;

    if (!avatar) {
      return res.status(404).json({ error: 'No avatar to delete' });
    }

    // Remove from database
    await pool.query(
      'UPDATE users SET avatar = NULL, updated_at = NOW() WHERE id = $1',
      [req.user.userId]
    );

    // Delete file
    const filePath = path.join(__dirname, '../uploads/avatars', avatar);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.log('Avatar file not found or already deleted');
    }

    res.json({
      success: true,
      message: 'Avatar removed successfully'
    });
  } catch (err) {
    console.error('Error removing avatar:', err);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
});

// DELETE /api/profile/cover - Remove cover photo
router.delete('/cover', async (req, res) => {
  try {
    // Get current cover photo
    const result = await pool.query(
      'SELECT cover_photo FROM users WHERE id = $1',
      [req.user.userId]
    );

    const coverPhoto = result.rows[0]?.cover_photo;

    if (!coverPhoto) {
      return res.status(404).json({ error: 'No cover photo to delete' });
    }

    // Remove from database
    await pool.query(
      'UPDATE users SET cover_photo = NULL, updated_at = NOW() WHERE id = $1',
      [req.user.userId]
    );

    // Delete file
    const filePath = path.join(__dirname, '../uploads/covers', coverPhoto);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.log('Cover photo file not found or already deleted');
    }

    res.json({
      success: true,
      message: 'Cover photo removed successfully'
    });
  } catch (err) {
    console.error('Error removing cover photo:', err);
    res.status(500).json({ error: 'Failed to remove cover photo' });
  }
});

module.exports = router;
