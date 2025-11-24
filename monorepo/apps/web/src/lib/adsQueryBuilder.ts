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

  // Only show ads with at least one image (for public listings)
  if (status === 'approved') {
    where.ad_images = {
      some: {},
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

/**
 * Build Prisma orderBy clause for ads queries
 *
 * @param sortBy - Sort option
 * @returns Prisma orderBy clause
 */
export function buildAdsOrderBy(sortBy: AdsSortBy = 'newest') {
  switch (sortBy) {
    case 'oldest':
      return { created_at: 'asc' as const };
    case 'price_asc':
      return { price: 'asc' as const };
    case 'price_desc':
      return { price: 'desc' as const };
    case 'newest':
    default:
      return { created_at: 'desc' as const };
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
