/**
 * Support Socket.IO Hook
 * Real-time support ticket communication
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SupportMessage {
  id: number;
  senderId: number;
  content: string;
  type: string;
  attachmentUrl?: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: number;
    fullName: string;
    avatar?: string;
    isStaff: boolean;
  };
  isOwnMessage?: boolean;
}

interface TicketUpdate {
  ticketId: number;
  ticketNumber?: string;
  status?: string;
  priority?: string;
  assignedTo?: {
    id: number;
    fullName: string;
    avatar?: string;
  } | null;
  updatedAt?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface TypingIndicator {
  ticketId: number;
  userId: number;
  isTyping: boolean;
}

interface UseSupportSocketOptions {
  token: string | null;
  isStaff?: boolean;
  onNewMessage?: (data: { ticketId: number; message: SupportMessage; newStatus?: string }) => void;
  onTicketUpdated?: (data: TicketUpdate) => void;
  onTicketStatusChanged?: (data: TicketUpdate) => void;
  onTyping?: (data: TypingIndicator) => void;
}

export function useSupportSocket({
  token,
  isStaff = false,
  onNewMessage,
  onTicketUpdated,
  onTicketStatusChanged,
  onTyping,
}: UseSupportSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    socketRef.current = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Support socket connected:', socketRef.current?.id);
      setIsConnected(true);

      // If staff, join the staff room
      if (isStaff) {
        socketRef.current?.emit('support:join-staff-room', (response: any) => {
          if (response.error) {
            console.error('Failed to join staff room:', response.error);
          } else {
            console.log('🎫 Joined support:staff room');
          }
        });
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Support socket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Support socket connection error:', error);
      setIsConnected(false);
    });

    // Listen for new messages
    socketRef.current.on('support:message-new', (data: { ticketId: number; message: SupportMessage; newStatus?: string }) => {
      console.log('📩 New support message:', data);
      onNewMessage?.(data);
    });

    // Listen for ticket updates (staff dashboard)
    socketRef.current.on('support:ticket-updated', (data: TicketUpdate) => {
      console.log('🔄 Ticket updated:', data);
      onTicketUpdated?.(data);
    });

    // Listen for ticket status changes (current ticket view)
    socketRef.current.on('support:ticket-status-changed', (data: TicketUpdate) => {
      console.log('🔄 Ticket status changed:', data);
      onTicketStatusChanged?.(data);
    });

    // Listen for typing indicators
    socketRef.current.on('support:typing', (data: TypingIndicator) => {
      onTyping?.(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, isStaff, onNewMessage, onTicketUpdated, onTicketStatusChanged, onTyping]);

  // Join a ticket room
  const joinTicket = useCallback((ticketId: number) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot join ticket: socket not connected');
      return;
    }

    // Leave previous ticket room if any
    if (currentTicketId && currentTicketId !== ticketId) {
      socketRef.current.emit('support:leave-ticket', { ticketId: currentTicketId });
    }

    socketRef.current.emit('support:join-ticket', { ticketId }, (response: any) => {
      if (response.error) {
        console.error('Failed to join ticket:', response.error);
      } else {
        console.log(`🎫 Joined ticket room: support:${ticketId}`);
        setCurrentTicketId(ticketId);
      }
    });
  }, [isConnected, currentTicketId]);

  // Leave a ticket room
  const leaveTicket = useCallback((ticketId: number) => {
    if (!socketRef.current) return;

    socketRef.current.emit('support:leave-ticket', { ticketId });
    if (currentTicketId === ticketId) {
      setCurrentTicketId(null);
    }
  }, [currentTicketId]);

  // Send a message via socket
  const sendMessage = useCallback((
    ticketId: number,
    content: string,
    isInternal = false
  ): Promise<{ success: boolean; message?: SupportMessage; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      socketRef.current.emit(
        'support:send-message',
        { ticketId, content, isInternal },
        (response: any) => {
          if (response.error) {
            resolve({ success: false, error: response.error });
          } else {
            resolve({ success: true, message: response.message });
          }
        }
      );
    });
  }, [isConnected]);

  // Update ticket via socket
  const updateTicket = useCallback((
    ticketId: number,
    updates: { status?: string; priority?: string; assignedTo?: number | null }
  ): Promise<{ success: boolean; data?: TicketUpdate; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !isConnected) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      socketRef.current.emit(
        'support:update-ticket',
        { ticketId, ...updates },
        (response: any) => {
          if (response.error) {
            resolve({ success: false, error: response.error });
          } else {
            resolve({ success: true, data: response.data });
          }
        }
      );
    });
  }, [isConnected]);

  // Typing indicator
  const startTyping = useCallback((ticketId: number) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit('support:typing-start', { ticketId });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(ticketId);
    }, 3000);
  }, [isConnected]);

  const stopTyping = useCallback((ticketId: number) => {
    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit('support:typing-stop', { ticketId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [isConnected]);

  return {
    isConnected,
    joinTicket,
    leaveTicket,
    sendMessage,
    updateTicket,
    startTyping,
    stopTyping,
    currentTicketId,
  };
}
