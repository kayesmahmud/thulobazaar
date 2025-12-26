/**
 * Ads Query Builder
 * Centralized logic for building Prisma where clauses and orderBy for ads listings
 * Used by /ads, /search, and /all-ads pages
 */

export interface AdsFilterOptions {
  categoryIds?: number[];
  locationIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  condition?: 'new' | 'used';
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

  // Condition filter
  if (condition) {
    where.condition = condition;
  }

  return where;
}

export interface OrderByOptions {
  sortBy?: AdsSortBy;
  /**
   * Apply promotion priority sorting (Urgent > Sticky > newest)
   * Should only be true for:
   * - Subcategory pages (not parent categories)
   * - Shop pages
   * Should be false for:
   * - All ads page (/ads)
   * - Search page (/search)
   * - Parent category pages
   */
  applyPromotionPriority?: boolean;
}

/**
 * Build Prisma orderBy clause for ads queries
 * Uses reviewed_at (when editor approved) for chronological sorting,
 * not created_at (when user submitted)
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

  switch (sortBy) {
    case 'oldest':
      return { reviewed_at: 'asc' as const };
    case 'price_asc':
      return { price: 'asc' as const };
    case 'price_desc':
      return { price: 'desc' as const };
    case 'newest':
    default:
      // Only apply promotion priority on subcategory pages and shop pages
      if (applyPromotionPriority) {
        // Promoted ads appear first: Urgent > Sticky, then by approval time
        return [
          { is_urgent: 'desc' as const },
          { is_sticky: 'desc' as const },
          { reviewed_at: { sort: 'desc' as const, nulls: 'last' as const } },
        ];
      }
      // Default: just sort by approval time (no promotion priority), nulls last
      return { reviewed_at: { sort: 'desc' as const, nulls: 'last' as const } };
  }
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
    },
  },
} as const;
