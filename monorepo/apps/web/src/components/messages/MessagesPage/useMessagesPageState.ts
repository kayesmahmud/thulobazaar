import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMessages } from '@/hooks/useSocket';
import { messagingApi, announcementsApi } from '@/lib/messaging';
import type { Announcement } from '@/types/messaging';
import type { TabType } from './types';

interface UseMessagesPageStateProps {
  token: string | null;
}

export function useMessagesPageState({ token }: UseMessagesPageStateProps) {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('conversations');
  const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Conversation messages
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Socket.IO connection
  const {
    connected,
    error: socketError,
    typingUsers,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    startTyping,
    stopTyping,
    socket,
  } = useMessages(token);

  // REST API fallback for sending messages
  const sendMessageViaApi = useCallback(async (conversationId: number, content: string) => {
    const response = await fetch(`/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to send message');
    }

    return response.json();
  }, [token]);

  const sendMessage = connected ? socketSendMessage : sendMessageViaApi;
  const markAsRead = connected ? socketMarkAsRead : async () => {};

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await messagingApi.getConversations(token);
      setConversations(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load conversations on mount
  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [token, loadConversations]);

  // Load announcement unread count
  useEffect(() => {
    if (!token) return;

    const fetchAnnouncementUnreadCount = async () => {
      try {
        const result = await announcementsApi.getUnreadCount(token);
        if (result.success) {
          setAnnouncementUnreadCount(result.unreadCount);
        }
      } catch (err) {
        console.error('Failed to fetch announcement unread count:', err);
      }
    };

    fetchAnnouncementUnreadCount();
  }, [token]);

  // Auto-select conversation from URL
  useEffect(() => {
    const conversationId = searchParams?.get('conversation');
    if (!conversationId || conversations.length === 0 || !token) return;

    const conversation = conversations.find((c) => c.id === parseInt(conversationId));
    if (conversation && (!selectedConversation || selectedConversation.id !== conversation.id)) {
      console.log('Auto-selecting conversation from URL:', conversationId);
      handleSelectConversation(conversation);
    }
  }, [searchParams, conversations, token]);

  // Socket.IO: Listen for conversation updates
  useEffect(() => {
    if (!socket || !connected) return;

    const currentlyViewingId = selectedConversation?.id;

    const handleConversationUpdated = (data: any) => {
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.id === data.conversationId) {
            const isCurrentlyViewing = currentlyViewingId === data.conversationId;
            return {
              ...conv,
              lastMessage: data.lastMessage,
              last_message: data.lastMessage,
              last_message_at: data.timestamp,
              lastMessageAt: data.timestamp,
              unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1,
              unread_count: isCurrentlyViewing ? 0 : (conv.unread_count || 0) + 1,
            };
          }
          return conv;
        });

        return updatedConversations.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || a.last_message_at || 0).getTime();
          const dateB = new Date(b.lastMessageAt || b.last_message_at || 0).getTime();
          return dateB - dateA;
        });
      });
    };

    socket.on('conversation:updated', handleConversationUpdated);
    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, connected, selectedConversation?.id]);

  // Socket.IO: Listen for new messages
  useEffect(() => {
    if (!socket || !connected || !selectedConversation) return;

    const handleNewMessage = (messageData: any) => {
      if (messageData.conversationId === selectedConversation.id) {
        setConversationMessages((prev) => {
          const exists = prev.some((msg) => msg.id === messageData.id);
          if (exists) return prev;
          return [...prev, messageData];
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, connected, selectedConversation]);

  // Select conversation handler
  const handleSelectConversation = useCallback(async (conversation: any) => {
    if (!token) return;
    try {
      setSelectedConversation(conversation);

      const response = await messagingApi.getConversation(token, conversation.id);
      const conversationData = response.data;
      setSelectedConversation(conversationData);

      if (conversationData.messages) {
        setConversationMessages(conversationData.messages);
      } else {
        setConversationMessages([]);
      }

      await markAsRead(conversation.id);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setError(err.message);
    }
  }, [token, markAsRead]);

  // Send message handler
  const handleSendMessage = useCallback(async (content: string, type: string = 'text', attachmentUrl?: string) => {
    if (!selectedConversation || !token) return;

    try {
      if (type === 'image' && attachmentUrl) {
        const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content, type, attachmentUrl }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to send image message');
        }

        const result = await response.json();
        if (result?.data) {
          setConversationMessages((prev) => [...prev, result.data]);
        }
      } else {
        const result = await sendMessage(selectedConversation.id, content);
        if (!connected && result?.data) {
          setConversationMessages((prev) => [...prev, result.data]);
        }
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message);
    }
  }, [selectedConversation, token, sendMessage, connected]);

  // Tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'announcements') {
      setSelectedConversation(null);
    }
  }, []);

  // Clear selection handlers
  const clearSelectedConversation = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const clearSelectedAnnouncement = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversations,
    selectedConversation,
    loading,
    error,
    activeTab,
    announcementUnreadCount,
    selectedAnnouncement,
    conversationMessages,
    connected,
    socketError,
    typingUsers,

    // Handlers
    handleSelectConversation,
    handleSendMessage,
    handleTabChange,
    setAnnouncementUnreadCount,
    setSelectedAnnouncement,
    clearSelectedConversation,
    clearSelectedAnnouncement,
    clearError,
    startTyping,
    stopTyping,
  };
}
