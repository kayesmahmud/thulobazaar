/**
 * MessagesPage Component - 2025 Best Practices
 * Complete messaging interface with conversations and chat
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useMessages } from '@/hooks/useSocket';
import { useBackendToken } from '@/hooks/useBackendToken';
import { messagingApi, announcementsApi } from '@/lib/messagingApi';
import { formatFullDate } from '@/types/messaging';
import type { Announcement } from '@/types/messaging';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import AnnouncementsList from './AnnouncementsList';

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // Use the new useBackendToken hook that bypasses NextAuth session issues
  const { backendToken, loading: tokenLoading, error: tokenError } = useBackendToken();
  const token = backendToken;

  // CRITICAL: Log session and token for debugging
  console.log('💬 [MessagesPage] Session status:', !!session);
  console.log('💬 [MessagesPage] Backend token:', token ? `Present (${token.substring(0, 20)}...)` : 'NULL/UNDEFINED');
  console.log('💬 [MessagesPage] Token loading:', tokenLoading);
  console.log('💬 [MessagesPage] Token error:', tokenError);
  console.log('💬 [MessagesPage] User email:', session?.user?.email);

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state for switching between conversations and announcements
  const [activeTab, setActiveTab] = useState<'conversations' | 'announcements'>('conversations');
  const [announcementUnreadCount, setAnnouncementUnreadCount] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // ✅ 2025 Best Practice: Store conversation messages separately
  // Combines API-loaded history with real-time Socket.IO messages
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);

  // Socket.IO connection (optional - works without when backend not available)
  const {
    connected,
    error: socketError,
    messages,
    typingUsers,
    sendMessage: socketSendMessage,
    markAsRead: socketMarkAsRead,
    startTyping,
    stopTyping,
    socket,
  } = useMessages(token);

  // REST API fallback for sending messages when Socket.IO not available
  const sendMessageViaApi = async (conversationId: number, content: string) => {
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
  };

  // Use Socket.IO if connected, otherwise use REST API
  const sendMessage = connected ? socketSendMessage : sendMessageViaApi;
  const markAsRead = connected ? socketMarkAsRead : async () => {}; // No-op for REST (read marking happens on GET)

  // Load conversations on mount
  useEffect(() => {
    if (!token) return;

    loadConversations();
  }, [token]);

  // Load announcement unread count on mount (so badge shows immediately)
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

  // Auto-select conversation from URL query parameter
  useEffect(() => {
    const conversationId = searchParams?.get('conversation');

    if (!conversationId || conversations.length === 0 || !token) return;

    // Find conversation by ID
    const conversation = conversations.find((c) => c.id === parseInt(conversationId));

    if (conversation && (!selectedConversation || selectedConversation.id !== conversation.id)) {
      console.log('🔗 Auto-selecting conversation from URL:', conversationId);
      handleSelectConversation(conversation);
    }
  }, [searchParams, conversations, token]);

  // ✅ 2025 Best Practice: Listen for conversation updates in real-time
  // This ensures conversation list stays in sync when messages are sent/received
  // NOTE: We use `connected` as dependency because `socket` is a ref that doesn't trigger re-renders
  // Also include `selectedConversation?.id` to properly track which conversation is being viewed
  useEffect(() => {
    if (!socket || !connected) {
      console.log('⚠️ [MessagesPage] Socket not available/connected for conversation:updated listener');
      return;
    }

    console.log('✅ [MessagesPage] Setting up conversation:updated listener on socket:', socket.id);
    const currentlyViewingId = selectedConversation?.id;

    const handleConversationUpdated = (data: any) => {
      console.log('💬 [MessagesPage] conversation:updated received:', data);
      console.log('💬 [MessagesPage] Currently viewing conversation:', currentlyViewingId);

      // Update the specific conversation in the list (without reloading all)
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.id === data.conversationId) {
            // If this is the currently selected conversation, don't increment unread count
            // The user is already viewing it
            const isCurrentlyViewing = currentlyViewingId === data.conversationId;
            console.log('✅ [MessagesPage] Updating conversation:', conv.id, 'isViewing:', isCurrentlyViewing);

            return {
              ...conv,
              lastMessage: data.lastMessage,
              last_message: data.lastMessage, // Support both naming conventions
              last_message_at: data.timestamp,
              lastMessageAt: data.timestamp,
              // Clear unread count if user is viewing this conversation, otherwise increment
              unreadCount: isCurrentlyViewing ? 0 : (conv.unreadCount || 0) + 1,
              unread_count: isCurrentlyViewing ? 0 : (conv.unread_count || 0) + 1,
            };
          }
          return conv;
        });

        // Sort by most recent message first
        return updatedConversations.sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || a.last_message_at || 0).getTime();
          const dateB = new Date(b.lastMessageAt || b.last_message_at || 0).getTime();
          return dateB - dateA;
        });
      });
    };

    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      console.log('🧹 [MessagesPage] Cleaning up conversation:updated listener');
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, connected, selectedConversation?.id]);

  // ✅ 2025 Best Practice: Merge real-time messages with historical messages
  // This is the CRITICAL fix - append Socket.IO messages to API-loaded history
  useEffect(() => {
    if (!socket || !connected || !selectedConversation) return;

    const handleNewMessage = (messageData: any) => {
      console.log('📨 New real-time message received:', messageData);

      // Only add if it's for the current conversation
      if (messageData.conversationId === selectedConversation.id) {
        setConversationMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((msg) => msg.id === messageData.id);
          if (exists) return prev;

          // Append new message
          return [...prev, messageData];
        });
      }
    };

    socket.on('message:new', handleNewMessage);

    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, connected, selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagingApi.getConversations(token || '');
      setConversations(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: any) => {
    try {
      setSelectedConversation(conversation);

      // ✅ 2025 Best Practice: Load historical messages via REST API
      const response = await messagingApi.getConversation(token || '', conversation.id);

      // API returns flat structure - data contains conversation with embedded messages
      const conversationData = response.data;
      setSelectedConversation(conversationData);

      // Set historical messages (REST API)
      if (conversationData.messages) {
        console.log('📚 Loaded historical messages:', conversationData.messages.length);
        console.log('📋 Sample message data:', conversationData.messages[0]);
        setConversationMessages(conversationData.messages);
      } else {
        setConversationMessages([]);
      }

      // Mark as read (handled server-side when fetching conversation)
      await markAsRead(conversation.id);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setError(err.message);
    }
  };

  const handleSendMessage = async (content: string, type: string = 'text', attachmentUrl?: string) => {
    if (!selectedConversation) return;

    try {
      // For image messages, we need to send via REST API if Socket.IO doesn't support attachments
      if (type === 'image' && attachmentUrl) {
        // Send image message via REST API
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
        // Send text message via Socket.IO or REST API
        const result = await sendMessage(selectedConversation.id, content);

        // When using REST API, add the message to the local state
        if (!connected && result?.data) {
          setConversationMessages((prev) => [...prev, result.data]);
        }
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.message);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to access messages.</p>
      </div>
    );
  }

  // Show loading state while token is being fetched
  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600">Loading messaging system...</p>
        </div>
      </div>
    );
  }

  // Show error if token fetch failed
  if (tokenError || (!token && !tokenLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Messaging</h2>
          <p className="text-gray-600 mb-6">
            {tokenError || 'Failed to fetch authentication token. Please try logging out and back in.'}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Log Out and Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if real-time messaging is configured
  const isRealtimeConfigured = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Connection status - only show if real-time is configured but failing */}
      {isRealtimeConfigured && !connected && socketError && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800 text-center z-50">
          Real-time updates unavailable. Messages will sync on refresh.
        </div>
      )}

      {/* Sidebar - Responsive */}
      <div className={`${
        selectedConversation || selectedAnnouncement ? 'hidden md:flex' : 'flex'
      } w-full md:w-1/3 lg:w-1/4 xl:w-1/5 border-r border-gray-200 bg-white flex-shrink-0 flex-col`}>
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => {
              setActiveTab('announcements');
              setSelectedConversation(null);
            }}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'announcements'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Announcements
            {announcementUnreadCount > 0 && (
              <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {announcementUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'conversations' ? (
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              loading={loading}
              currentUserId={session?.user?.id ? parseInt(session.user.id) : undefined}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <AnnouncementsList
                token={token}
                onUnreadCountChange={setAnnouncementUnreadCount}
                onSelectAnnouncement={setSelectedAnnouncement}
                selectedAnnouncementId={selectedAnnouncement?.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat Window / Announcement Detail - Responsive */}
      <div className={`${
        selectedConversation || selectedAnnouncement ? 'flex' : 'hidden md:flex'
      } flex-1 flex-col min-w-0`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={conversationMessages}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onStartTyping={() => startTyping(selectedConversation.id)}
            onStopTyping={() => stopTyping(selectedConversation.id)}
            connected={connected}
            currentUserId={session?.user?.id ? parseInt(session.user.id) : undefined}
            onBack={() => setSelectedConversation(null)}
            token={token || undefined}
          />
        ) : selectedAnnouncement ? (
          /* Announcement Detail View */
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900 truncate">
                  {selectedAnnouncement.title}
                </h2>
                <p className="text-xs text-gray-500">
                  ThuluBazaar Announcement
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                {/* Announcement Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {selectedAnnouncement.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedAnnouncement.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedAnnouncement.content}
                    </p>
                  </div>

                  {selectedAnnouncement.isRead && selectedAnnouncement.readAt && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Read on {new Date(selectedAnnouncement.readAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium">
                {activeTab === 'announcements' ? 'Select an announcement' : 'Select a conversation'}
              </p>
              <p className="mt-1 text-sm">
                {activeTab === 'announcements'
                  ? 'Choose an announcement from the list to view details'
                  : 'Choose a conversation from the list to start messaging'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
