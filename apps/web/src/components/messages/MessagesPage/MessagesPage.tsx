'use client';

import { useSession } from 'next-auth/react';
import { useBackendToken } from '@/hooks/useBackendToken';
import ConversationList from '../ConversationList';
import ChatWindow from '../ChatWindow';
import AnnouncementsList from '../AnnouncementsList';
import { useMessagesPageState } from './useMessagesPageState';
import { AnnouncementDetailView } from './AnnouncementDetailView';
import { EmptyState } from './EmptyState';
import { ErrorToast } from './ErrorToast';
import { NotLoggedInState, TokenLoadingState, TokenErrorState } from './LoadingStates';

export default function MessagesPage() {
  const { data: session } = useSession();
  const { backendToken, loading: tokenLoading, error: tokenError } = useBackendToken();

  const {
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
  } = useMessagesPageState({ token: backendToken });

  // Auth states
  if (!session) {
    return <NotLoggedInState />;
  }

  if (tokenLoading) {
    return <TokenLoadingState />;
  }

  if (tokenError || (!backendToken && !tokenLoading)) {
    return <TokenErrorState error={tokenError} />;
  }

  const isRealtimeConfigured = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_BACKEND_URL;
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : undefined;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Connection status */}
      {isRealtimeConfigured && !connected && socketError && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800 text-center z-50">
          Real-time updates unavailable. Messages will sync on refresh.
        </div>
      )}

      {/* Sidebar */}
      <div className={`${
        selectedConversation || selectedAnnouncement ? 'hidden md:flex' : 'flex'
      } w-full md:w-1/3 lg:w-1/4 xl:w-1/5 border-r border-gray-200 bg-white flex-shrink-0 flex-col`}>
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('conversations')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'conversations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => handleTabChange('announcements')}
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
              currentUserId={currentUserId}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <AnnouncementsList
                token={backendToken}
                onUnreadCountChange={setAnnouncementUnreadCount}
                onSelectAnnouncement={setSelectedAnnouncement}
                selectedAnnouncementId={selectedAnnouncement?.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
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
            currentUserId={currentUserId}
            onBack={clearSelectedConversation}
            token={backendToken || undefined}
          />
        ) : selectedAnnouncement ? (
          <AnnouncementDetailView
            announcement={selectedAnnouncement}
            onBack={clearSelectedAnnouncement}
          />
        ) : (
          <EmptyState activeTab={activeTab} />
        )}
      </div>

      {/* Error Toast */}
      {error && <ErrorToast error={error} onClose={clearError} />}
    </div>
  );
}
