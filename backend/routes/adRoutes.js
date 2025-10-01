const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { AdController } = require('../controllers');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { postingLimiter, apiLimiter } = require('../middleware/security');
const { validate, createAdSchema, updateAdSchema, updateAdStatusSchema } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Public routes
router.get('/', apiLimiter, catchAsync(AdController.getAll));

// Protected routes
router.get('/my/ads', authenticateToken, catchAsync(AdController.getMyAds));

// Public routes (keep this after /my/ads to avoid conflict)
router.get('/:id', apiLimiter, catchAsync(AdController.getOne));
router.post('/', postingLimiter, authenticateToken, upload.array('images', 5), validate(createAdSchema), catchAsync(AdController.create));
router.put('/:id', authenticateToken, upload.array('images', 5), validate(updateAdSchema), catchAsync(AdController.update));
router.delete('/:id', authenticateToken, catchAsync(AdController.delete));

// Admin routes
router.put('/:id/status', authenticateToken, requireAdmin, validate(updateAdStatusSchema), catchAsync(AdController.updateStatus));
router.put('/:id/featured', authenticateToken, requireAdmin, catchAsync(AdController.toggleFeatured));

module.exports = router;