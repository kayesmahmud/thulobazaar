/**
 * useAnnouncements Hook
 * Reusable hook for fetching and managing announcements
 * Works with both web and mobile apps (React Native compatible logic)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  Announcement,
  UseAnnouncementsReturn,
} from '@/types/messaging';
import { announcementsApi } from '@/lib/messagingApi';

interface UseAnnouncementsOptions {
  /** Authentication token */
  token: string | null;
  /** Include already read announcements (default: true) */
  includeRead?: boolean;
  /** Auto-fetch on mount (default: true) */
  autoFetch?: boolean;
}

/**
 * Hook for managing announcements
 * @example
 * ```tsx
 * const { announcements, loading, error, unreadCount, markAsRead, refresh } = useAnnouncements({
 *   token: userToken,
 *   includeRead: true,
 * });
 * ```
 */
export function useAnnouncements({
  token,
  includeRead = true,
  autoFetch = true,
}: UseAnnouncementsOptions): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Load announcements from API
   */
  const loadAnnouncements = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await announcementsApi.getAnnouncements(token, { includeRead });

      if (response.success) {
        setAnnouncements(response.data || []);
        setUnreadCount(response.unreadCount || 0);
      } else {
        setError(response.message || 'Failed to load announcements');
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [token, includeRead]);

  /**
   * Mark an announcement as read
   */
  const markAsRead = useCallback(
    async (announcementId: number) => {
      if (!token) return;

      try {
        const response = await announcementsApi.markAsRead(token, announcementId);

        if (response.success) {
          // Update local state optimistically
          setAnnouncements((prev) =>
            prev.map((a) =>
              a.id === announcementId
                ? { ...a, isRead: true, readAt: new Date().toISOString() }
                : a
            )
          );

          // Update unread count
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Failed to mark announcement as read:', err);
      }
    },
    [token]
  );

  /**
   * Refresh announcements (alias for loadAnnouncements)
   */
  const refresh = useCallback(async () => {
    await loadAnnouncements();
  }, [loadAnnouncements]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      loadAnnouncements();
    }
  }, [autoFetch, loadAnnouncements]);

  return {
    announcements,
    loading,
    error,
    unreadCount,
    loadAnnouncements,
    markAsRead,
    refresh,
  };
}

/**
 * Hook for fetching only unread count (lightweight)
 * Useful for displaying badge without loading all announcements
 */
export function useAnnouncementUnreadCount(token: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await announcementsApi.getAnnouncements(token, { includeRead: true });
      if (response.success) {
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch announcement unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return { unreadCount, loading, refresh: fetchUnreadCount };
}

export default useAnnouncements;
