/**
 * useConversations Hook
 * Manages the list of conversations with real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConversationListItem, Message, LoadingState } from '../types';
import { SocketService } from '../services/socketService';
import { MessagingApi } from '../services/messagingApi';

interface UseConversationsOptions {
  socket: SocketService | null;
  api: MessagingApi;
  enabled?: boolean;
}

interface UseConversationsReturn {
  conversations: ConversationListItem[];
  loading: boolean;
  error: string | null;
  state: LoadingState;
  refresh: () => Promise<void>;
  totalUnread: number;
}

/**
 * Hook to manage conversations list
 *
 * @example
 * const { conversations, loading, refresh, totalUnread } = useConversations({
 *   socket,
 *   api,
 * });
 */
export function useConversations(
  options: UseConversationsOptions
): UseConversationsReturn {
  const { socket, api, enabled = true } = options;

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoadingState>('idle');

  const hasLoadedRef = useRef(false);

  /**
   * Calculate total unread count
   */
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  /**
   * Load conversations from REST API
   */
  const loadConversations = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setState('loading');
      setError(null);

      const fetchedConversations = await api.getConversations();

      setConversations(fetchedConversations);
      setState('success');
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setState('error');
    } finally {
      setLoading(false);
    }
  }, [api, enabled]);

  /**
   * Refresh conversations
   */
  const refresh = useCallback(async () => {
    hasLoadedRef.current = false;
    await loadConversations();
  }, [loadConversations]);

  /**
   * Load initial conversations
   */
  useEffect(() => {
    if (enabled && !hasLoadedRef.current) {
      loadConversations();
    }
  }, [enabled, loadConversations]);

  /**
   * Setup Socket.IO event listeners for real-time updates
   */
  useEffect(() => {
    if (!socket) return;

    // Handle new messages - update lastMessage and move to top
    const handleNewMessage = (message: Message) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: {
                id: message.id,
                content: message.content,
                type: message.type,
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
              // Increment unread count if message is from someone else
              unreadCount: conv.unreadCount + 1,
            };
          }
          return conv;
        });

        // Sort by lastMessageAt (most recent first)
        return updated.sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.id).getTime();
          const timeB = new Date(b.lastMessageAt || b.id).getTime();
          return timeB - timeA;
        });
      });
    };

    // Handle conversation updates
    const handleConversationUpdated = (data: {
      conversationId: number;
      lastMessage: Message;
      timestamp: string;
    }) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              lastMessage: {
                id: data.lastMessage.id,
                content: data.lastMessage.content,
                type: data.lastMessage.type,
                senderId: data.lastMessage.senderId,
                createdAt: data.lastMessage.createdAt,
              },
              lastMessageAt: data.timestamp,
            };
          }
          return conv;
        });

        // Sort by lastMessageAt
        return updated.sort((a, b) => {
          const timeA = new Date(a.lastMessageAt || a.id).getTime();
          const timeB = new Date(b.lastMessageAt || b.id).getTime();
          return timeB - timeA;
        });
      });
    };

    // Handle message read - update unread count
    const handleMessageRead = (data: { conversationId: number; userId: number }) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === data.conversationId) {
            return {
              ...conv,
              unreadCount: 0,
            };
          }
          return conv;
        })
      );
    };

    // Attach listeners
    socket.onMessageNew(handleNewMessage);
    socket.onConversationUpdated(handleConversationUpdated);
    socket.on('message:read', handleMessageRead);

    // Cleanup
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('message:read', handleMessageRead);
    };
  }, [socket]);

  return {
    conversations,
    loading,
    error,
    state,
    refresh,
    totalUnread,
  };
}
