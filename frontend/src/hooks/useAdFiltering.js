import { useMemo, useCallback } from 'react';
import ApiService from '../services/api';

/**
 * Custom hook for ad filtering logic shared between SearchResults and AllAds
 * Extracts common filtering patterns while allowing different state management
 */
export function useAdFiltering(categories, locations) {
  // Create O(1) lookup maps for locations and categories
  const { locationMap, categoryMap } = useMemo(() => {
    const locMap = new Map();
    const catMap = new Map();

    // Build location map: name -> id (includes provinces, districts, municipalities)
    locations.forEach(province => {
      locMap.set(province.name, province.id);

      if (province.districts) {
        province.districts.forEach(district => {
          locMap.set(district.name, district.id);

          if (district.municipalities) {
            district.municipalities.forEach(municipality => {
              locMap.set(municipality.name, municipality.id);
            });
          }
        });
      }
    });

    // Build category map: name -> id (includes main categories and subcategories)
    categories.forEach(category => {
      catMap.set(category.name, category.id);

      if (category.subcategories) {
        category.subcategories.forEach(subcat => {
          catMap.set(subcat.name, subcat.id);
        });
      }
    });

    return { locationMap: locMap, categoryMap: catMap };
  }, [locations, categories]);

  // O(1) location lookup - instant instead of nested loops
  const getLocationId = useCallback((locationName) => {
    if (!locationName || locationName === 'all') return '';
    const id = locationMap.get(locationName);
    return id ? id.toString() : '';
  }, [locationMap]);

  // O(1) category lookup - instant instead of nested loops
  const getCategoryId = useCallback((categoryName, subcategoryName) => {
    if (subcategoryName) {
      const id = categoryMap.get(subcategoryName);
      return id ? id.toString() : '';
    }
    if (!categoryName || categoryName === 'all') return '';
    const id = categoryMap.get(categoryName);
    return id ? id.toString() : '';
  }, [categoryMap]);

  // Build search params for API call
  const buildSearchParams = useCallback((filters) => {
    const searchParams = {};

    // Search query
    if (filters.search && filters.search.trim()) {
      searchParams.search = filters.search.trim();
    }

    // Category filtering: use parentCategoryId for parent categories to include all subcategories
    if (filters.subcategory) {
      // Subcategory selected - filter by specific subcategory only
      searchParams.category = filters.subcategory;
    } else if (filters.category && filters.category !== 'all') {
      // Parent category selected - use parentCategoryId to include all subcategories
      const parentCategory = categories.find(c => c.name === filters.category);
      if (parentCategory) {
        searchParams.parentCategoryId = parentCategory.id;
        console.log(`🏷️ [useAdFiltering] Using parentCategoryId: ${parentCategory.id} for category: ${filters.category}`);
      }
    }

    // Location filtering - use location_name for hierarchical filtering with recursive CTE
    if (filters.location && filters.location !== 'all') {
      searchParams.location_name = filters.location;
      console.log('🗺️ [useAdFiltering] Using location_name for hierarchical filtering:', filters.location);
    }

    // Price filters
    if (filters.minPrice) searchParams.minPrice = filters.minPrice;
    if (filters.maxPrice) searchParams.maxPrice = filters.maxPrice;

    // Condition filter
    if (filters.condition && filters.condition !== 'all') {
      searchParams.condition = filters.condition;
    }

    // Sort
    if (filters.sortBy && filters.sortBy !== 'newest') {
      searchParams.sortBy = filters.sortBy;
    }

    return searchParams;
  }, [categories]);

  // Fetch ads with filters
  const fetchAds = useCallback(async (filters, page = 1, limit = 20) => {
    try {
      const searchParams = buildSearchParams(filters);

      // Add pagination
      const offset = (page - 1) * limit;
      searchParams.limit = limit;
      searchParams.offset = offset;

      console.log('🔍 [useAdFiltering] Fetching ads with params:', searchParams);
      const response = await ApiService.getAds(searchParams);

      return {
        data: response.data,
        total: response.pagination?.total || 0,
        hasMore: response.pagination?.hasMore || false
      };
    } catch (error) {
      console.error('❌ [useAdFiltering] Error fetching ads:', error);
      throw error;
    }
  }, [buildSearchParams]);

  return {
    locationMap,
    categoryMap,
    getLocationId,
    getCategoryId,
    buildSearchParams,
    fetchAds
  };
}
