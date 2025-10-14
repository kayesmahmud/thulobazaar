/**
 * Locations API
 *
 * Handles all location-related operations
 */

import { API_BASE_URL } from '../config/env.js';
import { get } from './client.js';

/**
 * Get locations (optionally filter by parent_id for hierarchical selection)
 */
export async function getLocations(parentId = null) {
  if (parentId !== null) {
    const data = await get(`/locations?parent_id=${parentId}`);
    return data.data;
  }
  const data = await get('/locations');
  return data.data;
}

/**
 * Get complete location hierarchy (provinces > districts > municipalities)
 * OPTIMIZED: Returns all locations in a single API call instead of 85 separate calls
 */
export async function getLocationHierarchy() {
  try {
    const response = await fetch(`${API_BASE_URL}/locations/hierarchy`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch location hierarchy');
    }

    return data.data;
  } catch (error) {
    console.error('❌ Location hierarchy error:', error);
    throw error;
  }
}

/**
 * Search locations/areas with autocomplete
 */
export async function searchLocations(query, limit = 10) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('❌ Location search error:', error);
    return [];
  }
}

/**
 * Search ALL location levels (provinces, districts, municipalities, wards, areas)
 */
export async function searchAllLocations(query, limit = 15) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/locations/search-all?q=${encodeURIComponent(query)}&limit=${limit}`);
    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('❌ Location search-all error:', error);
    return [];
  }
}

// Default export
export default {
  getLocations,
  getLocationHierarchy,
  searchLocations,
  searchAllLocations
};
