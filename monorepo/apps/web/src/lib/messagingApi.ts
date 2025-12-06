/**
 * Messaging API Client - 2025 Best Practices
 * REST API calls for message history and conversations
 */

import type {
  AnnouncementsResponse,
  AnnouncementMarkReadResponse,
} from '@/types/messaging';

// Use same origin for Next.js API routes (no backend dependency)
const API_BASE_URL = '';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
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
 * Announcements API - For broadcast messages from ThuluBazaar
 * Mobile-app compatible (uses standard fetch)
 */
export const announcementsApi = {
  /**
   * Get announcements for the authenticated user
   */
  getAnnouncements: async (
    token: string,
    params?: { includeRead?: boolean }
  ): Promise<AnnouncementsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.includeRead !== undefined) {
      queryParams.set('includeRead', params.includeRead.toString());
    }

    const endpoint = `/api/announcements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return fetchApi(endpoint, { token });
  },

  /**
   * Mark an announcement as read
   */
  markAsRead: async (
    token: string,
    announcementId: number
  ): Promise<AnnouncementMarkReadResponse> => {
    return fetchApi(`/api/announcements/${announcementId}/read`, {
      method: 'POST',
      token,
    });
  },

  /**
   * Get only the unread count (lightweight)
   */
  getUnreadCount: async (token: string): Promise<{ success: boolean; unreadCount: number }> => {
    const response = await fetchApi('/api/announcements?includeRead=true', { token });
    return {
      success: response.success,
      unreadCount: response.unreadCount || 0,
    };
  },
};

export const messagingApi = {
  /**
   * Get all conversations for the authenticated user
   */
  getConversations: async (token: string, params?: { limit?: number; offset?: number; includeArchived?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());
    if (params?.includeArchived) queryParams.set('includeArchived', 'true');

    const endpoint = `/api/messages/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return fetchApi(endpoint, { token });
  },

  /**
   * Get a specific conversation with messages
   */
  getConversation: async (token: string, conversationId: number, params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const endpoint = `/api/messages/conversations/${conversationId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return fetchApi(endpoint, { token });
  },

  /**
   * Create a new conversation
   */
  createConversation: async (
    token: string,
    data: {
      participantIds: number[];
      type?: 'direct' | 'group';
      title?: string;
      adId?: number;
    }
  ) => {
    return fetchApi('/api/messages/conversations', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  /**
   * Archive or unarchive a conversation
   */
  archiveConversation: async (token: string, conversationId: number, isArchived: boolean) => {
    return fetchApi(`/api/messages/conversations/${conversationId}/archive`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ isArchived }),
    });
  },

  /**
   * Mute or unmute a conversation
   */
  muteConversation: async (token: string, conversationId: number, isMuted: boolean) => {
    return fetchApi(`/api/messages/conversations/${conversationId}/mute`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ isMuted }),
    });
  },

  /**
   * Search for users to start a conversation with
   */
  searchUsers: async (token: string, query: string) => {
    return fetchApi(`/api/messages/search-users?q=${encodeURIComponent(query)}`, { token });
  },

  /**
   * Get total unread message count
   */
  getUnreadCount: async (token: string) => {
    return fetchApi('/api/messages/unread-count', { token });
  },

  /**
   * Leave a conversation
   */
  leaveConversation: async (token: string, conversationId: number) => {
    return fetchApi(`/api/messages/conversations/${conversationId}`, {
      method: 'DELETE',
      token,
    });
  },

  /**
   * Start or get a conversation with another user
   * This will return existing conversation if one exists, or create a new one
   */
  startConversation: async (
    token: string,
    data: {
      userId: number;
      adId?: number;
    }
  ) => {
    return fetchApi('/api/messages/conversations', {
      method: 'POST',
      token,
      body: JSON.stringify({
        participantIds: [data.userId],
        type: 'direct',
        adId: data.adId,
      }),
    });
  },
};
