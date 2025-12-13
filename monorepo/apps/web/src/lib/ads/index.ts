/**
 * Ads Utilities
 * =============
 * Centralized utilities for ad management, configuration, and queries
 *
 * Usage:
 *   import { adsConfig, buildAdsWhereClause, generateUniqueSlug } from '@/lib/ads';
 */

// Ad helpers (slug generation, image management)
export {
  generateSlugFromTitle,
  generateUniqueSlug,
  saveAdImages,
  deleteAdImages,
  validateAdOwnership,
} from './helpers';

// Google AdSense configuration
export {
  adsConfig,
  adSizes,
  adSlots,
  type AdSize,
  type AdSlot,
} from './config';

// Query builder for ads listings
export {
  buildAdsWhereClause,
  buildAdsOrderBy,
  standardAdInclude,
  type AdsFilterOptions,
  type AdsSortBy,
} from './queryBuilder';
