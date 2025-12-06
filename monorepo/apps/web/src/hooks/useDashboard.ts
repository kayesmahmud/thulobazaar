/**
 * useDashboard Hook
 * Reusable hook for fetching and managing dashboard data
 * Works with both web and mobile apps (React Native compatible logic)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DashboardAd,
  DashboardStats,
  DashboardVerificationStatus,
  UseDashboardReturn,
  DEFAULT_DASHBOARD_STATS,
} from '@/types/dashboard';
import { calculateStatsFromAds } from '@/types/dashboard';
import { dashboardApi, loadDashboardData } from '@/lib/dashboardApi';

interface UseDashboardOptions {
  /** Authentication token (required) */
  token: string | null;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
  /** Callback when data is loaded */
  onDataLoaded?: (data: {
    ads: DashboardAd[];
    stats: DashboardStats;
    verificationStatus: DashboardVerificationStatus | null;
  }) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

/**
 * Hook for managing dashboard data
 * @example
 * ```tsx
 * const {
 *   ads,
 *   stats,
 *   verificationStatus,
 *   loading,
 *   error,
 *   loadData,
 *   deleteAd,
 *   refresh,
 * } = useDashboard({
 *   token: userToken,
 * });
 * ```
 */
export function useDashboard({
  token,
  autoFetch = true,
  onDataLoaded,
  onError,
}: UseDashboardOptions): UseDashboardReturn {
  const [ads, setAds] = useState<DashboardAd[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    totalMessages: 0,
  });
  const [verificationStatus, setVerificationStatus] =
    useState<DashboardVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all dashboard data
   */
  const loadData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await loadDashboardData(token);

      setAds(data.ads);
      setVerificationStatus(data.verificationStatus);

      // Calculate stats from ads
      const calculatedStats = calculateStatsFromAds(data.ads, data.unreadCount);
      setStats(calculatedStats);

      // Notify parent if callback provided
      onDataLoaded?.({
        ads: data.ads,
        stats: calculatedStats,
        verificationStatus: data.verificationStatus,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('Dashboard load error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, onDataLoaded, onError]);

  /**
   * Delete an ad
   * @returns true if successful, false otherwise
   */
  const deleteAd = useCallback(
    async (adId: number): Promise<boolean> => {
      if (!token) return false;

      try {
        await dashboardApi.deleteAd(token, adId);

        // Optimistically update state
        setAds((prevAds) => {
          const newAds = prevAds.filter((ad) => ad.id !== adId);
          // Recalculate stats
          const newStats = calculateStatsFromAds(newAds, stats.totalMessages);
          setStats(newStats);
          return newAds;
        });

        return true;
      } catch (err) {
        console.error('Failed to delete ad:', err);
        return false;
      }
    },
    [token, stats.totalMessages]
  );

  /**
   * Update unread message count (for real-time updates)
   */
  const updateUnreadCount = useCallback((count: number) => {
    setStats((prevStats) => ({
      ...prevStats,
      totalMessages: count,
    }));
  }, []);

  /**
   * Refresh dashboard data (alias for loadData)
   */
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && token) {
      loadData();
    }
  }, [autoFetch, token, loadData]);

  return {
    ads,
    stats,
    verificationStatus,
    loading,
    error,
    loadData,
    deleteAd,
    refresh,
  };
}

/**
 * Hook for real-time message count updates via Socket.IO
 * Separates the socket logic from the main dashboard hook for cleaner code
 */
export function useDashboardMessages(
  token: string | null,
  socket: any | null,
  onCountUpdate: (count: number) => void
) {
  useEffect(() => {
    if (!socket || !token) return;

    const handleNewMessage = async () => {
      try {
        const response = await dashboardApi.getUnreadCount(token);
        const count =
          response?.data?.unreadCount || response?.data?.unread_messages || 0;
        onCountUpdate(count);
      } catch (err) {
        console.error('Failed to update message count:', err);
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, token, onCountUpdate]);
}

export default useDashboard;
