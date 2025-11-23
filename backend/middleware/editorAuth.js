const { AuthorizationError } = require('./errorHandler');

// Middleware to check if user is editor, super_admin, or root
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  const userRole = req.user.role;

  if (userRole !== 'editor' && userRole !== 'super_admin' && userRole !== 'root') {
    return next(new AuthorizationError('Editor, Super Admin, or Root Admin access required'));
  }

  next();
};

// Middleware to check if user is super_admin or root
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'root') {
    return next(new AuthorizationError('Super Admin or Root Admin access required'));
  }

  next();
};

module.exports = {
  requireEditor,
  requireSuperAdmin
};
