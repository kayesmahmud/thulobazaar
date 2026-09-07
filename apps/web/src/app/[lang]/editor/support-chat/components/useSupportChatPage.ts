'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { checkProfanity } from '@/utils/profanityCheck';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { SUPPORT_IMAGE_LIMIT_CODE, SUPPORT_IMAGE_MAX_BYTES } from '@/lib/supportAttachmentDisplay';
import type { SupportTicket, TicketDetail, StatusFilter, PriorityFilter, TicketStats } from './types';

export function useSupportChatPage(lang: string, source?: string) {
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

  // Photo waiting in the composer; the preview is an object URL we must revoke.
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingImage) {
      setPendingImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingImage);
    setPendingImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingImage]);

  const handleAttachImage = (file: File) => {
    if (file.size > SUPPORT_IMAGE_MAX_BYTES) {
      setError('Photo must be smaller than 5 MB.');
      return;
    }
    setError(null);
    setPendingImage(file);
  };

  const handleRemoveImage = () => setPendingImage(null);

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

  // A brand-new ticket arrives on the staff room; reload so it appears in the
  // queue immediately (and respects the active filters) instead of only after
  // a manual refresh.
  const loadTicketsRef = useRef<(() => Promise<void>) | null>(null);
  const handleTicketCreated = useCallback(() => {
    loadTicketsRef.current?.();
  }, []);

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
    onTicketCreated: handleTicketCreated,
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
      if (source) queryParams.set('source', source);

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
  }, [token, statusFilter, priorityFilter, assignedFilter, source]);

  // Kept current so the socket handler (declared earlier) always calls the
  // latest filter-aware loader.
  loadTicketsRef.current = loadTickets;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Mobile master-detail: clear the open conversation to return to the list.
  // The join/leave effect handles leaving the socket room when this goes null.
  const handleBackToList = () => {
    setSelectedTicket(null);
  };

  const [profanityWarning, setProfanityWarning] = useState<string | null>(null);

  /** Returns the stored URL, or null after surfacing the failure via setError. */
  const uploadPendingImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch('/api/support/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (data.success && data.data?.url) return data.data.url;
    setError(data.message || 'Could not send the photo. Please try again.');
    return null;
  };

  const clearComposer = () => {
    setNewMessage('');
    setIsInternal(false);
    setPendingImage(null);
  };

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if ((!content && !pendingImage) || !selectedTicket) return;

    // Client-side profanity check
    const { hasProfanity } = checkProfanity(content);
    if (hasProfanity) {
      setProfanityWarning('Please use respectful language. Offensive words are not allowed on Thulo Bazaar.');
      setTimeout(() => setProfanityWarning(null), 5000);
      return;
    }
    setProfanityWarning(null);

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      let attachmentUrl: string | null = null;
      if (pendingImage) {
        attachmentUrl = await uploadPendingImage(pendingImage);
        if (!attachmentUrl) return;
      }

      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, content, isInternal, attachmentUrl);
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
          clearComposer();

          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          return;
        }
        // The photo quota is a definitive answer, not a transport hiccup —
        // retrying over HTTP would only hit the same limit.
        if (result.code === SUPPORT_IMAGE_LIMIT_CODE) {
          setError(result.error || 'Photo limit reached. Please wait a few minutes.');
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
          content,
          isInternal,
          ...(attachmentUrl ? { attachmentUrl } : {}),
        }),
      });
      const data = await response.json();
      if (data.success) {
        clearComposer();
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
    handleBackToList,
    handleSendMessage,
    handleUpdateTicket,
    handleMessageInputChange,
    profanityWarning,
    setProfanityWarning,
    pendingImage,
    pendingImagePreview,
    handleAttachImage,
    handleRemoveImage,
  };
}
