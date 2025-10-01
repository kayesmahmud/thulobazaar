const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AuthenticationError } = require('./errorHandler');

/**
 * Authenticate JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new AuthenticationError('Access token required');
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      throw new AuthenticationError('Invalid or expired token');
    }

    req.user = user;
    next();
  });
};

/**
 * Check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new AuthenticationError('Admin access required');
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
    throw new AuthenticationError('This feature is not available for editors and admins');
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  requireRegularUser
};