const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AuthenticationError } = require('./errorHandler');

/**
 * Authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔐 [Middleware/Auth] Token present:', !!token);

  if (!token) {
    return next(new AuthenticationError('Access token required'));
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ [Middleware/Auth] Token verification failed:', err.message);
      return next(new AuthenticationError('Invalid or expired token'));
    }

    console.log('✅ [Middleware/Auth] Token decoded successfully - user:', user);
    req.user = user;
    next();
  });
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AuthenticationError('Admin access required'));
  }
  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

/**
 * Require regular user (not editor or admin)
 */
const requireRegularUser = (req, res, next) => {
  if (req.user.role === 'editor' || req.user.role === 'super_admin') {
    return next(new AuthenticationError('This feature is not available for editors and admins'));
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  requireRegularUser
};