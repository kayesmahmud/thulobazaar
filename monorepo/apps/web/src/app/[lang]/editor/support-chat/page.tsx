'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { getEditorNavSections } from '@/lib/navigation';
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
    handleSendMessage,
    handleUpdateTicket,
    handleMessageInputChange,
  } = useSupportChatPage(params.lang);

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
      userEmail={staff?.email || 'editor@thulobazaar.com'}
      navSections={getEditorNavSections(params.lang)}
      theme="editor"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Chat</h1>
            <p className="text-gray-600 mt-1">Manage user support tickets and conversations</p>
          </div>
          <button
            onClick={() => router.push(`/${params.lang}/editor/dashboard`)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Filters */}
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <TicketsList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            loading={loading}
            onSelectTicket={handleSelectTicket}
          />

          {/* Chat Area */}
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
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
