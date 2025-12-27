/**
 * Category Methods
 */

import type { AxiosInstance } from 'axios';
import type { Category, ApiResponse } from '@thulobazaar/types';

export function createCategoryMethods(client: AxiosInstance) {
  return {
    async getCategories(params?: {
      includeSubcategories?: boolean;
      parent_id?: number | null;
    }): Promise<ApiResponse<Category[]>> {
      const response = await client.get('/api/categories', { params });
      return response.data;
    },

    async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
      const response = await client.get(`/api/categories/slug/${slug}`);
      return response.data;
    },
  };
}
