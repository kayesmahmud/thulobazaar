/**
 * useTyping Hook
 * Manages typing indicators for a conversation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SocketService } from '../services/socketService';

interface TypingUser {
  userId: number;
  conversationId: number;
  fullName?: string;
}

interface UseTypingOptions {
  conversationId: number | null;
  socket: SocketService | null;
  currentUserId: number | null;
  typingTimeout?: number; // milliseconds
}

interface UseTypingReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
  isTyping: (userId: number) => boolean;
  typingText: string;
}

/**
 * Hook to manage typing indicators
 *
 * @example
 * const { typingUsers, startTyping, stopTyping, typingText } = useTyping({
 *   conversationId: 123,
 *   socket,
 *   currentUserId: 27,
 * });
 *
 * <input onChange={(e) => {
 *   startTyping();
 *   // ... handle input
 * }} />
 * {typingText && <p>{typingText}</p>}
 */
export function useTyping(options: UseTypingOptions): UseTypingReturn {
  const {
    conversationId,
    socket,
    currentUserId,
    typingTimeout = 3000,
  } = options;

  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef(false);

  /**
   * Start typing indicator
   */
  const startTyping = useCallback(() => {
    if (!conversationId || !socket || !currentUserId) return;

    // Send typing start event if not already typing
    if (!isCurrentlyTypingRef.current) {
      socket.startTyping(conversationId);
      isCurrentlyTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [conversationId, socket, currentUserId, typingTimeout]);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    if (!conversationId || !socket || !currentUserId) return;

    if (isCurrentlyTypingRef.current) {
      socket.stopTyping(conversationId);
      isCurrentlyTypingRef.current = false;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, socket, currentUserId]);

  /**
   * Check if a specific user is typing
   */
  const isTyping = useCallback(
    (userId: number) => {
      return typingUsers.some((user) => user.userId === userId);
    },
    [typingUsers]
  );

  /**
   * Generate typing text
   */
  const typingText = (() => {
    const count = typingUsers.length;
    if (count === 0) return '';
    if (count === 1) {
      return `${typingUsers[0].fullName || 'Someone'} is typing...`;
    }
    if (count === 2) {
      return `${typingUsers[0].fullName || 'Someone'} and ${typingUsers[1].fullName || 'someone else'} are typing...`;
    }
    return `${count} people are typing...`;
  })();

  /**
   * Setup Socket.IO event listeners
   */
  useEffect(() => {
    if (!socket || !conversationId || !currentUserId) return;

    // Handle typing start
    const handleTypingStart = (data: TypingUser) => {
      // Ignore own typing events
      if (data.userId === currentUserId) return;

      if (data.conversationId === conversationId) {
        setTypingUsers((prev) => {
          // Avoid duplicates
          if (prev.some((user) => user.userId === data.userId)) {
            return prev;
          }
          return [...prev, data];
        });
      }
    };

    // Handle typing stop
    const handleTypingStop = (data: TypingUser) => {
      if (data.conversationId === conversationId) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId)
        );
      }
    };

    // Attach listeners
    socket.onTypingStart(handleTypingStart);
    socket.onTypingStop(handleTypingStop);

    // Cleanup
    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);

      // Stop typing on unmount
      if (isCurrentlyTypingRef.current) {
        stopTyping();
      }
    };
  }, [socket, conversationId, currentUserId, stopTyping]);

  /**
   * Clear typing users when conversation changes
   */
  useEffect(() => {
    setTypingUsers([]);
  }, [conversationId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isTyping,
    typingText,
  };
}
