'use client';

import { use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
import { markSectionSeen } from '@/lib/editorApi';
import {
  useSupportChatPage,
  StatsCards,
  TicketFilters,
  TicketsList,
  ChatArea,
} from './components';

export default function SupportChatPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();

  const {
    staff,
    authLoading,
    handleLogout,
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
    pendingImagePreview,
    handleAttachImage,
    handleRemoveImage,
  } = useSupportChatPage(params.lang);

  // Mark this section as seen once per visit → clears the dashboard "Support Chat" badge.
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
            <span className="text-4xl text-white">💬</span>
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading support chat...</div>
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
        {/* On mobile, a selected conversation takes over the screen: the header,
            stats, filters and list collapse so the editor sees only the chat.
            On lg+ everything stays visible side-by-side. */}
        {/* Header */}
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${selectedTicket ? 'hidden lg:flex' : ''}`}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Support Chat</h1>
            <p className="text-gray-600 mt-1">Manage user support tickets and conversations</p>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Stats */}
        <div className={selectedTicket ? 'hidden lg:block' : ''}>
          <StatsCards stats={stats} />
        </div>

        {/* Filters */}
        <div className={selectedTicket ? 'hidden lg:block' : ''}>
          <TicketFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            assignedFilter={assignedFilter}
            setAssignedFilter={setAssignedFilter}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List — hidden on mobile once a conversation is open */}
          <div className={`lg:col-span-1 ${selectedTicket ? 'hidden lg:block' : ''}`}>
            <TicketsList
              tickets={filteredTickets}
              selectedTicket={selectedTicket}
              loading={loading}
              onSelectTicket={handleSelectTicket}
            />
          </div>

          {/* Chat Area — hidden on mobile until a conversation is open */}
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
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
