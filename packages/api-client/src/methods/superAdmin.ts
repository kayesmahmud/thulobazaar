/**
 * Super Admin Methods
 */

import type { AxiosInstance } from 'axios';
import type { Ad, AdWithDetails, User, ApiResponse, PaginatedResponse } from '@thulobazaar/types';

export function createSuperAdminMethods(client: AxiosInstance) {
  return {
    async getSuperAdminStats(): Promise<
      ApiResponse<{
        totalAds: number;
        pendingAds: number;
        activeAds: number;
        rejectedAds: number;
        totalUsers: number;
        activeUsers: number;
        totalViews: number;
        todayAds: number;
      }>
    > {
      const response = await client.get('/api/super-admin/stats');
      return response.data;
    },

    async getAllAdsForReview(params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.get('/api/super-admin/ads', { params });
      return response.data;
    },

    async approveAd(adId: number): Promise<ApiResponse<Ad>> {
      const response = await client.put(`/api/editor/ads/${adId}/approve`);
      return response.data;
    },

    async rejectAd(adId: number, reason: string): Promise<ApiResponse<Ad>> {
      const response = await client.put(`/api/editor/ads/${adId}/reject`, { reason });
      return response.data;
    },

    async getAllUsers(params?: {
      page?: number;
      limit?: number;
      status?: string;
    }): Promise<ApiResponse<User[]>> {
      const response = await client.get('/api/super-admin/users', { params });
      return response.data;
    },

    async toggleUserStatus(userId: number): Promise<ApiResponse<User>> {
      const response = await client.post(`/api/super-admin/users/${userId}/toggle-status`);
      return response.data;
    },

    async getSuperAdminVerificationStats(): Promise<
      ApiResponse<{
        pending: number;
        verifiedBusiness: number;
        verifiedIndividual: number;
        suspendedRejected: number;
      }>
    > {
      const response = await client.get('/api/super-admin/verification-stats');
      return response.data;
    },
  };
}
