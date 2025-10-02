const express = require('express');
const router = express.Router();
const { CategoryController } = require('../controllers');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');
const { catchAsync } = require('../middleware/errorHandler');

// Public routes
router.get('/', apiLimiter, catchAsync(CategoryController.getAll));
router.get('/:id', apiLimiter, catchAsync(CategoryController.getOne));

// Admin routes
router.post('/'  /* authenticateToken, requireAdmin */, catchAsync(CategoryController.create));
router.put('/:id'  /* authenticateToken, requireAdmin */, catchAsync(CategoryController.update));
router.delete('/:id'  /* authenticateToken, requireAdmin */, catchAsync(CategoryController.delete));

module.exports = router;