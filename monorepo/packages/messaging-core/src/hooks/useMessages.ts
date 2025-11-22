/**
 * useMessages Hook
 * Comprehensive hook for managing messages in a conversation
 * Combines REST API (historical) + Socket.IO (real-time)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, LoadingState } from '../types';
import { SocketService } from '../services/socketService';
import { MessagingApi } from '../services/messagingApi';

interface UseMessagesOptions {
  conversationId: number | null;
  socket: SocketService | null;
  api: MessagingApi;
  enabled?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  state: LoadingState;
  sendMessage: (content: string, type?: 'text' | 'image') => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  markAsRead: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage messages for a conversation
 *
 * @example
 * const { messages, loading, sendMessage, markAsRead } = useMessages({
 *   conversationId: 123,
 *   socket,
 *   api,
 * });
 */
export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const { conversationId, socket, api, enabled = true } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoadingState>('idle');

  // Track if we've loaded initial messages
  const hasLoadedRef = useRef(false);

  /**
   * Load historical messages from REST API
   */
  const loadMessages = useCallback(async () => {
    if (!conversationId || !enabled) return;

    try {
      setLoading(true);
      setState('loading');
      setError(null);

      const fetchedMessages = await api.getMessages(conversationId);

      setMessages(fetchedMessages);
      setState('success');
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setState('error');
    } finally {
      setLoading(false);
    }
  }, [conversationId, api, enabled]);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(
    async (content: string, type: 'text' | 'image' = 'text') => {
      if (!conversationId || !socket) {
        throw new Error('Conversation or socket not available');
      }

      // Use Socket.IO for real-time sending
      socket.sendMessage(conversationId, content, type);
    },
    [conversationId, socket]
  );

  /**
   * Edit a message
   */
  const editMessage = useCallback(
    async (messageId: number, content: string) => {
      if (!socket) {
        throw new Error('Socket not available');
      }

      // Use Socket.IO for real-time editing
      socket.editMessage(messageId, content);
    },
    [socket]
  );

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(
    async (messageId: number) => {
      if (!socket) {
        throw new Error('Socket not available');
      }

      // Use Socket.IO for real-time deletion
      socket.deleteMessage(messageId);
    },
    [socket]
  );

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(() => {
    if (!conversationId || !socket) return;

    socket.markAsRead(conversationId);
  }, [conversationId, socket]);

  /**
   * Refresh messages
   */
  const refresh = useCallback(async () => {
    hasLoadedRef.current = false;
    await loadMessages();
  }, [loadMessages]);

  /**
   * Load initial messages when conversation changes
   */
  useEffect(() => {
    if (conversationId && enabled && !hasLoadedRef.current) {
      loadMessages();
    }

    return () => {
      // Reset state when conversation changes
      if (!conversationId) {
        setMessages([]);
        hasLoadedRef.current = false;
        setState('idle');
      }
    };
  }, [conversationId, enabled, loadMessages]);

  /**
   * Setup Socket.IO event listeners for real-time updates
   */
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room
    socket.joinConversation(conversationId);

    // Handle new messages
    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }
    };

    // Handle message updates
    const handleMessageUpdated = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? message : m))
        );
      }
    };

    // Handle message deletions
    const handleMessageDeleted = (messageId: number) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '[Deleted]' } : m
        )
      );
    };

    // Attach listeners
    socket.onMessageNew(handleNewMessage);
    socket.onMessageUpdated(handleMessageUpdated);
    socket.onMessageDeleted(handleMessageDeleted);

    // Cleanup
    return () => {
      socket.leaveConversation(conversationId);
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleMessageUpdated);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, conversationId]);

  return {
    messages,
    loading,
    error,
    state,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    refresh,
  };
}
