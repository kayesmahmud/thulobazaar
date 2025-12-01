/**
 * Server-only URL parsing utilities
 * These functions use Prisma and must only be used in Server Components or API routes
 *
 * For client-safe URL utilities (buildAdUrl, generateAdListingMetadata),
 * import from '@/lib/urlBuilder' instead
 */

import { prisma } from '@thulobazaar/database';

/**
 * Parsed URL result containing location and category information
 */
export interface ParsedAdUrlParams {
  locationId: number | null;
  locationSlug: string | null;
  locationName: string | null;
  locationType: string | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  isParentCategory: boolean;
}

/**
 * Parse URL params array and resolve slugs to database IDs
 *
 * Handles patterns:
 * - [] or ['nepal'] → No filters
 * - ['kathmandu'] → Could be location OR category (check locations first)
 * - ['kathmandu', 'mobiles'] → location + category
 * - ['thamel', 'mobile-phones'] → location + subcategory
 *
 * @param params - URL params array from Next.js dynamic route
 * @returns Parsed location and category information
 */
export async function parseAdUrlParams(params: string[] | undefined): Promise<ParsedAdUrlParams> {
  const result: ParsedAdUrlParams = {
    locationId: null,
    locationSlug: null,
    locationName: null,
    locationType: null,
    categoryId: null,
    categorySlug: null,
    categoryName: null,
    isParentCategory: false,
  };

  // No params or 'nepal' → show all ads
  if (!params || params.length === 0 || (params.length === 1 && params[0] === 'nepal')) {
    return result;
  }

  const [firstParam, secondParam] = params;

  if (params.length === 1) {
    // Single param: Could be location OR category
    // Check locations first (more specific), then categories
    const [location, category] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: firstParam },
        select: { id: true, name: true, slug: true, type: true },
      }),
      prisma.categories.findFirst({
        where: { slug: firstParam },
        select: {
          id: true,
          name: true,
          slug: true,
          parent_id: true,
          other_categories: {
            select: { id: true },
          },
        },
      }),
    ]);

    if (location) {
      // It's a location
      result.locationId = location.id;
      result.locationSlug = location.slug;
      result.locationName = location.name;
      result.locationType = location.type;
    } else if (category) {
      // It's a category
      result.categoryId = category.id;
      result.categorySlug = category.slug;
      result.categoryName = category.name;
      result.isParentCategory = category.parent_id === null && (category.other_categories?.length || 0) > 0;
    }
  } else if (params.length === 2) {
    // Two params: location + category
    const [location, category] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: firstParam },
        select: { id: true, name: true, slug: true, type: true },
      }),
      prisma.categories.findFirst({
        where: { slug: secondParam },
        select: {
          id: true,
          name: true,
          slug: true,
          parent_id: true,
          other_categories: {
            select: { id: true },
          },
        },
      }),
    ]);

    if (location) {
      result.locationId = location.id;
      result.locationSlug = location.slug;
      result.locationName = location.name;
      result.locationType = location.type;
    }

    if (category) {
      result.categoryId = category.id;
      result.categorySlug = category.slug;
      result.categoryName = category.name;
      result.isParentCategory = category.parent_id === null && (category.other_categories?.length || 0) > 0;
    }
  }

  return result;
}

// buildAdUrl has been moved to '@/lib/urlBuilder' for client-side compatibility

/**
 * Extract location and category IDs for Prisma queries
 * Handles hierarchical filtering (province includes all districts and municipalities)
 *
 * @param locationId - Location ID from parsed URL
 * @param locationType - Location type (province, district, municipality, area)
 * @param categoryId - Category ID from parsed URL
 * @param isParentCategory - Whether category is a parent with subcategories
 * @returns Array of location IDs and category IDs to use in Prisma where clause
 */
export async function getFilterIds(
  locationId: number | null,
  locationType: string | null,
  categoryId: number | null,
  isParentCategory: boolean
): Promise<{
  locationIds: number[];
  categoryIds: number[];
}> {
  const result = {
    locationIds: [] as number[],
    categoryIds: [] as number[],
  };

  // Handle location hierarchy
  if (locationId && locationType) {
    if (locationType === 'province') {
      // Get all districts in this province
      const districts = await prisma.locations.findMany({
        where: { parent_id: locationId, type: 'district' },
        select: { id: true },
      });
      const districtIds = districts.map((d) => d.id);

      // Get all municipalities in these districts
      const municipalities = await prisma.locations.findMany({
        where: { parent_id: { in: districtIds }, type: 'municipality' },
        select: { id: true },
      });
      const municipalityIds = municipalities.map((m) => m.id);

      // Get all areas in these municipalities
      const areas = await prisma.locations.findMany({
        where: { parent_id: { in: municipalityIds }, type: 'area' },
        select: { id: true },
      });

      // Combine all location IDs (province → districts → municipalities → areas)
      result.locationIds = [
        locationId,
        ...districtIds,
        ...municipalityIds,
        ...areas.map((a) => a.id),
      ];
    } else if (locationType === 'district') {
      // Get district and all its municipalities
      const municipalities = await prisma.locations.findMany({
        where: { parent_id: locationId, type: 'municipality' },
        select: { id: true },
      });
      const municipalityIds = municipalities.map((m) => m.id);

      // Get all areas in these municipalities
      const areas = await prisma.locations.findMany({
        where: { parent_id: { in: municipalityIds }, type: 'area' },
        select: { id: true },
      });

      // Combine district → municipalities → areas
      result.locationIds = [
        locationId,
        ...municipalityIds,
        ...areas.map((a) => a.id),
      ];
    } else if (locationType === 'municipality') {
      // Get municipality and all its areas
      const areas = await prisma.locations.findMany({
        where: { parent_id: locationId, type: 'area' },
        select: { id: true },
      });

      // Combine municipality → areas
      result.locationIds = [locationId, ...areas.map((a) => a.id)];
    } else {
      // Area - exact match
      result.locationIds = [locationId];
    }
  }

  // Handle category hierarchy
  if (categoryId) {
    if (isParentCategory) {
      // Parent category selected - include all subcategories
      const subcategories = await prisma.categories.findMany({
        where: { parent_id: categoryId },
        select: { id: true },
      });

      result.categoryIds = [categoryId, ...subcategories.map((c) => c.id)];
    } else {
      // Subcategory selected - exact match
      result.categoryIds = [categoryId];
    }
  }

  return result;
}

// generateAdListingMetadata has been moved to '@/lib/urlBuilder' for client-side compatibility
