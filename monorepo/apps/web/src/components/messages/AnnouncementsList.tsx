/**
 * AnnouncementsList Component
 * Shows broadcast announcements from ThuluBazaar to users
 * Uses shared hook for mobile app compatibility
 */

'use client';

import { useEffect } from 'react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { formatRelativeDate } from '@/types/messaging';
import type { Announcement } from '@/types/messaging';

interface AnnouncementsListProps {
  token: string | null;
  onUnreadCountChange?: (count: number) => void;
  onSelectAnnouncement?: (announcement: Announcement) => void;
  selectedAnnouncementId?: number;
}

export default function AnnouncementsList({
  token,
  onUnreadCountChange,
  onSelectAnnouncement,
  selectedAnnouncementId,
}: AnnouncementsListProps) {
  const {
    announcements,
    loading,
    error,
    unreadCount,
    markAsRead,
    refresh,
  } = useAnnouncements({
    token,
    includeRead: true,
    autoFetch: true,
  });

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const handleSelectAnnouncement = async (announcement: Announcement) => {
    // Call parent callback to show in main window
    onSelectAnnouncement?.(announcement);

    // Mark as read when selected
    if (!announcement.isRead) {
      await markAsRead(announcement.id);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={refresh}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p className="mt-4 text-sm">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedAnnouncementId === announcement.id
              ? 'bg-blue-100 border-l-4 border-blue-600'
              : !announcement.isRead
              ? 'bg-blue-50'
              : ''
          }`}
          onClick={() => handleSelectAnnouncement(announcement)}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                !announcement.isRead
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4
                  className={`text-sm font-medium truncate ${
                    !announcement.isRead ? 'text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {announcement.title}
                </h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatRelativeDate(announcement.createdAt)}
                </span>
              </div>

              <p className="text-sm text-gray-500 truncate mt-0.5">
                {announcement.content}
              </p>
            </div>

            {/* Unread indicator */}
            {!announcement.isRead && (
              <div className="flex-shrink-0">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
