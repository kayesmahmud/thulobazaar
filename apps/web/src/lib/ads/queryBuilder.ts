/**
 * Ads Query Builder
 * Centralized logic for building Prisma where clauses and orderBy for ads listings
 * Used by /ads page (consolidated from former /search and /all-ads pages)
 */

import { AD_CARD_LOCATION_SELECT } from '@/lib/location/district';

export interface AdsFilterOptions {
  categoryIds?: number[];
  locationIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  condition?: 'Brand New' | 'Used';
  searchQuery?: string;
  status?: string;
  userId?: number;
}

export type AdsSortBy = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

/**
 * Build Prisma where clause for ads queries
 * Handles status, category, location, price range, condition, and search filters
 *
 * @param options - Filter options
 * @returns Prisma where clause object
 */
export function buildAdsWhereClause(options: AdsFilterOptions) {
  const {
    categoryIds,
    locationIds,
    minPrice,
    maxPrice,
    condition,
    searchQuery,
    status = 'approved',
    userId,
  } = options;

  const where: any = {
    deleted_at: null,
  };

  // Status filter
  if (status) {
    where.status = status;
  }

  // User filter (for "my ads")
  if (userId) {
    where.user_id = userId;
  }

  // For public listings (approved ads), require image and active user
  if (status === 'approved') {
    where.ad_images = {
      some: {},
    };
    // Only show ads from active users (hide suspended users' ads)
    where.users_ads_user_idTousers = {
      is_active: true,
    };
  }

  // Text search (title and description)
  if (searchQuery && searchQuery.trim()) {
    where.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (categoryIds && categoryIds.length > 0) {
    where.category_id = { in: categoryIds };
  }

  // Location filter
  if (locationIds && locationIds.length > 0) {
    where.location_id = { in: locationIds };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Condition filter (normalize to DB values)
  if (condition) {
    const c = condition.toLowerCase();
    if (c === 'new' || c === 'brand new') {
      where.condition = 'Brand New';
    } else {
      where.condition = 'Used';
    }
  }

  return where;
}

export interface OrderByOptions {
  sortBy?: AdsSortBy;
  /**
   * Apply promotion priority sorting (Urgent > Sticky, then the chosen sort).
   * True for any filtered browse/search listing:
   * - Category pages (parent AND subcategory)
   * - Location-filtered pages
   * - Search pages
   * False for the unfiltered all-ads page (/ads) and the home "Latest" feed,
   * which stay chronological.
   */
  applyPromotionPriority?: boolean;
}

/**
 * Build Prisma orderBy clause for ads queries
 * Uses published_at (first time the ad went live) for chronological sorting —
 * not created_at (submit time), and not reviewed_at (last moderation action,
 * which re-approvals after owner edits would bump back to the top)
 *
 * Sorting priority for promoted ads (only when applyPromotionPriority is true):
 * - Urgent: Appears at TOP of listings (highest priority)
 * - Sticky: Stays at top of listings (below Urgent)
 * - Featured: Has its own section on homepage, not prioritized in regular listings
 *
 * @param options - Sort options including whether to apply promotion priority
 * @returns Prisma orderBy clause
 */
export function buildAdsOrderBy(options: OrderByOptions | AdsSortBy = 'newest') {
  // Handle legacy usage where just sortBy string is passed
  const sortBy = typeof options === 'string' ? options : (options.sortBy || 'newest');
  const applyPromotionPriority = typeof options === 'string' ? false : (options.applyPromotionPriority || false);

  const base =
    sortBy === 'oldest'
      ? { published_at: { sort: 'asc' as const, nulls: 'last' as const } }
      : sortBy === 'price_asc'
        ? { price: 'asc' as const }
        : sortBy === 'price_desc'
          ? { price: 'desc' as const }
          : { published_at: { sort: 'desc' as const, nulls: 'last' as const } };

  // On filtered browse/search listings, pin promoted ads on top — Urgent >
  // Sticky — then apply the chosen sort within each group (so promotions stay
  // pinned even under a price sort). Featured is homepage-only, never pinned.
  if (applyPromotionPriority) {
    return [
      { is_urgent: 'desc' as const },
      { is_sticky: 'desc' as const },
      base,
    ];
  }
  return base;
}

/**
 * Standard ad include clause for consistent data fetching
 * Includes images, category, and user information
 */
export const standardAdInclude = {
  ad_images: {
    where: { is_primary: true },
    take: 1,
    select: {
      id: true,
      filename: true,
      file_path: true,
      is_primary: true,
    },
  },
  categories: {
    select: {
      id: true,
      name: true,
      icon: true,
    },
  },
  users_ads_user_idTousers: {
    select: {
      id: true,
      full_name: true,
      account_type: true,
      business_verification_status: true,
      individual_verified: true,
      is_suspended: true,
      is_active: true,
    },
  },
  locations: { select: AD_CARD_LOCATION_SELECT },
} as const;
