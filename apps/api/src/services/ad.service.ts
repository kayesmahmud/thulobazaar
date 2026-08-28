/**
 * Ad Service
 * Handles ad CRUD operations and transformations
 */

import path from 'path';
import fs from 'fs';
import { prisma } from '@thulobazaar/database';
// Aliased: apps/api/src/lib/ai/policies.ts exports an unrelated getCategoryPolicy
// (the AI moderation markdown loader).
import { getCategoryPolicy as getCommercePolicy } from '@thulobazaar/types';
import config from '../config/index.js';
import { PAGINATION } from '../config/constants.js';
import { clearExpiredPromotionFlags } from '../jobs/promotionCleanup.js';

// ============================================================================
// Types
// ============================================================================

export interface AdFilters {
  search?: string;
  category?: string;
  subcategory?: string; // Added for precise subcategory filtering
  categoryIds?: number[]; // Added for hierarchical filtering
  location?: string;
  locationIds?: number[]; // Added for hierarchical filtering
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sortBy?: string;
  limit?: string;
  offset?: string;
  isFeatured?: string;
}

export interface CreateAdInput {
  title: string;
  description: string;
  price?: number;
  categoryId: number;
  subcategoryId?: number;
  locationId?: number;
  condition?: string;
  isNegotiable?: boolean;
  customFields?: Record<string, unknown>;
  expiresAt?: Date | null;
}

export interface UpdateAdInput {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  subcategoryId?: number;
  locationId?: number;
  condition?: string;
  customFields?: Record<string, unknown>;
  existingImages?: string[];
}

// ============================================================================
// Transformers
// ============================================================================

export function transformAdForList(ad: any) {
  const policed = applyCategoryPolicyToResponse(
    ad.custom_fields,
    ad.condition,
    ad.categories?.categories?.slug ?? ad.categories?.slug,
    ad.categories?.categories ? ad.categories.slug : undefined
  );

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    condition: policed.condition,
    status: ad.status === 'approved' ? 'active' : ad.status,
    slug: ad.slug,
    viewCount: ad.view_count,
    isFeatured: ad.is_featured,
    isUrgent: ad.is_urgent,
    isSticky: ad.is_sticky,
    featuredUntil: ad.featured_until,
    urgentUntil: ad.urgent_until,
    stickyUntil: ad.sticky_until,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    categoryId: ad.category_id,
    locationId: ad.location_id,
    categoryName: ad.categories?.name,
    categoryNameNe: ad.categories?.name_ne,
    categoryIcon: ad.categories?.icon,
    locationName: ad.locations?.name,
    locationNameNe: ad.locations?.name_ne,
    districtName: resolveDistrictName(ad.locations),
    accountType: ad.users_ads_user_idTousers?.account_type,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified,
    userName: ad.users_ads_user_idTousers?.full_name,
    userAvatar: ad.users_ads_user_idTousers?.avatar,
    latitude: ad.latitude ? Number(ad.latitude) : null,
    longitude: ad.longitude ? Number(ad.longitude) : null,
    publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
    // Mobile computes its display time as reviewedAt ?? createdAt, so public
    // responses serve the stable publish time here — not the last review stamp.
    reviewedAt: ad.published_at || ad.reviewed_at,
    primaryImage: ad.ad_images?.find((img: any) => img.is_primary)?.filename || ad.ad_images?.[0]?.filename,
    images: ad.ad_images?.map((img: any) => ({
      id: img.id,
      filename: img.filename,
      filePath: img.file_path,
      isPrimary: img.is_primary,
    })) || [],
  };
}

export function transformAdForDashboard(ad: any) {
  const policed = applyCategoryPolicyToResponse(
    ad.custom_fields,
    ad.condition,
    ad.categories?.categories?.slug ?? ad.categories?.slug,
    ad.categories?.categories ? ad.categories.slug : undefined
  );

  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    condition: policed.condition,
    status: ad.status === 'approved' ? 'active' : ad.status,
    // Owner-only surface (my-ads): seller-facing AI hold category. The raw
    // ai_reason text stays editor-only; clients map the code to a bilingual
    // message. Old app versions simply ignore these fields.
    aiHeld: ad.ai_verdict === 'held',
    aiReasonCode: ad.ai_verdict === 'held' ? (ad.ai_reason_code ?? null) : null,
    slug: ad.slug,
    views: ad.view_count,
    viewCount: ad.view_count,
    isFeatured: ad.is_featured,
    isUrgent: ad.is_urgent,
    isSticky: ad.is_sticky,
    featuredUntil: ad.featured_until,
    urgentUntil: ad.urgent_until,
    stickyUntil: ad.sticky_until,
    createdAt: ad.created_at,
    updatedAt: ad.updated_at,
    publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
    reviewedAt: ad.published_at || ad.reviewed_at,
    categoryId: ad.category_id,
    locationId: ad.location_id,
    categoryName: ad.categories?.name,
    categoryNameNe: ad.categories?.name_ne,
    categoryIcon: ad.categories?.icon,
    locationName: ad.locations?.name,
    locationNameNe: ad.locations?.name_ne,
    districtName: resolveDistrictName(ad.locations),
    primaryImage: ad.ad_images?.find((img: any) => img.is_primary)?.filename || ad.ad_images?.[0]?.filename,
    images: ad.ad_images?.map((img: any) => ({
      id: img.id,
      filename: img.filename,
      filePath: img.file_path,
      isPrimary: img.is_primary,
    })) || [],
    attributes: policed.attributes,
  };
}

