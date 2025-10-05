const express = require('express');
const router = express.Router();
const { AdController } = require('../controllers');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { postingLimiter, apiLimiter } = require('../middleware/security');
const { validate, createAdSchema, updateAdSchema, updateAdStatusSchema } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const { upload, validateFileType } = require('../middleware/secureFileUpload');

// Public routes
router.get('/', apiLimiter, catchAsync(AdController.getAll));

// Protected routes
router.get('/my/ads', authenticateToken, catchAsync(AdController.getMyAds));

// Public routes (keep this after /my/ads to avoid conflict)
router.get('/:id', apiLimiter, catchAsync(AdController.getOne));
router.post('/', postingLimiter, authenticateToken, upload.array('images', 5), validateFileType, validate(createAdSchema), catchAsync(AdController.create));
router.put('/:id', authenticateToken, upload.array('images', 5), validateFileType, validate(updateAdSchema), catchAsync(AdController.update));
router.delete('/:id', authenticateToken, catchAsync(AdController.delete));

// Admin routes
router.put('/:id/status', authenticateToken, requireAdmin, validate(updateAdStatusSchema), catchAsync(AdController.updateStatus));
router.put('/:id/featured', authenticateToken, requireAdmin, catchAsync(AdController.toggleFeatured));

module.exports = router;