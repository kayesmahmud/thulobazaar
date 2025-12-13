/**
 * URL Utilities
 * =============
 * Centralized URL building, parsing, and slug generation utilities
 *
 * Usage:
 *   // Client-safe utilities (can be used in components)
 *   import { buildAdUrl, generateAdListingMetadata, slugify } from '@/lib/urls';
 *
 *   // Server-only utilities (API routes, Server Components)
 *   import { parseAdUrlParams, getFilterIds, generateSlug } from '@/lib/urls';
 */

// Client-safe exports (no Prisma dependency)
export { buildAdUrl, generateAdListingMetadata } from './builder';

// Slug utilities
export {
  slugify,
  generateSlug,
  generateSeoSlug,
  generateUniqueShopSlug,
} from './slug';

// Server-only exports (require Prisma)
export {
  parseAdUrlParams,
  getFilterIds,
  type ParsedAdUrlParams,
} from './parser';
