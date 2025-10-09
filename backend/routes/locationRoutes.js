const express = require('express');
const router = express.Router();
const { LocationController } = require('../controllers');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');
const { catchAsync } = require('../middleware/errorHandler');

// Public routes
router.get('/hierarchy', apiLimiter, catchAsync(LocationController.getHierarchy));
router.get('/search', apiLimiter, catchAsync(LocationController.searchAreas));
router.get('/', apiLimiter, catchAsync(LocationController.getAll));
router.get('/:id', apiLimiter, catchAsync(LocationController.getOne));
router.get('/:id/wards', apiLimiter, catchAsync(LocationController.getWards));

// Admin routes
router.post('/'  /* authenticateToken, requireAdmin */, catchAsync(LocationController.create));
router.put('/:id'  /* authenticateToken, requireAdmin */, catchAsync(LocationController.update));
router.delete('/:id'  /* authenticateToken, requireAdmin */, catchAsync(LocationController.delete));

module.exports = router;