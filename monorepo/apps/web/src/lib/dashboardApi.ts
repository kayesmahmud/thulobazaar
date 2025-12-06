/**
 * Dashboard API Client - Mobile Compatible (2025 Best Practices)
 * Uses standard fetch API for cross-platform compatibility (Web + iOS/Android)
 */

import type {
  DashboardAd,
  DashboardVerificationStatus,
  DashboardAdsResponse,
  DashboardVerificationResponse,
  DashboardUnreadCountResponse,
} from '@/types/dashboard';

// Use same origin for Next.js API routes (no backend dependency)
const API_BASE_URL = '';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

/**
 * Dashboard API - Mobile-compatible endpoints
 */
export const dashboardApi = {
  /**
   * Get user's ads for dashboard
   */
  getUserAds: async (token: string): Promise<DashboardAdsResponse> => {
    return fetchApi<DashboardAdsResponse>('/api/user/ads', { token });
  },

  /**
   * Get verification status
   */
  getVerificationStatus: async (token: string): Promise<DashboardVerificationResponse> => {
    return fetchApi<DashboardVerificationResponse>('/api/verification/status', { token });
  },

  /**
   * Get unread message count
   */
  getUnreadCount: async (token: string): Promise<DashboardUnreadCountResponse> => {
    return fetchApi<DashboardUnreadCountResponse>('/api/messages/unread-count', { token });
  },

  /**
   * Delete an ad
   */
  deleteAd: async (token: string, adId: number): Promise<{ success: boolean; message?: string }> => {
    return fetchApi(`/api/ads/${adId}`, {
      method: 'DELETE',
      token,
    });
  },
};

/**
 * Load all dashboard data in parallel
 * Mobile-compatible implementation
 */
export async function loadDashboardData(token: string): Promise<{
  ads: DashboardAd[];
  verificationStatus: DashboardVerificationStatus | null;
  unreadCount: number;
}> {
  console.log('📊 [Dashboard] Loading data with token:', token ? 'Present' : 'NULL');

  const [adsResponse, verificationResponse, messagesResponse] = await Promise.all([
    dashboardApi.getUserAds(token).catch((err) => {
      console.error('📊 [Dashboard] getUserAds error:', err);
      return { success: false, data: [] as DashboardAd[] };
    }),
    dashboardApi.getVerificationStatus(token).catch((err) => {
      console.error('📊 [Dashboard] getVerificationStatus error:', err);
      return { success: false, data: null };
    }),
    dashboardApi.getUnreadCount(token).catch((err) => {
      console.error('📊 [Dashboard] getUnreadCount error:', err);
      return { success: true, data: { unreadCount: 0 } };
    }),
  ]);

  console.log('📊 [Dashboard] Ads response:', adsResponse.success);
  console.log('📊 [Dashboard] Verification response:', verificationResponse.success);
  console.log('📊 [Dashboard] Messages response:', messagesResponse);

  // Type-safe access to unread count (handles both snake_case and camelCase)
  const data = messagesResponse?.data as { unreadCount?: number; unread_messages?: number } | undefined;
  const unreadCount = data?.unreadCount || data?.unread_messages || 0;

  return {
    ads: (adsResponse.success ? adsResponse.data : []) as DashboardAd[],
    verificationStatus: verificationResponse.success
      ? (verificationResponse.data as DashboardVerificationStatus)
      : null,
    unreadCount,
  };
}

export default dashboardApi;
