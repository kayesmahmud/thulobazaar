const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../config/env');

/**
 * Helmet.js configuration for HTTP headers security
 * Protects against common web vulnerabilities
 */
const helmetConfig = () => {
  return helmet({
    // Content Security Policy - Disabled in development for easier debugging
    contentSecurityPolicy: config.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...config.CORS_ORIGIN],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : false, // Disable CSP in development
    // Prevent clickjacking
    frameguard: {
      action: 'deny'
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // Prevent MIME type sniffing
    noSniff: true,
    // Enable XSS filter
    xssFilter: true,
    // Enforce HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  });
};

/**
 * Sanitize data to prevent NoSQL injection
 * Removes $ and . characters from user input
 */
const sanitizeData = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[Security] Sanitized key "${key}" in request from ${req.ip}`);
    }
  });
};

/**
 * Prevent XSS attacks
 * Cleans user input from malicious HTML/JS code
 */
const preventXSS = () => {
  return xss();
};

/**
 * Prevent HTTP Parameter Pollution
 * Protects against duplicate parameter attacks
 */
const preventParameterPollution = () => {
  return hpp({
    whitelist: [
      // Allow these parameters to appear multiple times
      'category',
      'tags',
      'sort',
      'fields',
      // Add all parameters used in your app
      'search',
      'location',
      'minPrice',
      'maxPrice',
      'condition',
      'datePosted',
      'dateFrom',
      'dateTo',
      'sortBy',
      'sortOrder',
      'limit',
      'offset',
      'lat',
      'lng',
      'radius',
      'q' // for search queries
    ]
  });
};

/**
 * Security headers middleware
 * Adds additional custom security headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent browsers from performing MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent page from being displayed in iframe
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable browser's XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control how much referrer information should be included
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Prevent Adobe Flash and PDF from accessing content
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Feature Policy / Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  next();
};

/**
 * Request logging for security monitoring
 */
const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const path = req.path;

  // Log suspicious patterns
  const suspiciousPatterns = [
    /(<script|javascript:|onerror=|onload=)/i, // XSS attempts
    /(\$where|\$ne|\$gt|\$lt)/i, // NoSQL injection
    /(union|select|insert|update|delete|drop)/i, // SQL injection
    /(\.\.\/|\.\.\\)/i, // Path traversal
  ];

  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(queryString) || pattern.test(bodyString) || pattern.test(path)) {
      console.warn(`[Security Alert] ${timestamp} - Suspicious request from ${ip}: ${method} ${path}`);
    }
  });

  next();
};

/**
 * Custom sanitization middleware for Express 5 compatibility
 * Replaces express-mongo-sanitize and xss-clean
 */
const sanitizeRequest = (req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    Object.keys(obj).forEach(key => {
      // Remove keys that start with $ (NoSQL injection prevention)
      if (key.startsWith('$')) {
        delete obj[key];
        console.warn(`[Security] Removed suspicious key "${key}" from request`);
        return;
      }

      if (typeof obj[key] === 'string') {
        // Remove $, {, } characters (NoSQL injection prevention)
        obj[key] = obj[key].replace(/[\$\{\}]/g, '');

        // Remove common XSS patterns
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object') {
        sanitizeObj(obj[key]);
      }
    });
    return obj;
  };

  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);

  next();
};

/**
 * Rate limiter stubs (to be implemented with actual rate limiting logic)
 */
const apiLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();
const postingLimiter = (req, res, next) => next();
const messagingLimiter = (req, res, next) => next();

module.exports = {
  helmetConfig,
  sanitizeData,
  preventXSS,
  preventParameterPollution,
  preventParamPollution: preventParameterPollution, // Alias for server.js compatibility
  customSecurityHeaders: securityHeaders, // Alias for server.js compatibility
  securityHeaders,
  securityLogger,
  sanitizeRequest,
  apiLimiter,
  authLimiter,
  postingLimiter,
  messagingLimiter
};
