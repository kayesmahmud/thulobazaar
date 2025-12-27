/**
 * Location Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  Location,
  LocationHierarchy,
  ApiResponse,
  AreasHierarchyResponse,
  Area,
} from '@thulobazaar/types';

export function createLocationMethods(client: AxiosInstance) {
  return {
    async getLocations(params?: {
      type?: string;
      parent_id?: number;
    }): Promise<ApiResponse<Location[]>> {
      const response = await client.get('/api/locations', { params });
      return response.data;
    },

    async getLocationBySlug(slug: string): Promise<ApiResponse<Location>> {
      const response = await client.get(`/api/locations/slug/${slug}`);
      return response.data;
    },

    async searchLocations(query: string): Promise<ApiResponse<Location[]>> {
      const response = await client.get('/api/locations/search', {
        params: { q: query },
      });
      return response.data;
    },

    async getHierarchy(provinceId?: number): Promise<ApiResponse<LocationHierarchy[]>> {
      const url = provinceId
        ? `/api/locations/hierarchy?provinceId=${provinceId}`
        : '/api/locations/hierarchy';
      const response = await client.get(url);
      return response.data;
    },

    async searchAllLocations(query: string, limit?: number): Promise<ApiResponse<Location[]>> {
      const response = await client.get('/api/locations/search', {
        params: { q: query, limit },
      });
      return response.data;
    },

    // Areas endpoints (for hierarchical location selection with areas)
    async getAreasHierarchy(provinceId?: number): Promise<ApiResponse<AreasHierarchyResponse>> {
      const response = await client.get('/api/areas/hierarchy', {
        params: provinceId ? { province_id: provinceId } : {},
      });
      return response.data;
    },

    async searchAreas(query: string, limit?: number): Promise<ApiResponse<Area[]>> {
      const response = await client.get('/api/areas/search', {
        params: { q: query, limit },
      });
      return response.data;
    },
  };
}
