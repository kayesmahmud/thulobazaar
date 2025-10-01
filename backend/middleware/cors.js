const cors = require('cors');
const config = require('../config/env');

/**
 * CORS configuration
 * Restricts which origins can access the API
 */
const corsOptions = {
  // Allowed origins from environment variable
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (config.CORS_ORIGIN.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Exposed headers (accessible to client)
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Total-Count'
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Cache preflight requests for 24 hours
  maxAge: 86400,

  // Success status for OPTIONS requests
  optionsSuccessStatus: 204
};

/**
 * Development-only permissive CORS
 * Only use in development environment
 */
const devCorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

/**
 * Apply CORS middleware based on environment
 */
const corsMiddleware = () => {
  if (config.NODE_ENV === 'development') {
    console.log('🔓 Using permissive CORS for development');
    return cors(devCorsOptions);
  }

  console.log('🔒 Using restricted CORS for production');
  return cors(corsOptions);
};

module.exports = corsMiddleware;
