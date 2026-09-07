'use client';

/**
 * Editor Live Chat queue.
 *
 * Same machinery as Support Chat, filtered to source='live_chat'. The AI
 * answers these first and pings editors only when it cannot help, so a
 * conversation showing up here usually means a human is actually needed.
 * Live Chat has no user-visible status workflow, so the status/priority
 * filters and stats cards are deliberately left out.
 */

import { use, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
import { markSectionSeen } from '@/lib/editorApi';
import {
  useSupportChatPage,
  TicketsList,
  ChatArea,
} from '../support-chat/components';

export default function EditorLiveChatPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);

  const {
    staff,
    authLoading,
    handleLogout,
    filteredTickets,
    selectedTicket,
    loading,
    error,
    setError,
    newMessage,
    isInternal,
    setIsInternal,
    sendingMessage,
    isOtherTyping,
    typingUserName,
    messagesEndRef,
    isConnected,
    handleSelectTicket,
    handleBackToList,
    handleSendMessage,
    handleUpdateTicket,
    handleMessageInputChange,
    profanityWarning,
    setProfanityWarning,
    pendingImagePreview,
    handleAttachImage,
    handleRemoveImage,
  } = useSupportChatPage(params.lang, 'live_chat');

  const markedSeen = useRef(false);
  useEffect(() => {
    if (authLoading || !staff || markedSeen.current) return;
    markedSeen.current = true;
    markSectionSeen('support_chat').catch(() => {});
  }, [authLoading, staff]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-4xl text-white">🎧</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading live chat...</div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName || 'Editor User'}
      userEmail={staff?.email || 'editor@thulobazaar.com.np'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${selectedTicket ? 'hidden lg:flex' : ''}`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Live Chat</h1>
            <p className="text-gray-600 mt-1">
              Conversations the AI assistant could not finish — reply and the user sees it instantly
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 ${selectedTicket ? 'hidden lg:block' : ''}`}>
            <TicketsList
              tickets={filteredTickets}
              selectedTicket={selectedTicket}
              loading={loading}
              onSelectTicket={handleSelectTicket}
            />
          </div>

          <div className={`lg:col-span-2 ${selectedTicket ? '' : 'hidden lg:block'}`}>
            <ChatArea
              selectedTicket={selectedTicket}
              isConnected={isConnected}
              isOtherTyping={isOtherTyping}
              typingUserName={typingUserName}
              messagesEndRef={messagesEndRef}
              newMessage={newMessage}
              isInternal={isInternal}
              setIsInternal={setIsInternal}
              sendingMessage={sendingMessage}
              staffId={staff?.id}
              onUpdateTicket={handleUpdateTicket}
              onMessageInputChange={handleMessageInputChange}
              onSendMessage={handleSendMessage}
              profanityWarning={profanityWarning}
              onDismissProfanityWarning={() => setProfanityWarning(null)}
              pendingImagePreview={pendingImagePreview}
              onAttachImage={handleAttachImage}
              onRemoveImage={handleRemoveImage}
              onBack={handleBackToList}
              showStatusControl={false}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