/**
 * Strip the flags a category no longer offers before the ad leaves the server.
 *
 * Clients render these straight off the payload — the shipped app draws its COD
 * badge from `attributes.isCodAvailable` alone — so doing this here retires the
 * flag on every client at once, including builds already on people's phones.
 * The stored `custom_fields` are untouched; only the response is filtered.
 */
function applyCategoryPolicyToResponse(
  attributes: any,
  condition: string | null | undefined,
  parentSlug: string | undefined,
  subcategorySlug: string | undefined
): { attributes: any; condition: string | null } {
  const policy = getCommercePolicy(parentSlug ?? '', subcategorySlug);

  let cleaned = attributes;
  if (attributes && typeof attributes === 'object') {
    const { isCodAvailable, isNegotiable, ...rest } = attributes;
    cleaned = {
      ...rest,
      ...(policy.cod && isCodAvailable !== undefined ? { isCodAvailable } : {}),
      ...(policy.negotiable && isNegotiable !== undefined ? { isNegotiable } : {}),
    };
  }

  return {
    attributes: cleaned,
    condition: policy.condition === 'hidden' ? null : condition ?? null,
  };
}

export async function transformAdForDetail(ad: any) {
  const catName = ad.categories?.categories?.name ?? ad.categories?.name;
  const catNameNe = ad.categories?.categories?.name_ne ?? ad.categories?.name_ne;
  const subName = ad.categories?.categories ? ad.categories.name : undefined;
  const subNameNe = ad.categories?.categories ? ad.categories.name_ne : undefined;
  const parentSlug = ad.categories?.categories?.slug ?? ad.categories?.slug;
  const subSlug = ad.categories?.categories ? ad.categories.slug : undefined;
  const policed = applyCategoryPolicyToResponse(ad.custom_fields, ad.condition, parentSlug, subSlug);
  const locationLevels = await getLocationLevels(ad.location_id);
  const locName = locationLevels.map((l) => l.name).join(', ');

  // Get favorites count and location type
  const favoritesCount = await prisma.user_favorites.count({ where: { ad_id: ad.id } });
  const locationRecord = ad.location_id
    ? await prisma.locations.findUnique({ where: { id: ad.location_id }, select: { type: true } })
    : null;

  // 🔒 DB-3: never leak internal moderation columns on the public detail response.
  const {
    status_reason: _statusReason,
    reviewed_by: _reviewedBy,
    deleted_by: _deletedBy,
    deletion_reason: _deletionReason,
    ad_edit_history: _editHistory,
    ai_verdict: _aiVerdict,
    ai_reason: _aiReason,
    ai_checked_at: _aiCheckedAt,
    ...safeAd
  } = ad;

  // Owner-edit history (Facebook-style "Edited" indicator)
  const editTimes: number[] = (ad.ad_edit_history || [])
    .map((e: any) => (e.created_at ? new Date(e.created_at).getTime() : 0))
    .filter((t: number) => t > 0);
  const lastEditedAt = editTimes.length ? new Date(Math.max(...editTimes)) : null;

  return {
    ...safeAd,
    status: ad.status === 'approved' ? 'active' : ad.status,
    latitude: ad.latitude ? Number(ad.latitude) : null,
    longitude: ad.longitude ? Number(ad.longitude) : null,
    // snake_case (web compatibility)
    category_name: catName,
    category_name_ne: catNameNe,
    subcategory_name: subName,
    subcategory_name_ne: subNameNe,
    location_name: locName,
    // camelCase (mobile compatibility)
    categoryName: catName,
    categoryNameNe: catNameNe,
    subcategoryName: subName,
    subcategoryNameNe: subNameNe,
    // Parent/leaf ids so clients can link to category listings.
    // DB category_id stores the LEAF; here categoryId = parent, subcategoryId = leaf.
    categoryId: ad.categories?.categories?.id ?? ad.categories?.id ?? ad.category_id,
    subcategoryId: ad.categories?.categories ? ad.categories.id : null,
    // Location chain leaf → root so clients can browse ads per province/district/area
    locationLevels,
    // Same district rule as the list transformers, resolved from the chain the
    // detail query already fetched — so a card built from a detail response
    // shows the same place name as one built from the feed.
    districtName:
      locationLevels.find((l) => l.type === 'district')?.name ?? locationLevels[0]?.name ?? null,
    locationName: locName,
    publishedAt: ad.published_at || ad.reviewed_at || ad.created_at,
    reviewedAt: ad.published_at || ad.reviewed_at,
    editCount: editTimes.length,
    edit_count: editTimes.length,
    lastEditedAt,
    last_edited_at: lastEditedAt,
    userName: ad.users_ads_user_idTousers?.full_name,
    userAvatar: ad.users_ads_user_idTousers?.avatar,
    userPhone: ad.users_ads_user_idTousers?.phone,
    googleMapsLink: ad.users_ads_user_idTousers?.google_maps_link,
    userVerified: ['approved', 'verified'].includes(ad.users_ads_user_idTousers?.business_verification_status) || ad.users_ads_user_idTousers?.individual_verified,
    businessVerificationStatus: ad.users_ads_user_idTousers?.business_verification_status,
    individualVerified: ad.users_ads_user_idTousers?.individual_verified,
    shopSlug: ad.users_ads_user_idTousers?.shop_slug,
    accountType: ad.users_ads_user_idTousers?.account_type,
    seller: ad.users_ads_user_idTousers,
    images: ad.ad_images,
    // Both filtered by the category policy — see applyCategoryPolicyToResponse.
    // These must stay after the ...safeAd spread, which carries the raw column.
    condition: policed.condition,
    attributes: policed.attributes,
    favoritesCount: favoritesCount,
    favorites_count: favoritesCount,
    locationType: locationRecord?.type || null,
    location_type: locationRecord?.type || null,
  };
}

