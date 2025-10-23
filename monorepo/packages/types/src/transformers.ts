/**
 * TRANSFORMATION UTILITIES
 * Convert between database types (snake_case) and API types (camelCase)
 *
 * ⚠️ CRITICAL: Always use these transformers when converting DB data to API responses!
 */

import type { DbUser, DbAd, DbCategory, DbLocation } from './database';
import type { User, Ad, Category, Location } from './api';

// ============================================
// USER TRANSFORMERS
// ============================================

/**
 * Transform database user (snake_case) to API user (camelCase)
 *
 * @example
 * const dbUser = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
 * const apiUser = transformDbUserToApi(dbUser.rows[0]);
 * res.json({ success: true, data: apiUser });
 */
export function transformDbUserToApi(dbUser: DbUser): User {
  if (!dbUser) {
    throw new Error('transformDbUserToApi: dbUser is null or undefined');
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.full_name,
    phone: dbUser.phone || undefined,
    avatar: dbUser.avatar || undefined,
    role: dbUser.role,
    accountType: dbUser.account_type,
    businessVerificationStatus: dbUser.business_verification_status || undefined,
    individualVerified: dbUser.individual_verified || false,
    sellerSlug: dbUser.seller_slug || undefined,
    shopSlug: dbUser.shop_slug || undefined,
    isActive: dbUser.is_active,
    locationId: dbUser.location_id || undefined,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

/**
 * Transform API user data (camelCase) to database format (snake_case)
 * Use this when INSERT/UPDATE operations
 */
export function transformApiUserToDb(apiUser: Partial<User>): Partial<DbUser> {
  const dbUser: Partial<DbUser> = {};

  if (apiUser.email !== undefined) dbUser.email = apiUser.email;
  if (apiUser.fullName !== undefined) dbUser.full_name = apiUser.fullName;
  if (apiUser.phone !== undefined) dbUser.phone = apiUser.phone;
  if (apiUser.avatar !== undefined) dbUser.avatar = apiUser.avatar;
  if (apiUser.role !== undefined) dbUser.role = apiUser.role;
  if (apiUser.accountType !== undefined) dbUser.account_type = apiUser.accountType;
  if (apiUser.isActive !== undefined) dbUser.is_active = apiUser.isActive;
  if (apiUser.locationId !== undefined) dbUser.location_id = apiUser.locationId;

  return dbUser;
}

// ============================================
// AD TRANSFORMERS
// ============================================

/**
 * Transform database ad (snake_case) to API ad (camelCase)
 *
 * @example
 * const dbAd = await pool.query('SELECT * FROM ads WHERE id = $1', [1]);
 * const apiAd = transformDbAdToApi(dbAd.rows[0]);
 */
export function transformDbAdToApi(dbAd: DbAd, images: string[] = []): Ad {
  if (!dbAd) {
    throw new Error('transformDbAdToApi: dbAd is null or undefined');
  }

  return {
    id: dbAd.id,
    userId: dbAd.user_id || 0,
    title: dbAd.title,
    description: dbAd.description || '',
    price: Number(dbAd.price) || 0,
    categoryId: dbAd.category_id || 0,
    subcategoryId: dbAd.subcategory_id || undefined,
    locationId: dbAd.location_id || 0,
    areaId: dbAd.area_id || undefined,
    slug: dbAd.slug || '',
    status: dbAd.status,
    images: images,
    thumbnail: images[0] || undefined,
    latitude: dbAd.latitude ? Number(dbAd.latitude) : undefined,
    longitude: dbAd.longitude ? Number(dbAd.longitude) : undefined,
    viewCount: dbAd.view_count || 0,
    isNegotiable: dbAd.condition === 'negotiable',
    createdAt: dbAd.created_at,
    updatedAt: dbAd.updated_at,

    // Promotion fields
    isFeatured: dbAd.is_featured,
    isUrgent: dbAd.is_urgent,
    isSticky: dbAd.is_sticky,
    featuredUntil: dbAd.featured_until || undefined,
    urgentUntil: dbAd.urgent_until || undefined,
    stickyUntil: dbAd.sticky_until || undefined,
  };
}

/**
 * Transform API ad data to database format for INSERT/UPDATE
 */
export function transformApiAdToDb(apiAd: Partial<Ad>): Partial<DbAd> {
  const dbAd: Partial<DbAd> = {};

  if (apiAd.userId !== undefined) dbAd.user_id = apiAd.userId;
  if (apiAd.title !== undefined) dbAd.title = apiAd.title;
  if (apiAd.description !== undefined) dbAd.description = apiAd.description;
  if (apiAd.price !== undefined) dbAd.price = apiAd.price;
  if (apiAd.categoryId !== undefined) dbAd.category_id = apiAd.categoryId;
  if (apiAd.subcategoryId !== undefined) dbAd.subcategory_id = apiAd.subcategoryId;
  if (apiAd.locationId !== undefined) dbAd.location_id = apiAd.locationId;
  if (apiAd.areaId !== undefined) dbAd.area_id = apiAd.areaId;
  if (apiAd.slug !== undefined) dbAd.slug = apiAd.slug;
  if (apiAd.status !== undefined) dbAd.status = apiAd.status;
  if (apiAd.latitude !== undefined) dbAd.latitude = apiAd.latitude;
  if (apiAd.longitude !== undefined) dbAd.longitude = apiAd.longitude;

  return dbAd;
}

// ============================================
// CATEGORY TRANSFORMERS
// ============================================

export function transformDbCategoryToApi(dbCategory: DbCategory): Category {
  if (!dbCategory) {
    throw new Error('transformDbCategoryToApi: dbCategory is null or undefined');
  }

  return {
    id: dbCategory.id,
    name: dbCategory.name,
    slug: dbCategory.slug,
    icon: dbCategory.icon || undefined,
    parentId: dbCategory.parent_id || undefined,
    isActive: dbCategory.is_active,
    sortOrder: dbCategory.sort_order,
  };
}

// ============================================
// LOCATION TRANSFORMERS
// ============================================

export function transformDbLocationToApi(dbLocation: DbLocation): Location {
  if (!dbLocation) {
    throw new Error('transformDbLocationToApi: dbLocation is null or undefined');
  }

  return {
    id: dbLocation.id,
    name: dbLocation.name,
    slug: dbLocation.slug,
    type: dbLocation.type,
    parentId: dbLocation.parent_id || undefined,
    latitude: dbLocation.latitude ? Number(dbLocation.latitude) : undefined,
    longitude: dbLocation.longitude ? Number(dbLocation.longitude) : undefined,
    isActive: dbLocation.is_active,
  };
}

// ============================================
// BATCH TRANSFORMERS (for arrays)
// ============================================

export function transformDbUsersToApi(dbUsers: DbUser[]): User[] {
  if (!Array.isArray(dbUsers)) {
    console.error('🔴 transformDbUsersToApi: Expected array, got:', typeof dbUsers);
    return [];
  }
  return dbUsers.map(transformDbUserToApi);
}

export function transformDbAdsToApi(dbAds: DbAd[]): Ad[] {
  if (!Array.isArray(dbAds)) {
    console.error('🔴 transformDbAdsToApi: Expected array, got:', typeof dbAds);
    return [];
  }
  return dbAds.map(dbAd => transformDbAdToApi(dbAd));
}

export function transformDbCategoriesToApi(dbCategories: DbCategory[]): Category[] {
  if (!Array.isArray(dbCategories)) {
    console.error('🔴 transformDbCategoriesToApi: Expected array, got:', typeof dbCategories);
    return [];
  }
  return dbCategories.map(transformDbCategoryToApi);
}

export function transformDbLocationsToApi(dbLocations: DbLocation[]): Location[] {
  if (!Array.isArray(dbLocations)) {
    console.error('🔴 transformDbLocationsToApi: Expected array, got:', typeof dbLocations);
    return [];
  }
  return dbLocations.map(transformDbLocationToApi);
}

// ============================================
// HELPER: Safe property access with logging
// ============================================

/**
 * Safely access nested properties with logging
 * Use this instead of direct property access
 *
 * @example
 * // BAD:
 * const userId = req.user.sub; // May be undefined!
 *
 * // GOOD:
 * const userId = safeGet(req.user, 'id', 'req.user.id');
 */
export function safeGet<T>(
  obj: any,
  key: string,
  context: string = 'unknown'
): T | undefined {
  if (!obj) {
    console.error(`🔴 safeGet: Object is null/undefined for ${context}`);
    return undefined;
  }

  if (!(key in obj)) {
    console.error(`🔴 safeGet: Key "${key}" not found in ${context}`);
    console.error('🔍 Available keys:', Object.keys(obj));
    console.error('🔍 Full object:', obj);
    return undefined;
  }

  return obj[key] as T;
}
