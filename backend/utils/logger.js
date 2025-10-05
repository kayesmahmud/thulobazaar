const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for files (production) - JSON structured logs
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define transports
const transports = [];

// Always log to console in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// In production, log to files
if (process.env.NODE_ENV === 'production') {
  // All logs
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
    })
  );

  // Error logs only
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
    })
  );

  // Also log to console in production (for docker/cloud logging)
  transports.push(
    new winston.transports.Console({
      format: fileFormat, // JSON format for production
    })
  );
} else {
  // In development, also log to files for reference
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'development.log'),
      format: fileFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

/**
 * Helper functions for structured logging
 */

// Log HTTP requests
logger.http = (message, meta = {}) => {
  logger.log('http', message, meta);
};

// Log errors with full context
logger.logError = (err, req = null, additionalInfo = {}) => {
  const errorLog = {
    message: err.message,
    stack: err.stack,
    name: err.name,
    statusCode: err.statusCode || 500,
    ...additionalInfo,
  };

  if (req) {
    errorLog.request = {
      url: req.originalUrl || req.url,
      method: req.method,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
      body: process.env.NODE_ENV === 'development' ? req.body : undefined, // Don't log body in production (may contain sensitive data)
    };
  }

  logger.error(errorLog);
};

// Log database queries (optional - for debugging)
logger.logQuery = (query, params = [], duration = null) => {
  if (process.env.LOG_QUERIES === 'true') {
    logger.debug('Database Query', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
};

// Log security events
logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Log business events (analytics)
logger.logEvent = (event, data = {}) => {
  logger.info('Business Event', {
    event,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

module.exports = logger;
