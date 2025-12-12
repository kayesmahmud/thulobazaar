/**
 * User/Profile Methods
 */

import type { AxiosInstance } from 'axios';
import type { User, AdWithDetails, ApiResponse, PaginatedResponse } from '@thulobazaar/types';

export function createProfileMethods(client: AxiosInstance) {
  return {
    async getUserProfile(userId: number): Promise<ApiResponse<User>> {
      const response = await client.get(`/api/users/${userId}`);
      return response.data;
    },

    async getSellerBySlug(sellerSlug: string): Promise<ApiResponse<User>> {
      const response = await client.get(`/api/seller/${sellerSlug}`);
      return response.data;
    },

    async getSellerAds(
      sellerSlug: string,
      params?: {
        page?: number;
        limit?: number;
        status?: string;
      }
    ): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.get(`/api/seller/${sellerSlug}/ads`, { params });
      return response.data;
    },

    async getShopBySlug(shopSlug: string): Promise<ApiResponse<User>> {
      const response = await client.get(`/api/shop/${shopSlug}`);
      return response.data;
    },

    async getShopAds(
      shopSlug: string,
      params?: {
        page?: number;
        limit?: number;
        status?: string;
      }
    ): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.get(`/api/shop/${shopSlug}/ads`, { params });
      return response.data;
    },

    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
      const response = await client.put('/api/profile', data);
      return response.data;
    },

    async uploadAvatar(file: File): Promise<ApiResponse<{ avatar: string }>> {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await client.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    async checkShopSlugAvailability(slug: string): Promise<ApiResponse<{ available: boolean }>> {
      const response = await client.get('/api/shop/check-slug', {
        params: { slug },
      });
      return response.data;
    },

    async updateShopSlug(slug: string): Promise<ApiResponse<{ shopSlug: string }>> {
      const response = await client.put('/api/shop/update-slug', { slug });
      return response.data;
    },
  };
}
