const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation error handler
 * Formats validation errors and sends response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    console.warn(`[Validation] Request failed validation from ${req.ip}:`, formattedErrors);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // SQL Injection protection - reject dangerous SQL patterns
  noSQLInjection: (field) => {
    return body(field)
      .trim()
      .matches(/^[^;'"\\]*$/)
      .withMessage(`${field} contains invalid characters`)
      .customSanitizer(value => {
        // Remove common SQL injection patterns
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
          /(--|;|\/\*|\*\/|xp_|sp_)/gi,
          /('|(--)|;|\/\*|\*\/|xp_)/gi
        ];
        
        let sanitized = value;
        sqlPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
      });
  },

  // XSS protection - sanitize HTML
  noXSS: (field) => {
    return body(field)
      .trim()
      .escape()
      .customSanitizer(value => {
        // Remove common XSS patterns
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi, // onclick, onerror, etc.
          /<iframe/gi,
          /<object/gi,
          /<embed/gi
        ];
        
        let sanitized = value;
        xssPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
      });
  },

  // Email validation
  email: () => {
    return body('email')
      .trim()
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email too long');
  },

  // Password validation
  password: () => {
    return body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^[A-Za-z\d@$!%*?&]+$/)
      .withMessage('Password must contain only letters, numbers, or special characters');
  },

  // Phone validation
  phone: () => {
    return body('phone')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]+$/)
      .withMessage('Invalid phone number format')
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone number must be between 10-20 characters');
  },

  // ID validation (numeric)
  id: (paramName = 'id') => {
    return param(paramName)
      .isInt({ min: 1 })
      .withMessage(`${paramName} must be a positive integer`)
      .toInt();
  },

  // Text validation (general purpose)
  text: (field, minLength = 1, maxLength = 1000) => {
    return body(field)
      .trim()
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
      .escape();
  },

  // Search query validation
  searchQuery: () => {
    return query('q')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Search query too long')
      .customSanitizer(value => {
        // Remove special regex characters that could cause issues
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      });
  },

  // Pagination validation
  pagination: () => {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt()
    ];
  },

  // Category validation
  category: () => {
    return body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category name too long')
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage('Category contains invalid characters');
  },

  // Price validation
  price: () => {
    return body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number')
      .toFloat();
  },

  // URL validation
  url: (field) => {
    return body(field)
      .optional()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage(`${field} must be a valid URL`);
  },

  // Array validation
  array: (field, maxLength = 10) => {
    return body(field)
      .optional()
      .isArray({ max: maxLength })
      .withMessage(`${field} must be an array with maximum ${maxLength} items`);
  }
};

/**
 * Validate ad creation
 */
const validateAdCreation = [
  validationRules.noXSS('title'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  validationRules.noXSS('description'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  
  validationRules.price(),
  validationRules.category(),
  
  handleValidationErrors
];

/**
 * Validate user registration
 */
const validateUserRegistration = [
  validationRules.noXSS('name'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  validationRules.email(),
  validationRules.password(),
  validationRules.phone(),
  
  handleValidationErrors
];

/**
 * Validate user login
 */
const validateUserLogin = [
  validationRules.email(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validate search query
 */
const validateSearch = [
  validationRules.searchQuery(),
  ...validationRules.pagination(),
  
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category too long'),
  
  handleValidationErrors
];

/**
 * Validate ID parameter
 */
const validateId = [
  validationRules.id('id'),
  handleValidationErrors
];

/**
 * Joi-style validation wrapper for server.js compatibility
 */
const Joi = require('joi');

// Joi schemas for compatibility with server.js
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Your email is not in correct format. Please use format like: example@gmail.com',
      'string.empty': 'Email is required',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^[A-Za-z\d@$!%*?&]+$/)
    .required()
    .messages({
      'string.min': 'Please make at least 8 letter/number character password',
      'string.pattern.base': 'Password can only contain letters, numbers, and special characters (@$!%*?&)',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name is too long (maximum 100 characters)',
      'string.empty': 'Full name is required',
      'any.required': 'Full name is required'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number is not in correct format. Please use 10 digits like: 9841234567'
    })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const createAdSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(5000).required(),
  price: Joi.number().positive().required(),
  condition: Joi.string().valid('new', 'used', 'refurbished').optional(), // Made optional - now in customFields
  categoryId: Joi.number().integer().positive().required(),
  locationId: Joi.number().integer().positive().optional(), // Keep for backward compatibility
  areaId: Joi.number().integer().positive().optional(), // New field name
  sellerName: Joi.string().min(2).max(100).required(),
  sellerPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).required(),
  customFields: Joi.object().optional() // Accept template-specific custom fields
}).or('locationId', 'areaId'); // At least one location field must be provided

const updateAdSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).max(5000).optional(),
  price: Joi.number().positive().optional(),
  condition: Joi.string().valid('new', 'used', 'refurbished').optional(),
  categoryId: Joi.number().integer().positive().optional(),
  locationId: Joi.number().integer().positive().optional(),
  sellerName: Joi.string().min(2).max(100).optional(),
  sellerPhone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).optional()
});

const contactSellerSchema = Joi.object({
  adId: Joi.number().integer().positive().required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).allow('', null).optional(),
  message: Joi.string().min(10).max(1000).required()
});

const reportAdSchema = Joi.object({
  adId: Joi.number().integer().positive().required(),
  reason: Joi.string().valid('spam', 'inappropriate', 'fraud', 'duplicate', 'other').required(),
  details: Joi.string().max(500).allow('', null).optional()
});

const updateAdStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'pending').required(),
  reason: Joi.string().max(500).allow('', null).optional()
});

const searchQuerySchema = Joi.object({
  q: Joi.string().max(200).optional(),
  category: Joi.string().max(50).optional(),
  location: Joi.string().max(50).optional(),
  minPrice: Joi.number().positive().optional(),
  maxPrice: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

/**
 * Validate function that works with Joi schemas
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.warn('[Validation] Request failed validation:', errors);

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validateAsync(req.query, { abortEarly: false });
      next();
    } catch (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }
  };
};

module.exports = {
  validationRules,
  handleValidationErrors,
  validateAdCreation,
  validateUserRegistration,
  validateUserLogin,
  validateSearch,
  validateId,
  // Joi schemas and functions for server.js compatibility
  validate,
  validateQuery,
  registerSchema,
  loginSchema,
  createAdSchema,
  updateAdSchema,
  contactSellerSchema,
  reportAdSchema,
  updateAdStatusSchema,
  searchQuerySchema
};
