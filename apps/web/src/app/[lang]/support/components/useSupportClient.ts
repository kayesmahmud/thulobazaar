'use client';

import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/hooks/useBackendToken';
import { checkProfanity } from '@/utils/profanityCheck';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { SUPPORT_IMAGE_LIMIT_CODE, SUPPORT_IMAGE_MAX_BYTES } from '@/lib/supportAttachmentDisplay';
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
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileUpload: (file: File) => Promise<void>;
  sendingFile: boolean;
  isInternal: boolean;
  setIsInternal: (isInternal: boolean) => void;
  macros: { id: number; title: string; content: string; }[];
  handleSubmitCsat: (ticketId: number, score: number, comment?: string) => Promise<void>;
  profanityWarning: string | null;
  setProfanityWarning: (warning: string | null) => void;
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
  const [sendingFile, setSendingFile] = useState(false);

  // Typing indicator state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Internal note state
  const [isInternal, setIsInternal] = useState(false);

  // Macros state
  const [macros, setMacros] = useState<{ id: number; title: string; content: string; }[]>([]);

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: { ticketId: number; message: any; newStatus?: string }) => {
    if (selectedTicket && data.ticketId === selectedTicket.id) {
      const currentUserId = (session?.user as any)?.id;
      const isOwn = data.message.senderId === currentUserId || data.message.senderId === parseInt(currentUserId as string);

      setSelectedTicket((prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return {
          ...prev,
          status: data.newStatus || prev.status,
          messages: [...prev.messages, { ...data.message, isOwnMessage: isOwn }],
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
  }, [selectedTicket, session]);

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
      // Filter out own typing events to avoid showing "Support Team is typing" when user types
      // (if backend broadcasts to all)
      const currentUserId = (session?.user as any)?.id;
      if (currentUserId && (data.userId === currentUserId || data.userId === parseInt(currentUserId as string))) {
        return;
      }

      setIsOtherTyping(data.isTyping);
      if (data.isTyping) {
        setTypingUser('Support Team');
      } else {
        setTypingUser(null);
      }
    }
  }, [selectedTicket, session]);

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
    // This page is also a staff surface (staff see every ticket and can write
    // internal notes). Internal notes are broadcast only to the staff room, so
    // hardcoding false hid other editors' notes until a reload.
    isStaff: !!session?.user && (session.user as any).role !== 'user',
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
    } catch (err) {
      console.error('Load tickets error:', err);
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadMacros = async () => {
    // Only load if staff
    if (session?.user && (session.user as any).role !== 'user') {
      try {
        const response = await fetch('/api/support/macros', {
          headers: {
            Authorization: `Bearer ${backendToken}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setMacros(data.data);
        }
      } catch (err) {
        console.error('Load macros error:', err);
      }
    }
  };

  useEffect(() => {
    if (!backendToken) return;
    loadMacros();
  }, [backendToken, session?.user]);

  const loadTicketDetail = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Map messages to manually check isOwnMessage
        const ticket = data.data;
        if (session?.user && ticket.messages) {
          // We need to cast session.user to any or appropriate type if id is not on standard User type
          // Typically NextAuth session.user has id.
          const currentUserId = (session.user as any).id;
          ticket.messages = ticket.messages.map((msg: any) => ({
            ...msg,
            isOwnMessage: msg.senderId === currentUserId || msg.senderId === parseInt(currentUserId as string)
          }));
        }
        setSelectedTicket(ticket);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Load ticket detail error:', err);
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
    } catch (err) {
      console.error('Create ticket error:', err);
      setError('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedTicket) return;
    if (file.size > SUPPORT_IMAGE_MAX_BYTES) {
      setError('Photo must be smaller than 5 MB.');
      return;
    }

    try {
      setSendingFile(true);
      setError(null);
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetch('/api/support/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${backendToken}`,
        },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        // The server's quota message is the one worth showing verbatim.
        throw new Error(uploadData.message || 'Could not send the photo. Please try again.');
      }

      const attachmentUrl: string = uploadData.data.url;

      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, '', isInternal, attachmentUrl);
        if (result.success && result.message) {
          setSelectedTicket((prev) => {
            if (!prev || prev.messages.some((m) => m.id === result.message!.id)) return prev;
            return { ...prev, messages: [...prev.messages, { ...result.message!, isOwnMessage: true }] };
          });
          setIsInternal(false);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          return;
        }
        if (result.code === SUPPORT_IMAGE_LIMIT_CODE) {
          throw new Error(result.error || 'Photo limit reached. Please wait a few minutes.');
        }
      }

      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({ content: '', attachmentUrl, isInternal }),
      });
      const data = await response.json();
      if (data.success) {
        loadTicketDetail(selectedTicket.id);
        setIsInternal(false);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Could not send the photo. Please try again.');
    } finally {
      setSendingFile(false);
    }
  };

  const [profanityWarning, setProfanityWarning] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTicket) return;

    // Client-side profanity check
    const { hasProfanity } = checkProfanity(messageInput.trim());
    if (hasProfanity) {
      setProfanityWarning('Please use respectful language. Offensive words are not allowed on Thulo Bazaar.');
      setTimeout(() => setProfanityWarning(null), 5000);
      return;
    }
    setProfanityWarning(null);

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, messageInput, isInternal);
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
          setIsInternal(false); // Reset internal flag after sending

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
        body: JSON.stringify({ content: messageInput, isInternal }),
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        setIsInternal(false); // Reset internal flag after sending
        loadTicketDetail(selectedTicket.id);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitCsat = async (ticketId: number, score: number, comment?: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}/csat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({ score, comment }),
      });
      const data = await response.json();
      if (data.success) {
        // Reload ticket detail to reflect the submitted score
        loadTicketDetail(ticketId);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Submit CSAT error:', err);
      setError('Failed to submit rating');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    handleFileUpload,
    sendingFile,
    isInternal,
    setIsInternal,
    macros,
    handleSubmitCsat,
    profanityWarning,
    setProfanityWarning,
  };
}
