/**
 * Admin Methods (Super Admin Dashboard)
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiResponse } from '@thulobazaar/types';
import type { ApiClientConfig } from '../types';

export function createAdminMethods(client: AxiosInstance, config: ApiClientConfig) {
  return {
    async getAdminStats(): Promise<
      ApiResponse<{
        totalUsers: number;
        totalAds: number;
        activeAds: number;
        pendingAds: number;
        adsThisWeek: number;
        usersThisWeek: number;
        totalViews: number;
        todayAds: number;
        topCategories: any[];
      }>
    > {
      const isBrowser =
        typeof globalThis !== 'undefined' &&
        typeof (globalThis as any).window !== 'undefined';

      if (isBrowser) {
        try {
          const token = config.getAuthToken ? await config.getAuthToken() : null;
          const response = await axios.get('/api/admin/stats', {
            baseURL: '',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          return response.data;
        } catch (browserError) {
          console.warn(
            '[api-client] Local admin stats route failed, falling back to API base URL',
            browserError
          );
        }
      }

      const response = await client.get('/api/admin/stats');
      return response.data;
    },
  };
}
