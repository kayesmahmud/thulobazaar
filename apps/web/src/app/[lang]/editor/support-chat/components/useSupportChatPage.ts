'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import type { SupportTicket, TicketDetail, StatusFilter, PriorityFilter, TicketStats } from './types';

export function useSupportChatPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();
  const token = (staff as any)?.backendToken;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Message input
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Real-time state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket event handlers
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

  const handleTicketUpdated = useCallback((data: any) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === data.ticketId
          ? {
              ...t,
              status: data.status || t.status,
              priority: data.priority || t.priority,
              lastMessage: data.lastMessage || t.lastMessage,
            }
          : t
      )
    );
  }, []);

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

  const handleTyping = useCallback((data: { ticketId: number; userId: number; isTyping: boolean }) => {
    if (selectedTicket && data.ticketId === selectedTicket.id && data.userId !== staff?.id) {
      setIsOtherTyping(data.isTyping);
      if (data.isTyping) {
        setTypingUserName('User');
      } else {
        setTypingUserName(null);
      }
    }
  }, [selectedTicket, staff?.id]);

  // Initialize socket connection
  const {
    isConnected,
    joinTicket,
    leaveTicket,
    sendMessage: sendSocketMessage,
    updateTicket: updateSocketTicket,
    startTyping,
    stopTyping,
  } = useSupportSocket({
    token: token || null,
    isStaff: true,
    onNewMessage: handleNewMessage,
    onTicketUpdated: handleTicketUpdated,
    onTicketStatusChanged: handleTicketStatusChanged,
    onTyping: handleTyping,
  });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, lang, router]);

  // Load tickets
  const loadTickets = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (priorityFilter !== 'all') queryParams.set('priority', priorityFilter);
      if (assignedFilter !== 'all') queryParams.set('assigned', assignedFilter);

      const response = await fetch(`/api/support/tickets?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

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

  const loadTicketDetail = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSelectedTicket(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load ticket');
    }
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    loadTicketDetail(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, newMessage, isInternal);
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
          setNewMessage('');
          setIsInternal(false);

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          return;
        }
      }

      // Fallback to HTTP API
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          isInternal,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setIsInternal(false);
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateTicket = async (updates: { status?: string; priority?: string; assignedTo?: number | null }) => {
    if (!selectedTicket) return;

    try {
      if (isConnected) {
        const result = await updateSocketTicket(selectedTicket.id, updates);
        if (result.success) {
          return;
        }
      }

      // Fallback to HTTP API
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update ticket');
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (selectedTicket && e.target.value.trim()) {
      startTyping(selectedTicket.id);
    }
  };

  // Filter tickets by search term
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.ticketNumber.toLowerCase().includes(search) ||
      ticket.subject.toLowerCase().includes(search) ||
      ticket.user.fullName.toLowerCase().includes(search) ||
      ticket.user.email.toLowerCase().includes(search)
    );
  });

  // Stats
  const stats: TicketStats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return {
    staff,
    authLoading,
    handleLogout,
    tickets,
    filteredTickets,
    selectedTicket,
    loading,
    error,
    setError,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assignedFilter,
    setAssignedFilter,
    searchTerm,
    setSearchTerm,
    newMessage,
    isInternal,
    setIsInternal,
    sendingMessage,
    isOtherTyping,
    typingUserName,
    messagesEndRef,
    isConnected,
    stats,
    handleSelectTicket,
    handleSendMessage,
    handleUpdateTicket,
    handleMessageInputChange,
  };
}
