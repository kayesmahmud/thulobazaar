/**
 * Editor Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  BusinessVerificationRequest,
  IndividualVerificationRequest,
  ApiResponse,
} from '@thulobazaar/types';

export function createEditorMethods(client: AxiosInstance) {
  return {
    async getEditorStats(): Promise<
      ApiResponse<{
        totalAds: number;
        pendingAds: number;
        activeAds: number;
        rejectedAds: number;
        pendingVerifications: number;
      }>
    > {
      const response = await client.get('/api/editor/stats');
      return response.data;
    },

    async getPendingVerifications(): Promise<
      ApiResponse<(BusinessVerificationRequest | IndividualVerificationRequest)[]>
    > {
      const response = await client.get('/api/editor/verifications');
      return response.data;
    },

    async getVerificationsByStatus(
      status: 'pending' | 'approved' | 'rejected' | 'all',
      type?: 'business' | 'individual' | 'all'
    ): Promise<ApiResponse<(BusinessVerificationRequest | IndividualVerificationRequest)[]>> {
      const params = new URLSearchParams({ status });
      if (type && type !== 'all') params.append('type', type);
      const response = await client.get(`/api/editor/verifications?${params.toString()}`);
      return response.data;
    },

    async reviewVerification(
      verificationId: number,
      type: 'business' | 'individual',
      action: 'approve' | 'reject',
      reason?: string
    ): Promise<ApiResponse<BusinessVerificationRequest | IndividualVerificationRequest>> {
      const response = await client.post(
        `/api/editor/verifications/${type}/${verificationId}/${action}`,
        { reason }
      );
      return response.data;
    },

    async getSuspendedRejectedUsers(params?: {
      page?: number;
      limit?: number;
      type?: 'all' | 'suspended' | 'rejected';
      search?: string;
    }): Promise<
      ApiResponse<
        {
          id: number;
          fullName: string;
          email: string;
          phone: string | null;
          isActive: boolean;
          businessVerificationStatus: string | null;
          createdAt: string;
          shopSlug: string | null;
          adCount: number;
        }[]
      > & { pagination?: { page: number; limit: number; total: number; totalPages: number } }
    > {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.type) searchParams.append('type', params.type);
      if (params?.search) searchParams.append('search', params.search);
      const response = await client.get(
        `/api/editor/user-reports/list?${searchParams.toString()}`
      );
      return response.data;
    },

    async getEditorAds(params?: {
      status?: string;
      category?: string;
      location?: string;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      includeDeleted?: string;
    }): Promise<
      ApiResponse<{
        data: Array<any>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    > {
      const response = await client.get('/api/editor/ads', { params });
      return response.data;
    },

    async getEditors(): Promise<
      ApiResponse<
        Array<{
          id: number;
          full_name: string;
          email: string;
          role: string;
          is_active: boolean;
          created_at: string;
          avatar: string | null;
          total_actions: number;
        }>
      >
    > {
      const response = await client.get('/api/editor/editors');
      return response.data;
    },

    async getEditorUsers(params?: {
      role?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<
      ApiResponse<{
        data: Array<any>;
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>
    > {
      const response = await client.get('/api/super-admin/users', { params });
      // Simple endpoint returns flat array, wrap it in expected format
      if (response.data.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: {
            data: response.data.data,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 20,
              total: response.data.data.length,
              totalPages: 1,
            },
          },
        };
      }
      return response.data;
    },

    async suspendUser(userId: number, reason: string, duration?: number): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/users/${userId}/suspend`, {
        reason,
        duration,
      });
      return response.data;
    },

    async unsuspendUser(userId: number): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/users/${userId}/unsuspend`);
      return response.data;
    },

    async verifyUser(userId: number): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/users/${userId}/verify`);
      return response.data;
    },

    async unverifyUser(userId: number): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/users/${userId}/unverify`);
      return response.data;
    },

    async getSuperAdmins(): Promise<ApiResponse<Array<any>>> {
      const response = await client.get('/api/editor/super-admins');
      return response.data;
    },

    async updateSuperAdmin(
      id: number,
      data: {
        email?: string;
        password?: string;
        full_name?: string;
        two_factor_enabled?: boolean;
      }
    ): Promise<ApiResponse<any>> {
      const response = await client.patch(`/api/editor/super-admins/${id}`, data);
      return response.data;
    },

    // 2FA Methods
    async setup2FA(userId: number): Promise<ApiResponse<{ secret: string; qrCode: string }>> {
      const response = await client.post(`/api/editor/super-admins/${userId}/2fa/setup`);
      return response.data;
    },

    async verify2FA(
      userId: number,
      data: { secret: string; token: string }
    ): Promise<ApiResponse<{ backupCodes: string[] }>> {
      const response = await client.post(`/api/editor/super-admins/${userId}/2fa/verify`, data);
      return response.data;
    },

    async disable2FA(userId: number): Promise<ApiResponse<any>> {
      const response = await client.post(`/api/editor/super-admins/${userId}/2fa/disable`);
      return response.data;
    },

    // System Health
    async getSystemHealth(): Promise<ApiResponse<any>> {
      const response = await client.get('/api/editor/system-health');
      return response.data;
    },

    // Security & Audit
    async getSecurityAudit(params?: {
      timeRange?: '1h' | '24h' | '7d' | '30d';
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<any>> {
      const response = await client.get('/api/editor/security-audit', { params });
      return response.data;
    },

    // Categories Management
    async getAdminCategories(): Promise<ApiResponse<any>> {
      const response = await client.get('/api/editor/categories');
      return response.data;
    },

    async createCategory(data: {
      name: string;
      slug: string;
      icon?: string;
      parent_id?: number;
      form_template?: string;
    }): Promise<ApiResponse<any>> {
      const response = await client.post('/api/editor/categories', data);
      return response.data;
    },

    async updateCategory(
      id: number,
      data: {
        name?: string;
        slug?: string;
        icon?: string;
        parent_id?: number;
        form_template?: string;
      }
    ): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/categories/${id}`, data);
      return response.data;
    },

    async deleteCategory(id: number): Promise<ApiResponse<any>> {
      const response = await client.delete(`/api/editor/categories/${id}`);
      return response.data;
    },

    // Locations Management
    async getAdminLocations(): Promise<ApiResponse<any>> {
      const response = await client.get('/api/editor/locations');
      return response.data;
    },

    async createLocation(data: {
      name: string;
      slug?: string;
      type: 'country' | 'region' | 'city' | 'district';
      parent_id?: number;
      latitude?: number;
      longitude?: number;
    }): Promise<ApiResponse<any>> {
      const response = await client.post('/api/editor/locations', data);
      return response.data;
    },

    async updateLocation(
      id: number,
      data: {
        name?: string;
        slug?: string;
        type?: 'country' | 'region' | 'city' | 'district';
        parent_id?: number;
        latitude?: number;
        longitude?: number;
      }
    ): Promise<ApiResponse<any>> {
      const response = await client.put(`/api/editor/locations/${id}`, data);
      return response.data;
    },

    async deleteLocation(id: number): Promise<ApiResponse<any>> {
      const response = await client.delete(`/api/editor/locations/${id}`);
      return response.data;
    },
  };
}
