const { AuthorizationError } = require('./errorHandler');

// Middleware to check if user is editor or super_admin
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  const userRole = req.user.role;

  if (userRole !== 'editor' && userRole !== 'super_admin') {
    return next(new AuthorizationError('Editor or Super Admin access required'));
  }

  next();
};

// Middleware to check if user is super_admin only
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role !== 'super_admin') {
    return next(new AuthorizationError('Super Admin access required'));
  }

  next();
};

module.exports = {
  requireEditor,
  requireSuperAdmin
};