/** Location chain leaf → root (Area, District, Province) with ids so clients can link each level. */
/**
 * Tiers precise enough to be an ad's location. Mirrors the web picker's
 * `minSelectableType` and the mobile app, which has always required a
 * municipality — anything coarser leaves the ad's district unresolvable, so the
 * ad card has no place name to show.
 */
const AD_LOCATION_TIERS = ['municipality', 'area'];

// Bilingual on purpose: released app builds show this server string verbatim
// in a snackbar, with no client-side localization layer in between.
export const AD_LOCATION_TIER_MESSAGE =
  'Please choose a municipality or area — province and district are too broad for an ad. कृपया नगरपालिका वा क्षेत्र छान्नुहोस् — प्रदेश र जिल्ला मात्र पर्याप्त छैन।';

export const AD_LOCATION_AREA_MESSAGE =
  'Please choose an area within this municipality — the municipality alone is too broad. कृपया यस नगरपालिकाभित्रको क्षेत्र (जस्तै ठमेल, नक्साल) छान्नुहोस्।';

/**
 * Validates an ad's location. Returns null when it passes, otherwise the
 * message to show the seller.
 */
export async function validateAdLocation(locationId: number): Promise<string | null> {
  const location = await prisma.locations.findUnique({
    where: { id: locationId },
    select: { type: true },
  });

  if (!location || !AD_LOCATION_TIERS.includes(location.type)) {
    return AD_LOCATION_TIER_MESSAGE;
  }

  // A municipality that is subdivided into areas isn't precise enough on its
  // own. Only Kathmandu Metropolitan City is subdivided today (104 areas —
  // Thamel, Naxal, …), so this asks for an area exactly where one exists and
  // leaves every other municipality as a valid stopping point.
  if (location.type === 'municipality') {
    const areaCount = await prisma.locations.count({
      where: { parent_id: locationId, type: 'area' },
    });
    if (areaCount > 0) return AD_LOCATION_AREA_MESSAGE;
  }

  return null;
}

export async function getLocationLevels(locationId?: number): Promise<Array<{
  id: number;
  name: string;
  name_ne: string | null;
  type: string | null;
  slug: string | null;
}>> {
  if (!locationId) return [];

  try {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      include: {
        locations: {
          include: {
            locations: {
              include: {
                locations: true,
              },
            },
          },
        },
      },
    });

    if (!location) return [];

    const levels = [];
    let current: any = location;
    while (current) {
      levels.push({
        id: current.id,
        name: current.name,
        name_ne: current.name_ne ?? null,
        type: current.type ?? null,
        slug: current.slug ?? null,
      });
      current = current.locations;
    }
    return levels;
  } catch (error) {
    console.error('Error fetching location levels:', error);
    return [];
  }
}

export async function getLocationHierarchy(locationId?: number): Promise<string> {
  if (!locationId) return '';

  try {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      include: {
        locations: {
          include: {
            locations: {
              include: {
                locations: true
              }
            }
          }
        }
      }
    });

    if (!location) return '';

    const parts = [location.name];
    let current = location.locations;

    // Traverse up to 3 parent levels (Area -> City -> District -> Province)
    while (current) {
      parts.push(current.name);
      current = current.locations;
    }

    return parts.join(', ');
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
    return '';
  }
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Recursively get all descendant location IDs (e.g. Province -> Districts -> Municipalities -> Areas)
 */
async function getLocationDescendantIds(locationId: number): Promise<number[]> {
  const location = await prisma.locations.findUnique({
    where: { id: locationId },
    select: { type: true },
  });

  if (!location) return [locationId];

  // If it's an area, just return the ID
  if (location.type === 'area') {
    return [locationId];
  }

  // Determine which children to fetch based on type
  let childIds: number[] = [];

  if (location.type === 'province') {
    // Province -> Districts
    const districts = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'district' },
      select: { id: true },
    });
    const districtIds = districts.map(d => d.id);
    childIds.push(...districtIds);

    // Districts -> Municipalities
    if (districtIds.length > 0) {
      const municipalities = await prisma.locations.findMany({
        where: { parent_id: { in: districtIds }, type: 'municipality' },
        select: { id: true },
      });
      const municipalityIds = municipalities.map(m => m.id);
      childIds.push(...municipalityIds);

      // Municipalities -> Areas
      if (municipalityIds.length > 0) {
        const areas = await prisma.locations.findMany({
          where: { parent_id: { in: municipalityIds }, type: 'area' },
          select: { id: true },
        });
        childIds.push(...areas.map(a => a.id));
      }
    }
  } else if (location.type === 'district') {
    // District -> Municipalities
    const municipalities = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'municipality' },
      select: { id: true },
    });
    const municipalityIds = municipalities.map(m => m.id);
    childIds.push(...municipalityIds);

    // Municipalities -> Areas
    if (municipalityIds.length > 0) {
      const areas = await prisma.locations.findMany({
        where: { parent_id: { in: municipalityIds }, type: 'area' },
        select: { id: true },
      });
      childIds.push(...areas.map(a => a.id));
    }
  } else if (location.type === 'municipality') {
    // Municipality -> Areas
    const areas = await prisma.locations.findMany({
      where: { parent_id: locationId, type: 'area' },
      select: { id: true },
    });
    childIds.push(...areas.map(a => a.id));
  }

  // Return the original ID plus all descendant IDs
  return [locationId, ...childIds];
}

