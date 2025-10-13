const express = require('express');
const router = express.Router();
const { AdController } = require('../controllers');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { postingLimiter, apiLimiter } = require('../middleware/security');
const { validate, createAdSchema, updateAdSchema, updateAdStatusSchema } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { upload, validateFileType } = require('../middleware/secureFileUpload');

// Middleware to parse stringified customFields from FormData
const parseCustomFields = (req, res, next) => {
  // Debug: Log what we received
  console.log('📦 Received req.body:', JSON.stringify(req.body, null, 2));
  console.log('📦 Received files:', req.files?.length || 0);

  if (req.body.customFields && typeof req.body.customFields === 'string') {
    try {
      req.body.customFields = JSON.parse(req.body.customFields);
      console.log('✅ Parsed customFields:', req.body.customFields);
    } catch (error) {
      console.error('❌ Error parsing customFields:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid customFields format'
      });
    }
  }
  next();
};

// Public routes
router.get('/', apiLimiter, catchAsync(AdController.getAll));

// Protected routes
router.get('/my/ads', authenticateToken, catchAsync(AdController.getMyAds));

// Public routes (keep this after /my/ads to avoid conflict)
router.get('/location/:locationSlug', apiLimiter, catchAsync(AdController.getAdsByLocation));
router.get('/:id', apiLimiter, catchAsync(AdController.getOne));
router.post('/', postingLimiter, authenticateToken, upload.array('images', 5), validateFileType, parseCustomFields, validate(createAdSchema), catchAsync(AdController.create));
router.put('/:id', authenticateToken, upload.array('images', 5), validateFileType, validate(updateAdSchema), catchAsync(AdController.update));
router.delete('/:id', authenticateToken, catchAsync(AdController.delete));

// Admin routes
router.put('/:id/status', authenticateToken, requireAdmin, validate(updateAdStatusSchema), catchAsync(AdController.updateStatus));
router.put('/:id/featured', authenticateToken, requireAdmin, catchAsync(AdController.toggleFeatured));

module.exports = router;