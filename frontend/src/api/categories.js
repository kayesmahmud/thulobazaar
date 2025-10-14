/**
 * Categories API
 *
 * Handles all category-related operations
 */

import { get } from './client.js';

/**
 * Get categories
 */
export async function getCategories(includeSubcategories = false) {
  const params = includeSubcategories ? '?includeSubcategories=true' : '';
  const data = await get(`/categories${params}`);
  return data.data;
}

// Default export
export default {
  getCategories
};
