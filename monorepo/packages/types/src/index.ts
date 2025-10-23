/**
 * @thulobazaar/types
 *
 * This package exports BOTH database types (snake_case) and API types (camelCase)
 *
 * ⚠️ IMPORTANT:
 * - Use Database types (DbUser, DbAd, etc.) when working with PostgreSQL queries
 * - Use API types (User, Ad, etc.) for frontend/mobile TypeScript code
 * - ALWAYS use transformers to convert between them!
 * - Use type guards for runtime validation (2025 best practice)
 */

// Export database types (snake_case - matches PostgreSQL schema)
export * from './database';

// Export API types (camelCase - for frontend/mobile)
export * from './api';

// Export transformers (CRITICAL for converting between DB and API)
export * from './transformers';

// Export type guards (2025 best practice for runtime type checking)
export * from './guards';