/**
 * Get all descendant category IDs (e.g. Parent Category -> Subcategories)
 */
async function getCategoryDescendantIds(categoryId: number): Promise<number[]> {
  // Find all subcategories where parent_id matches
  const subcategories = await prisma.categories.findMany({
    where: { parent_id: categoryId },
    select: { id: true },
  });

  const subcategoryIds = subcategories.map(c => c.id);

  // Return original ID + subcategory IDs
  return [categoryId, ...subcategoryIds];
}

function buildAdWhereClause(filters: AdFilters) {
  const where: any = { status: 'approved' };

  if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
    where.OR = [
      { title: { contains: filters.search.trim(), mode: 'insensitive' } },
      { description: { contains: filters.search.trim(), mode: 'insensitive' } },
    ];
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    where.category_id = { in: filters.categoryIds };
  } else if (filters.category && filters.category !== 'all' && !isNaN(Number(filters.category))) {
    where.category_id = parseInt(filters.category);
  }

  if (filters.locationIds && filters.locationIds.length > 0) {
    where.location_id = { in: filters.locationIds };
  } else if (filters.location && filters.location !== 'all' && !isNaN(Number(filters.location))) {
    // Fallback if locationIds not provided but location string is
    where.location_id = parseInt(filters.location);
  }

  if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
    where.price = { ...(where.price || {}), gte: parseFloat(filters.minPrice) };
  }

  if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
    where.price = { ...(where.price || {}), lte: parseFloat(filters.maxPrice) };
  }

  if (filters.condition && filters.condition !== 'all') {
    // Normalize: accept 'new'/'used' (Flutter) or 'Brand New'/'Used' (web)
    const c = filters.condition.toLowerCase();
    if (c === 'new' || c === 'brand new') {
      where.condition = 'Brand New';
    } else if (c === 'used') {
      where.condition = 'Used';
    } else {
      where.condition = filters.condition;
    }
  }

  if (filters.isFeatured === 'true') {
    where.is_featured = true;
    where.featured_until = { gt: new Date() };
  }

  return where;
}

function buildAdOrderBy(sortBy: string = 'newest', pinPromotions: boolean = false) {
  let base: any;
  // Jobs salaries are optional, so price is nullable now — without nulls:last
  // a blank salary wins every ascending price sort.
  if (sortBy === 'price-low') base = { price: { sort: 'asc', nulls: 'last' } };
  else if (sortBy === 'price-high') base = { price: { sort: 'desc', nulls: 'last' } };
  else if (sortBy === 'oldest') base = { published_at: { sort: 'asc', nulls: 'last' } };
  else base = { published_at: { sort: 'desc', nulls: 'last' } };

  // On filtered browse/search listings, pin paid promotions to the top —
  // urgent above sticky — then apply the chosen sort within each group.
  // Featured is homepage-only, so it is intentionally not pinned here.
  if (pinPromotions) {
    return [{ is_urgent: 'desc' }, { is_sticky: 'desc' }, base];
  }
  return base;
}

// ============================================================================
// Condition Normalization
// ============================================================================

/**
 * Normalize condition to "Brand New" or "Used" — or null when the ad has no
 * condition at all. Condition only applies to some categories/subcategories
 * (e.g. for-sale property, electronics, vehicles); for everything else (rentals,
 * services, jobs, ...) it must stay null so no condition is stored or displayed.
 */
function normalizeCondition(condition?: string | null): string | null {
  if (!condition || !condition.trim()) return null;
  const lower = condition.toLowerCase();
  if (lower === 'brand new' || lower === 'new') return 'Brand New';
  return 'Used'; // Any other non-empty value normalizes to Used
}

