const pool = require('../config/database');

// Middleware to log admin/editor activity
const logActivity = (actionType, targetType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to capture response
    res.json = function (data) {
      // Log activity after successful operation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Don't wait for logging - run async
        logToDatabase(req, actionType, targetType, data).catch(err => {
          console.error('Failed to log activity:', err.message);
        });
      }
      return originalJson(data);
    };

    next();
  };
};

// Helper function to log to database
async function logToDatabase(req, actionType, targetType, responseData) {
  try {
    const adminId = req.user?.userId;
    if (!adminId) return;

    // Extract target ID from params or response data
    const targetId = req.params.id || responseData?.data?.id || null;

    // Build details object
    const details = {
      method: req.method,
      path: req.path,
      params: req.params,
      body: sanitizeBody(req.body),
      query: req.query
    };

    // Get IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await pool.query(
      `INSERT INTO admin_activity_logs
       (admin_id, action_type, target_type, target_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, actionType, targetType, targetId, details, ipAddress, userAgent]
    );
  } catch (error) {
    // Don't throw - logging failure shouldn't break the request
    console.error('Activity logging error:', error.message);
  }
}

// Remove sensitive data from body before logging
function sanitizeBody(body) {
  if (!body) return {};

  const sanitized = { ...body };

  // Remove password fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;

  return sanitized;
}

module.exports = { logActivity };
