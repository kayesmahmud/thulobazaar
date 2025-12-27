/**
 * useSocket Hook - 2025 Best Practices
 * Socket.IO client for real-time messaging
 * Features: Auto-reconnection, JWT auth, event listeners
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  token: string | null;
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  error: string | null;
}

export function useSocket({ token, autoConnect = true }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    error: null,
  });

  // Initialize socket connection
  useEffect(() => {
    // CRITICAL: Log token status for debugging
    console.log('🔌 [useSocket] Token status:', token ? `Present (${token.substring(0, 20)}...)` : 'NULL/UNDEFINED');
    console.log('🔌 [useSocket] Auto-connect:', autoConnect);

    if (!token || !autoConnect) {
      console.warn('⚠️ [useSocket] Socket connection skipped - token:', !!token, 'autoConnect:', autoConnect);
      return;
    }

    // Require explicit backend URL to avoid spamming localhost:5000 when backend isn't running
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      console.warn('⚠️ [useSocket] No NEXT_PUBLIC_BACKEND_URL set, skipping socket connection');
      return;
    }

    console.log('🔌 [useSocket] Connecting to:', backendUrl);

    const socket = io(backendUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ [useSocket] Socket.IO connected:', socket.id);
      setState({ connected: true, error: null });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [useSocket] Socket.IO disconnected:', reason);
      setState({ connected: false, error: null });
    });

    socket.on('connect_error', (error) => {
      console.error('❌ [useSocket] Socket.IO connection error:', error.message);
      console.error('❌ [useSocket] Error details:', error);
      setState({ connected: false, error: error.message });
    });

    socket.on('error', (error) => {
      console.error('❌ [useSocket] Socket.IO error:', error);
      setState((prev) => ({ ...prev, error: error.message || 'Socket error' }));
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useSocket] Cleaning up socket connection');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, autoConnect]);

  // Emit event with callback
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
      if (callback) {
        callback({ error: 'Socket not connected' });
      }
      return;
    }

    socketRef.current.emit(event, data, callback);
  }, []);

  // Subscribe to event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  // Unsubscribe from event
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    connected: state.connected,
    error: state.error,
    emit,
    on,
    off,
  };
}

/**
 * useMessages Hook - Messaging-specific functionality
 */
export function useMessages(token: string | null) {
  const { socket, connected, error, emit, on, off } = useSocket({ token });
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // Send message
  const sendMessage = useCallback(
    (conversationId: number, content: string, type = 'text') => {
      return new Promise((resolve, reject) => {
        emit(
          'message:send',
          { conversationId, content, type },
          (response: any) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.message);
            }
          }
        );
      });
    },
    [emit]
  );

  // Mark messages as read
  const markAsRead = useCallback(
    (conversationId: number) => {
      return new Promise((resolve, reject) => {
        emit('message:read', { conversationId }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Edit message
  const editMessage = useCallback(
    (messageId: number, newContent: string) => {
      return new Promise((resolve, reject) => {
        emit('message:edit', { messageId, newContent }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Delete message
  const deleteMessage = useCallback(
    (messageId: number) => {
      return new Promise((resolve, reject) => {
        emit('message:delete', { messageId }, (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    },
    [emit]
  );

  // Typing indicators
  const startTyping = useCallback(
    (conversationId: number) => {
      emit('typing:start', { conversationId });
    },
    [emit]
  );

  const stopTyping = useCallback(
    (conversationId: number) => {
      emit('typing:stop', { conversationId });
    },
    [emit]
  );

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: any) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => [...prev, message]);
    };

    const handleMessageEdited = (data: any) => {
      console.log('✏️ Message edited:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: data.newContent, isEdited: true, editedAt: data.editedAt }
            : msg
        )
      );
    };

    const handleMessageDeleted = (data: any) => {
      console.log('🗑️ Message deleted:', data);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, isDeleted: true, deletedAt: data.deletedAt }
            : msg
        )
      );
    };

    const handleTypingStart = (data: any) => {
      setTypingUsers((prev) => new Set(prev).add(data.userId));
    };

    const handleTypingStop = (data: any) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    on('message:new', handleNewMessage);
    on('message:edited', handleMessageEdited);
    on('message:deleted', handleMessageDeleted);
    on('typing:user-started', handleTypingStart);
    on('typing:user-stopped', handleTypingStop);

    return () => {
      off('message:new', handleNewMessage);
      off('message:edited', handleMessageEdited);
      off('message:deleted', handleMessageDeleted);
      off('typing:user-started', handleTypingStart);
      off('typing:user-stopped', handleTypingStop);
    };
  }, [socket, on, off]);

  return {
    socket,
    connected,
    error,
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    markAsRead,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
  };
}
