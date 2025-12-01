/**
 * Application Constants
 * Centralized configuration for all magic strings and numbers
 */

export const AD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const USER_ROLES = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
} as const;

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  MAX_FILES_PER_AD: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
} as const;

export const SECURITY = {
  BCRYPT_SALT_ROUNDS: 12,
  JWT_EXPIRES_IN: '24h',
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const LOCATION = {
  DEFAULT_RADIUS_KM: 25,
  MAX_RADIUS_KM: 100,
} as const;

export const CACHE = {
  SEARCH_RESULTS_TTL: 300, // 5 minutes in seconds
  CATEGORIES_TTL: 3600,    // 1 hour in seconds
  LOCATIONS_TTL: 3600,     // 1 hour in seconds
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;

export const AD_CONDITION = {
  NEW: 'new',
  USED: 'used',
  REFURBISHED: 'refurbished',
} as const;

export const PROMOTION_TYPES = {
  BUMP: 'bump',
  FEATURED: 'featured',
  URGENT: 'urgent',
  STICKY: 'sticky',
} as const;

export const TIME_INTERVALS = {
  LAST_24H: '24 hours',
  LAST_7_DAYS: '7 days',
  LAST_30_DAYS: '30 days',
} as const;

export const DB_LIMITS = {
  CONNECTION_TIMEOUT: 5000,     // 5 seconds
  STATEMENT_TIMEOUT: 30000,     // 30 seconds
  POOL_MIN: 5,
  POOL_MAX: 20,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  AD_NOT_FOUND: 'Ad not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  VALIDATION_FAILED: 'Validation failed',
  DUPLICATE_ENTRY: 'Duplicate entry',
  SERVER_ERROR: 'Internal server error',
} as const;

// Type exports for type safety
export type AdStatus = typeof AD_STATUS[keyof typeof AD_STATUS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];
export type AdCondition = typeof AD_CONDITION[keyof typeof AD_CONDITION];
export type PromotionType = typeof PROMOTION_TYPES[keyof typeof PROMOTION_TYPES];
