/**
 * Ads API
 *
 * Handles all ad-related operations
 */

import { API_BASE_URL } from '../config/env.js';
import { get, post, put, del, apiRequest } from './client.js';

/**
 * Get all ads with optional search parameters
 */
export async function getAds(searchParams = {}) {
  const params = new URLSearchParams();

  // SUPPORTED PARAMETERS (backend validates these)
  if (searchParams.search) params.append('search', searchParams.search);
  if (searchParams.category) params.append('category', searchParams.category);
  if (searchParams.parentCategoryId) params.append('parentCategoryId', searchParams.parentCategoryId);

  // Location filtering - use location_name for hierarchical filtering with recursive CTE
  if (searchParams.location_name) params.append('location_name', searchParams.location_name);
  else if (searchParams.location) params.append('location', searchParams.location);

  // Price filters
  if (searchParams.minPrice) params.append('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) params.append('maxPrice', searchParams.maxPrice);

  // Condition filter
  if (searchParams.condition) params.append('condition', searchParams.condition);

  // Sorting
  if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);

  // Pagination
  if (searchParams.limit) params.append('limit', searchParams.limit);
  if (searchParams.offset) params.append('offset', searchParams.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/ads?${queryString}` : '/ads';

  const data = await get(endpoint);
  return data; // Return the full response including pagination
}

/**
 * Get single ad by ID
 */
export async function getAd(id) {
  const data = await get(`/ads/${id}`);
  return data.data;
}

/**
 * Create new ad
 */
export async function createAd(adData, images = []) {
  // Create FormData for file upload
  const formData = new FormData();

  // Add text data (skip null/undefined values)
  Object.keys(adData).forEach(key => {
    if (adData[key] !== null && adData[key] !== undefined) {
      // Stringify objects (like customFields) before appending
      const value = typeof adData[key] === 'object' ? JSON.stringify(adData[key]) : adData[key];
      formData.append(key, value);
    }
  });

  // Add images
  images.forEach(image => {
    formData.append('images', image);
  });

  const data = await post('/ads', formData, true);
  return data.data;
}

/**
 * Update ad
 */
export async function updateAd(adId, adData) {
  const data = await put(`/ads/${adId}`, adData, true);
  return data.data;
}

/**
 * Delete ad
 */
export async function deleteAd(adId) {
  const data = await del(`/ads/${adId}`, true);
  return data;
}

/**
 * Get user's ads
 */
export async function getUserAds() {
  const data = await get('/user/ads', true);
  return data; // Return full response including pagination
}

// Default export
export default {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  getUserAds
};
