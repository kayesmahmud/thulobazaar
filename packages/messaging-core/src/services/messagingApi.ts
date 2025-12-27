/**
 * Platform-Agnostic Messaging API Service
 * Works with both Next.js (web) and React Native (mobile)
 *
 * Usage:
 * import { createMessagingApi } from '@thulobazaar/messaging-core';
 * const messagingApi = createMessagingApi('http://localhost:5000');
 */

import type {
  ApiResponse,
  Conversation,
  ConversationListItem,
  ConversationCreate,
  Message,
  MessageCreate,
  MessageUpdate,
  User,
  ConversationsResponse,
  ConversationDetailResponse,
  UnreadCountResponse,
} from '../types';

export interface MessagingApiConfig {
  backendUrl: string;
  getAuthToken: () => string | null;
}

export class MessagingApi {
  private backendUrl: string;
  private getAuthToken: () => string | null;

  constructor(config: MessagingApiConfig) {
    this.backendUrl = config.backendUrl;
    this.getAuthToken = config.getAuthToken;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.backendUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        })) as { message?: string };
        throw new Error(error.message || 'Request failed');
      }

      const data = await response.json() as T;
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================================================
  // CONVERSATION METHODS
  // ============================================================================

  /**
   * Get all conversations for the authenticated user
   */
  async getConversations(): Promise<ConversationListItem[]> {
    const response = await this.request<ConversationsResponse>('/api/conversations');
    return response.data.conversations;
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(conversationId: number): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const response = await this.request<ConversationDetailResponse>(
      `/api/conversations/${conversationId}`
    );
    return response.data;
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: ConversationCreate): Promise<Conversation> {
    const response = await this.request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/archive`, {
      method: 'POST',
    });
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/unarchive`, {
      method: 'POST',
    });
  }

  /**
   * Mute a conversation
   */
  async muteConversation(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/mute`, {
      method: 'POST',
    });
  }

  /**
   * Unmute a conversation
   */
  async unmuteConversation(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/unmute`, {
      method: 'POST',
    });
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/leave`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // MESSAGE METHODS
  // ============================================================================

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: number): Promise<Message[]> {
    const response = await this.request<{ messages: Message[] }>(
      `/api/conversations/${conversationId}/messages`
    );
    return response.data.messages;
  }

  /**
   * Send a message (via REST API fallback)
   * Note: Prefer using Socket.IO for real-time message sending
   */
  async sendMessage(data: MessageCreate): Promise<Message> {
    const response = await this.request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: number, content: string): Promise<Message> {
    const response = await this.request<Message>(`/api/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<void> {
    await this.request(`/api/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: number): Promise<void> {
    await this.request(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  /**
   * Search users for starting conversations
   */
  async searchUsers(query: string): Promise<User[]> {
    const response = await this.request<{ users: User[] }>(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );
    return response.data.users;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await this.request<UnreadCountResponse>('/api/conversations/unread');
    return response.data;
  }

  /**
   * Upload an image attachment
   */
  async uploadImage(file: File | Blob): Promise<string> {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.backendUrl}/api/messages/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const result = await response.json() as { data: { url: string } };
    return result.data.url;
  }
}

/**
 * Factory function to create a messaging API instance
 */
export function createMessagingApi(config: MessagingApiConfig): MessagingApi {
  return new MessagingApi(config);
}

/**
 * Default export for convenience
 */
export default MessagingApi;
