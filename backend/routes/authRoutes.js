const express = require('express');
const router = express.Router();
const { AuthController } = require('../controllers');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validate, registerSchema, loginSchema } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

// Public routes
router.post('/register', authLimiter, validate(registerSchema), catchAsync(AuthController.register));
router.post('/login', authLimiter, validate(loginSchema), catchAsync(AuthController.login));

// Protected routes
router.get('/profile', authenticateToken, catchAsync(AuthController.getProfile));
router.put('/profile', authenticateToken, catchAsync(AuthController.updateProfile));
router.put('/change-password', authenticateToken, catchAsync(AuthController.changePassword));

module.exports = router;