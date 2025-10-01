const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('../config/env');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  noSniff: true,
  xssFilter: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

const sanitizeData = mongoSanitize({
  replaceWith: '_'
});

const preventXSS = xss();

const preventParamPollution = hpp({
  whitelist: ['category', 'tags', 'sort', 'fields']
});

const customSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  next();
};

const sanitizeRequest = (req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].replace(/[\$\{\}]/g, '');
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

const apiLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();
const postingLimiter = (req, res, next) => next();
const messagingLimiter = (req, res, next) => next();

module.exports = {
  helmetConfig,
  sanitizeData,
  preventXSS,
  preventParamPollution,
  customSecurityHeaders,
  sanitizeRequest,
  apiLimiter,
  authLimiter,
  postingLimiter,
  messagingLimiter
};
