'use client';

import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/hooks/useBackendToken';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import type { Ticket, TicketDetail, NewTicketData } from './types';

export interface UseSupportClientReturn {
  // Session
  sessionStatus: 'loading' | 'authenticated' | 'unauthenticated';
  tokenLoading: boolean;
  hasSession: boolean;

  // Data
  tickets: Ticket[];
  selectedTicket: TicketDetail | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // New ticket form
  showNewTicketForm: boolean;
  setShowNewTicketForm: (show: boolean) => void;
  newTicket: NewTicketData;
  setNewTicket: (data: NewTicketData) => void;
  submitting: boolean;

  // Chat
  messageInput: string;
  setMessageInput: (input: string) => void;
  sendingMessage: boolean;
  isOtherTyping: boolean;
  typingUser: string | null;
  isConnected: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;

  // Handlers
  loadTicketDetail: (ticketId: number) => Promise<void>;
  setSelectedTicket: (ticket: TicketDetail | null) => void;
  handleCreateTicket: (e: React.FormEvent) => Promise<void>;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useSupportClient(): UseSupportClientReturn {
  const { data: session, status: sessionStatus } = useSession();
  const { backendToken, loading: tokenLoading } = useBackendToken();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket form state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState<NewTicketData>({
    subject: '',
    category: 'general',
    priority: 'normal',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Chat input state
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Typing indicator state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: { ticketId: number; message: any; newStatus?: string }) => {
    if (selectedTicket && data.ticketId === selectedTicket.id) {
      setSelectedTicket((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return {
          ...prev,
          status: data.newStatus || prev.status,
          messages: [...prev.messages, { ...data.message, isOwnMessage: false }],
        };
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === data.ticketId
          ? {
              ...t,
              status: data.newStatus || t.status,
              lastMessage: {
                content: data.message.isInternal ? '[Internal note]' : data.message.content,
                createdAt: data.message.createdAt,
              },
            }
          : t
      )
    );
  }, [selectedTicket]);

  // Handle ticket status changes
  const handleTicketStatusChanged = useCallback((data: any) => {
    if (selectedTicket && data.ticketId === selectedTicket.id) {
      setSelectedTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
          priority: data.priority || prev.priority,
          assignedTo: data.assignedTo !== undefined ? data.assignedTo : prev.assignedTo,
        };
      });
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === data.ticketId
          ? {
              ...t,
              status: data.status || t.status,
              priority: data.priority || t.priority,
            }
          : t
      )
    );
  }, [selectedTicket]);

  // Handle typing indicator
  const handleTyping = useCallback((data: { ticketId: number; userId: number; isTyping: boolean }) => {
    if (selectedTicket && data.ticketId === selectedTicket.id) {
      setIsOtherTyping(data.isTyping);
      if (data.isTyping) {
        setTypingUser('Staff');
      } else {
        setTypingUser(null);
      }
    }
  }, [selectedTicket]);

  // Initialize socket connection
  const {
    isConnected,
    joinTicket,
    leaveTicket,
    sendMessage: sendSocketMessage,
    startTyping,
    stopTyping,
  } = useSupportSocket({
    token: backendToken,
    isStaff: false,
    onNewMessage: handleNewMessage,
    onTicketStatusChanged: handleTicketStatusChanged,
    onTyping: handleTyping,
  });

  // Load tickets
  useEffect(() => {
    if (!backendToken) return;
    loadTickets();
  }, [backendToken]);

  // Join ticket room when selecting a ticket
  useEffect(() => {
    if (selectedTicket && isConnected) {
      joinTicket(selectedTicket.id);
    }

    return () => {
      if (selectedTicket) {
        leaveTicket(selectedTicket.id);
      }
    };
  }, [selectedTicket?.id, isConnected, joinTicket, leaveTicket]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/support/tickets', {
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to load ticket');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify(newTicket),
      });
      const data = await response.json();
      if (data.success) {
        setShowNewTicketForm(false);
        setNewTicket({ subject: '', category: 'general', priority: 'normal', message: '' });
        loadTickets();
        loadTicketDetail(data.data.id);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, messageInput, false);
        if (result.success && result.message) {
          setSelectedTicket((prev) => {
            if (!prev) return prev;
            if (prev.messages.some((m) => m.id === result.message!.id)) {
              return prev;
            }
            return {
              ...prev,
              messages: [...prev.messages, { ...result.message!, isOwnMessage: true }],
            };
          });
          setMessageInput('');

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          return;
        }
      }

      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({ content: messageInput }),
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        loadTicketDetail(selectedTicket.id);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (selectedTicket && e.target.value.trim()) {
      startTyping(selectedTicket.id);
    }
  };

  return {
    sessionStatus,
    tokenLoading,
    hasSession: !!session,
    tickets,
    selectedTicket,
    loading,
    error,
    setError,
    showNewTicketForm,
    setShowNewTicketForm,
    newTicket,
    setNewTicket,
    submitting,
    messageInput,
    setMessageInput,
    sendingMessage,
    isOtherTyping,
    typingUser,
    isConnected,
    messagesEndRef,
    loadTicketDetail,
    setSelectedTicket,
    handleCreateTicket,
    handleSendMessage,
    handleInputChange,
  };
}
