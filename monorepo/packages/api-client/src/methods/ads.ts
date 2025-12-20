/**
 * Ad Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  Ad,
  AdWithDetails,
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  PostAdFormData,
  CrossPlatformFile,
} from '@thulobazaar/types';
import { appendFileToFormData } from '@thulobazaar/upload-utils';

export function createAdMethods(client: AxiosInstance) {
  return {
    async getAds(params?: {
      page?: number;
      limit?: number;
      category_id?: number;
      location_id?: number;
      sort_by?: string;
    }): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.get('/api/ads', { params });
      return response.data;
    },

    async getAdById(id: number): Promise<ApiResponse<AdWithDetails>> {
      const response = await client.get(`/api/ads/${id}`);
      return response.data;
    },

    async getAdBySlug(slug: string): Promise<ApiResponse<AdWithDetails>> {
      const response = await client.get(`/api/ads/slug/${slug}`);
      return response.data;
    },

    async searchAds(filters: SearchFilters): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.post('/api/ads/search', filters);
      return response.data;
    },

    async createAd(data: PostAdFormData): Promise<ApiResponse<Ad>> {
      const formData = new FormData();

      // Append basic fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('isNegotiable', data.isNegotiable.toString());
      formData.append('categoryId', data.categoryId.toString());

      if (data.subcategoryId) {
        formData.append('subcategoryId', data.subcategoryId.toString());
      }
      if (data.locationId) {
        formData.append('locationId', data.locationId.toString());
      }
      if (data.areaId) {
        formData.append('areaId', data.areaId.toString());
      }
      if (data.latitude) {
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude) {
        formData.append('longitude', data.longitude.toString());
      }
      if (data.googleMapsLink) {
        formData.append('googleMapsLink', data.googleMapsLink);
      }
      if (data.attributes) {
        formData.append('attributes', JSON.stringify(data.attributes));
      }

      // Append images - handle File, CrossPlatformFile, and string (existing URLs)
      data.images.forEach((image) => {
        if (typeof image === 'string') {
          // Skip strings (these are existing image URLs, handled differently)
          return;
        }
        if (image instanceof File) {
          formData.append('images', image);
        } else if ('uri' in image) {
          // CrossPlatformFile (React Native)
          appendFileToFormData(formData, 'images', image);
        }
      });

      const response = await client.post('/api/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    async updateAd(
      id: number,
      data: Partial<PostAdFormData> & { existingImages?: string[] }
    ): Promise<ApiResponse<Ad>> {
      const formData = new FormData();

      // Append text fields
      if (data.title) {
        formData.append('title', data.title);
      }
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.price !== undefined) {
        formData.append('price', data.price.toString());
      }
      if (data.isNegotiable !== undefined) {
        formData.append('isNegotiable', data.isNegotiable.toString());
      }
      if (data.categoryId) {
        formData.append('categoryId', data.categoryId.toString());
      }
      if (data.subcategoryId) {
        formData.append('subcategoryId', data.subcategoryId.toString());
      }
      if (data.locationId) {
        formData.append('locationId', data.locationId.toString());
      }
      if (data.areaId) {
        formData.append('areaId', data.areaId.toString());
      }
      if (data.latitude) {
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude) {
        formData.append('longitude', data.longitude.toString());
      }
      if (data.googleMapsLink) {
        formData.append('googleMapsLink', data.googleMapsLink);
      }
      if (data.attributes) {
        formData.append('attributes', JSON.stringify(data.attributes));
      }
      if (data.status) {
        formData.append('status', data.status);
      }

      // Append existing images as JSON array (paths to keep)
      if (data.existingImages) {
        formData.append('existingImages', JSON.stringify(data.existingImages));
      }

      // Append new image files - handle File, CrossPlatformFile, and string
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image) => {
          if (typeof image === 'string') {
            // Skip strings (existing image URLs are handled via existingImages)
            return;
          }
          if (image instanceof File) {
            formData.append('images', image);
          } else if ('uri' in image) {
            // CrossPlatformFile (React Native)
            appendFileToFormData(formData, 'images', image);
          }
        });
      }

      const response = await client.put(`/api/ads/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    },

    async deleteAd(id: number): Promise<ApiResponse<void>> {
      const response = await client.delete(`/api/ads/${id}`);
      return response.data;
    },

    async markAdAsSold(
      id: number
    ): Promise<ApiResponse<{ id: number; title: string; status: string }>> {
      const response = await client.post(`/api/ads/${id}/mark-sold`);
      return response.data;
    },

    async incrementAdView(id: number): Promise<ApiResponse<void>> {
      const response = await client.post(`/api/ads/${id}/view`);
      return response.data;
    },

    async getUserAds(): Promise<ApiResponse<AdWithDetails[]>> {
      const response = await client.get('/api/ads/my-ads');
      return response.data;
    },
  };
}
