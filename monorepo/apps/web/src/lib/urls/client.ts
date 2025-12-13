/**
 * Client-safe URL utilities
 * Use this file in client components ('use client')
 *
 * Server components should use '@/lib/urls' for full functionality including:
 * - parseAdUrlParams (requires database)
 * - generateSlug (requires database)
 * - generateUniqueShopSlug (requires database)
 */

// URL builder (browser-safe)
export { buildAdUrl, generateAdListingMetadata } from './builder';

// Slug utilities (browser-safe, no database dependencies)
export { slugify, generateSeoSlug } from './slug-utils';