// ============================================================================
// Slug Generation
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function generateAdSlug(title: string, locationId?: number): Promise<string> {
  const titleSlug = slugify(title);

  let locationSlug = '';
  if (locationId) {
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { name: true },
    });
    if (location?.name) {
      locationSlug = slugify(location.name);
    }
  }

  const baseSlug = locationSlug
    ? `${titleSlug}-for-sale-in-${locationSlug}`
    : `${titleSlug}-for-sale`;

  // Find existing slugs with this base pattern
  const existingSlugs = await prisma.ads.findMany({
    where: { slug: { startsWith: `${baseSlug}-` } },
    select: { slug: true },
  });

  // Find highest counter
  let maxCounter = 0;
  const counterRegex = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`);

  for (const ad of existingSlugs) {
    if (!ad.slug) continue;
    const match = ad.slug.match(counterRegex);
    if (match?.[1]) {
      const counter = parseInt(match[1], 10);
      if (counter > maxCounter) {
        maxCounter = counter;
      }
    }
  }

  return `${baseSlug}-${maxCounter + 1}`;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Location plus two ancestors — enough to reach the district from the deepest
 * tier we store (area → municipality → district).
 */
const adCardLocationSelect = {
  name: true,
  name_ne: true,
  type: true,
  locations: {
    select: {
      name: true,
      name_ne: true,
      type: true,
      locations: { select: { name: true, name_ne: true, type: true } },
    },
  },
};

/**
 * The place name an ad card shows. Always the district — municipality names
 * average 26 characters against a district's 8, and truncate in a half-width
 * card. Falls back to the ad's own location when nothing above it is a district
 * (the legacy province-level ads). Mirrors the web's resolveDistrictName.
 */
export function resolveDistrictName(location: any): string | null {
  let current = location;
  while (current) {
    if (current.type === 'district') return current.name;
    current = current.locations;
  }
  return location?.name ?? null;
}

const adListSelect = {
  include: {
    // slug + parent slug drive the category policy that filters condition/COD
    // off the card response (see applyCategoryPolicyToResponse).
    categories: {
      select: {
        name: true,
        name_ne: true,
        icon: true,
        slug: true,
        categories: { select: { slug: true } },
      },
    },
    locations: { select: adCardLocationSelect },
    users_ads_user_idTousers: {
      select: {
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        full_name: true,
        avatar: true,
      },
    },
    ad_images: {
      orderBy: [{ is_primary: 'desc' as const }, { created_at: 'asc' as const }],
    },
  },
};

const adDetailSelect = {
  include: {
    categories: {
      include: {
        categories: true, // parent category via self-relation
      },
    },
    locations: true,
    users_ads_user_idTousers: {
      select: {
        id: true,
        full_name: true,
        phone: true,
        avatar: true,
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        shop_slug: true,
      },
    },
    ad_images: {
      orderBy: [{ is_primary: 'desc' as const }, { created_at: 'asc' as const }],
    },
    ad_edit_history: {
      select: { created_at: true },
    },
  },
};

export async function getAds(filters: AdFilters) {
  // Pre-process location filter to get all descendant IDs
  if (filters.location && filters.location !== 'all' && !isNaN(Number(filters.location))) {
    const locId = parseInt(filters.location);
    const allLocationIds = await getLocationDescendantIds(locId);
    filters.locationIds = allLocationIds;
  }

  // Pre-process category filter
  // 1. If Subcategory is provided, it takes precedence (more specific)
  if (filters.subcategory && filters.subcategory !== 'all' && !isNaN(Number(filters.subcategory))) {
    const subId = parseInt(filters.subcategory);
    const allSubIds = await getCategoryDescendantIds(subId);
    filters.categoryIds = allSubIds;
  }
  // 2. Else if Category is provided
  else if (filters.category && filters.category !== 'all' && !isNaN(Number(filters.category))) {
    const catId = parseInt(filters.category);
    const allCategoryIds = await getCategoryDescendantIds(catId);
    filters.categoryIds = allCategoryIds;
  }

  const where = buildAdWhereClause(filters);

  // Pin promotions only on filtered browse/search listings (category, location,
  // or search) — never the home "Latest" feed or the featured carousel, which
  // both call this with no filters / isFeatured.
  const pinPromotions =
    (!!filters.categoryIds?.length || !!filters.locationIds?.length || !!filters.search) &&
    filters.isFeatured !== 'true';

  // Clear expired promo flags first so an expired ad can't stay pinned during
  // the gap before the 5-minute cron runs. Only on the paths that actually pin.
  if (pinPromotions) {
    await clearExpiredPromotionFlags();
  }

  const orderBy = buildAdOrderBy(filters.sortBy, pinPromotions);

  const limitNum = Math.min(
    parseInt(filters.limit || String(PAGINATION.DEFAULT_LIMIT)) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const offsetNum = parseInt(filters.offset || '0') || 0;

  const [ads, total] = await Promise.all([
    prisma.ads.findMany({
      where,
      ...adListSelect,
      orderBy,
      take: limitNum,
      skip: offsetNum,
    }),
    prisma.ads.count({ where }),
  ]);

  return {
    ads: ads.map(transformAdForList),
    pagination: {
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    },
  };
}

export async function getUserAds(userId: number) {
  const ads = await prisma.ads.findMany({
    where: { user_id: userId },
    include: {
      categories: {
        select: {
          name: true,
          name_ne: true,
          icon: true,
          slug: true,
          categories: { select: { slug: true } },
        },
      },
      locations: { select: adCardLocationSelect },
      ad_images: {
        orderBy: [{ is_primary: 'desc' }, { created_at: 'asc' }],
      },
    },
    orderBy: { created_at: 'desc' },
    take: 200, // 🔒 DB-L6: bound the result set (own-ads can accumulate over time)
  });

  return ads.map(transformAdForDashboard);
}

// 🔒 DB-3: a non-approved or soft-deleted ad may only be viewed by its owner.
// Everyone else (incl. anonymous) gets null → 404, preventing enumeration of
// pending/rejected/deleted ads via sequential IDs or guessed slugs.
function isAdViewable(ad: { status: string | null; deleted_at: Date | null; user_id: number }, viewerUserId?: number): boolean {
  if (viewerUserId && ad.user_id === viewerUserId) return true;
  return ad.status === 'approved' && ad.deleted_at == null;
}

export async function getAdBySlug(slug: string, viewerUserId?: number) {
  const ad = await prisma.ads.findFirst({
    where: { slug },
    ...adDetailSelect,
  });

  if (!ad || !isAdViewable(ad, viewerUserId)) return null;
  return await transformAdForDetail(ad);
}

export async function getAdById(id: number, viewerUserId?: number) {
  const ad = await prisma.ads.findUnique({
    where: { id },
    ...adDetailSelect,
  });

  if (!ad || !isAdViewable(ad, viewerUserId)) return null;
  return await transformAdForDetail(ad);
}

export async function incrementAdViews(adId: number) {
  await prisma.ads.update({
    where: { id: adId },
    data: { view_count: { increment: 1 } },
  });
}

/**
 * Direct-publish policy: currently business-verified users (not expired, not revoked)
 * can publish new ads and edits without editor review. Single source of truth —
 * clients only display what this decides.
 */
export function computeCanDirectPublish(user: {
  business_verification_status: string | null;
  business_verification_expires_at: Date | null;
  direct_edit_revoked: boolean | null;
} | null): boolean {
  if (!user) return false;
  const businessActive =
    ['approved', 'verified'].includes(user.business_verification_status || '') &&
    (!user.business_verification_expires_at || user.business_verification_expires_at > new Date());
  return businessActive && user.direct_edit_revoked !== true;
}

export async function getDirectPublishInfo(userId: number) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      business_verification_status: true,
      business_verification_expires_at: true,
      direct_edit_revoked: true,
    },
  });

  return { canDirectPublish: computeCanDirectPublish(user) };
}

// Bilingual like the location-validation messages: old app versions show
// these server strings verbatim, so both languages ride in one string.
export const AD_DUPLICATE_PENDING_MESSAGE =
  'You already posted this ad — it is waiting for review and will go live once approved. Posting it again will not speed it up. तपाईंले यो विज्ञापन पहिले नै पोस्ट गर्नुभएको छ — यो समीक्षामा छ र स्वीकृत भएपछि लाइभ हुनेछ। फेरि पोस्ट गर्दा छिटो हुँदैन।';
export const AD_DUPLICATE_LIVE_MESSAGE =
  'You already have a live ad with this title. Edit the existing ad instead of posting it again. यो शीर्षकको विज्ञापन पहिले नै लाइभ छ। फेरि पोस्ट गर्नुको सट्टा भइरहेको विज्ञापन सम्पादन गर्नुहोस्।';

/**
 * The impatient-repost guard: the same seller re-posting the same title while
 * the first copy is pending (didn't read "our team will review") or already
 * live. Case-insensitive exact title match — near-duplicates with reworded
 * titles are the AI moderation's job (the 'duplicate' reason code).
 */
export async function findDuplicateAdForUser(userId: number, title: string) {
  return prisma.ads.findFirst({
    where: {
      user_id: userId,
      deleted_at: null,
      status: { in: ['pending', 'approved'] },
      title: { equals: title.trim(), mode: 'insensitive' },
    },
    select: { id: true, status: true },
  });
}

/** Live-ad edits are limited per calendar month to prevent bait-and-switch churn (owner policy: 3). */
export const MAX_LIVE_EDITS_PER_MONTH = 3;

/** How many times this ad was edited WHILE LIVE during the current calendar month. */
export async function countLiveEditsThisMonth(adId: number): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return prisma.ad_edit_history.count({
    where: {
      ad_id: adId,
      created_at: { gte: monthStart },
      // Only edits made to a live ad count — pending/rejected fix-ups are part
      // of the review loop and must not eat the seller's quota.
      previous_data: { path: ['status'], equals: 'approved' },
    },
  });
}

/** Owner-facing edit history (same snapshots the editor panel sees). */
export async function getAdEditHistoryForOwner(adId: number) {
  return prisma.ad_edit_history.findMany({
    where: { ad_id: adId },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      resulting_status: true,
      previous_data: true,
      created_at: true,
    },
  });
}

/** Snapshot the ad BEFORE an owner edit (Facebook-style version history). */
export async function recordAdEditSnapshot(existingAd: any, editedBy: number, resultingStatus: string) {
  await prisma.ad_edit_history.create({
    data: {
      ad_id: existingAd.id,
      edited_by: editedBy,
      resulting_status: resultingStatus,
      previous_data: {
        title: existingAd.title,
        description: existingAd.description,
        price: existingAd.price != null ? Number(existingAd.price) : null,
        category_id: existingAd.category_id,
        location_id: existingAd.location_id,
        condition: existingAd.condition,
        custom_fields: existingAd.custom_fields,
        images: (existingAd.ad_images || []).map((img: any) => img.file_path),
        status: existingAd.status,
      },
    },
  });
}

export async function createAd(userId: number, input: CreateAdInput, options?: { directPublish?: boolean }) {
  const finalCategoryId = input.subcategoryId || input.categoryId;
  const slug = await generateAdSlug(input.title, input.locationId);

  const ad = await prisma.ads.create({
    data: {
      title: input.title,
      description: input.description,
      price: input.price ?? null,
      category_id: finalCategoryId,
      location_id: input.locationId || null,
      condition: normalizeCondition(input.condition),
      user_id: userId,
      status: options?.directPublish ? 'approved' : 'pending',
      // Public listings sort by published_at; direct-published ads have no
      // editor review, so stamp publish time or they sink to the bottom of
      // home/browse/shop feeds (NULLS LAST).
      reviewed_at: options?.directPublish ? new Date() : null,
      published_at: options?.directPublish ? new Date() : null,
      // Verified businesses are never AI-screened — record why the verdict is absent
      ai_verdict: options?.directPublish ? 'skipped' : null,
      // Explicit ms-precision timestamp (not the DB's microsecond now()) so AI
      // moderation can use equality on it as a content-unchanged guard.
      updated_at: new Date(),
      slug,
      custom_fields: input.customFields && Object.keys(input.customFields).length > 0
        ? input.customFields
        : null,
      expires_at: input.expiresAt ?? null,
    },
    include: {
      categories: true,
      locations: true,
    },
  });

  console.log(`✅ Ad created: ${ad.title} (ID: ${ad.id}) by user ${userId} - Status: ${ad.status}`);
  return ad;
}

/**
 * A user's first ad seeds their shop page's Location + Categories tabs
 * (users.location_id / default_category_id / default_subcategory_id) —
 * only-if-empty, never overwrites, same rule the web client applies.
 * Later post-ad forms prefill from these; editing the shop page changes them.
 */
export async function seedShopDefaultsFromAd(
  userId: number,
  ad: { category_id: number | null; location_id: number | null }
) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { location_id: true, default_category_id: true },
  });
  if (!user) return;

  const data: Record<string, unknown> = {};
  if (!user.location_id && ad.location_id) data.location_id = ad.location_id;
  if (!user.default_category_id && ad.category_id) {
    // ads store the leaf category; the shop Categories tab stores (main, sub)
    const cat = await prisma.categories.findUnique({
      where: { id: ad.category_id },
      select: { id: true, parent_id: true },
    });
    if (cat) {
      data.default_category_id = cat.parent_id ?? cat.id;
      data.default_subcategory_id = cat.parent_id ? cat.id : null;
    }
  }
  if (Object.keys(data).length > 0) {
    await prisma.users.update({
      where: { id: userId },
      data: { ...data, updated_at: new Date() },
    });
    console.log(`🏪 Seeded shop defaults for user ${userId}:`, Object.keys(data).join(', '));
  }
}

/** Staged uploads older than this are abandoned forms — swept opportunistically. */
const STAGING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const STAGED_MIME_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/**
 * Consume background-staged images for a new ad: validate ownership (a staged
 * id is just a filename inside THIS user's staging dir — basename() kills
 * traversal), move the already-AVIF-converted files into uploads/ads, and
 * create the ad_images rows. Returns the moved absolute paths (fed to AI
 * moderation). Unknown/expired ids are skipped, not fatal — the client falls
 * back to classic upload whenever staging looks incomplete.
 */
export async function consumeStagedImages(
  adId: number,
  userId: number,
  stagedIds: string[],
  limit: number
): Promise<string[]> {
  const uploadsDir = path.resolve(config.UPLOAD_DIR);
  const userStagingDir = path.join(uploadsDir, 'staging', String(userId));
  const adsDir = path.join(uploadsDir, 'ads');
  const movedPaths: string[] = [];
  const records: Array<Record<string, unknown>> = [];

  for (const rawId of stagedIds.slice(0, limit)) {
    const filename = path.basename(String(rawId));
    if (!filename.startsWith('ad-')) continue;
    const from = path.join(userStagingDir, filename);
    const to = path.join(adsDir, filename);
    try {
      const stat = await fs.promises.stat(from);
      await fs.promises.rename(from, to);
      movedPaths.push(to);
      records.push({
        ad_id: adId,
        filename,
        original_name: filename,
        file_path: `/uploads/ads/${filename}`,
        file_size: stat.size,
        mime_type: STAGED_MIME_BY_EXT[path.extname(filename).toLowerCase()] ?? 'image/avif',
        is_primary: records.length === 0,
      });
    } catch {
      // Missing/expired staged file — skip it
    }
  }

  if (records.length > 0) {
    await prisma.ad_images.createMany({ data: records as any });
  }
  console.log(`✅ Attached ${records.length}/${stagedIds.length} staged images to ad ${adId}`);
  return movedPaths;
}

/** Opportunistic cleanup: drop this user's staged files older than 24h. */
export async function sweepStagedImages(userId: number): Promise<void> {
  const userStagingDir = path.join(path.resolve(config.UPLOAD_DIR), 'staging', String(userId));
  let entries: string[];
  try {
    entries = await fs.promises.readdir(userStagingDir);
  } catch {
    return; // no staging dir yet
  }
  const cutoff = Date.now() - STAGING_MAX_AGE_MS;
  for (const name of entries) {
    const filePath = path.join(userStagingDir, name);
    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.mtimeMs < cutoff) await fs.promises.unlink(filePath);
    } catch {
      // already gone — fine
    }
  }
}

export async function createAdImages(adId: number, files: Express.Multer.File[]) {
  const imageRecords = files.map((file, index) => ({
    ad_id: adId,
    filename: file.filename,
    original_name: file.originalname,
    file_path: `/uploads/ads/${file.filename}`,
    file_size: file.size,
    mime_type: file.mimetype,
    is_primary: index === 0,
  }));

  await prisma.ad_images.createMany({ data: imageRecords });
  console.log(`✅ Uploaded ${files.length} images for ad ${adId}`);
}

export async function getAdForEdit(adId: number, userId: number) {
  return prisma.ads.findFirst({
    where: { id: adId, user_id: userId },
    include: { ad_images: true },
  });
}

export async function updateAd(
  adId: number,
  existingAd: any,
  input: UpdateAdInput,
  options?: { directPublish?: boolean }
) {
  const finalCategoryId = input.subcategoryId
    ? input.subcategoryId
    : input.categoryId
      ? input.categoryId
      : existingAd.category_id;

  // Reset status to pending if previously rejected
  let newStatus = existingAd.status;
  if (existingAd.status === 'rejected') {
    newStatus = 'pending';
    console.log(`📝 Rejected ad ${adId} resubmitted - status changed to pending`);
  }

  // Editing a live ad: trusted business users stay live, everyone else goes back to review
  if (existingAd.status === 'approved' && !options?.directPublish) {
    newStatus = 'pending';
    console.log(`📝 Approved ad ${adId} edited by owner - status changed to pending for re-review`);
  }

  const ad = await prisma.ads.update({
    where: { id: adId },
    data: {
      title: input.title || existingAd.title,
      description: input.description || existingAd.description,
      price: input.price !== undefined ? input.price : existingAd.price,
      category_id: finalCategoryId,
      location_id: input.locationId || existingAd.location_id,
      // Sent-but-empty means "clear it" — categories where the policy hides
      // Condition strip the field on edit, and `||` would restore the stale
      // value instead. Absent (undefined) still means "leave alone".
      condition: input.condition !== undefined
        ? normalizeCondition(input.condition) ?? null
        : existingAd.condition,
      custom_fields: input.customFields !== undefined
        ? input.customFields
        : existingAd.custom_fields,
      status: newStatus,
      status_reason: newStatus === 'pending' ? null : existingAd.status_reason,
      // The content changed, so any prior AI verdict is about an ad that no
      // longer exists — clear it (keep ai_checked_at: it's the budget counter).
      ai_verdict: options?.directPublish ? 'skipped' : null,
      ai_reason: null,
      ai_reason_code: null,
      updated_at: new Date(),
    },
  });

  console.log(`✅ Ad updated: ${ad.title} (ID: ${ad.id}) - Status: ${newStatus}`);
  return { ad, newStatus };
}

/**
 * Returns the ad's updated_at AFTER the image changes. Changing photos IS a
 * content change, so it must bump the TOCTOU stamp the AI publish/unpublish
 * guards compare against — otherwise a concurrent edit's unreviewed images
 * could ride an older check's verdict.
 */
export async function updateAdImages(
  adId: number,
  existingImages: any[],
  imagesToKeep: string[],
  newFiles: Express.Multer.File[]
): Promise<Date | null> {
  const normalizePath = (p: string) => p.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '');
  const normalizedKeepPaths = imagesToKeep.map(normalizePath);

  // Find images to delete
  const imagesToDelete = existingImages.filter((img) => {
    const normalizedPath = normalizePath(img.file_path || '');
    return !normalizedKeepPaths.includes(normalizedPath);
  });

  // Delete removed images
  if (imagesToDelete.length > 0) {
    await prisma.ad_images.deleteMany({
      where: { id: { in: imagesToDelete.map((img) => img.id) } },
    });
    console.log(`🗑️ Deleted ${imagesToDelete.length} images for ad ${adId}`);
  }

  // Add new images
  if (newFiles.length > 0) {
    const remainingImages = existingImages.length - imagesToDelete.length;
    const shouldSetPrimary = remainingImages === 0;

    const imageRecords = newFiles.map((file, index) => ({
      ad_id: adId,
      filename: file.filename,
      original_name: file.originalname,
      file_path: `/uploads/ads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      is_primary: shouldSetPrimary && index === 0,
    }));

    await prisma.ad_images.createMany({ data: imageRecords });
    console.log(`✅ Added ${newFiles.length} new images for ad ${adId}`);
  }

  if (imagesToDelete.length > 0 || newFiles.length > 0) {
    const stamped = await prisma.ads.update({
      where: { id: adId },
      data: { updated_at: new Date() },
      select: { updated_at: true },
    });
    return stamped.updated_at;
  }
  return null;
}

export async function deleteAd(adId: number, userId: number) {
  const existingAd = await prisma.ads.findFirst({
    where: { id: adId, user_id: userId },
  });

  if (!existingAd) return null;

  // Delete images first
  await prisma.ad_images.deleteMany({ where: { ad_id: adId } });

  // Delete the ad
  await prisma.ads.delete({ where: { id: adId } });

  console.log(`✅ Ad deleted: ${existingAd.title} (ID: ${adId})`);
  return existingAd;
}
