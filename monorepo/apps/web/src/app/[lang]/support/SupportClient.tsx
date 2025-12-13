'use client';

import { useRouter } from 'next/navigation';
import {
  useSupportClient,
  TicketsList,
  TicketChat,
  NewTicketModal,
} from './components';

export default function SupportClient() {
  const router = useRouter();
  const {
    sessionStatus,
    tokenLoading,
    hasSession,
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
  } = useSupportClient();

  // Auth check
  if (sessionStatus === 'loading' || tokenLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to access support.</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-600 mt-1">Get help with your questions and issues</p>
          </div>
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Support Request
          </button>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Tickets List */}
          <TicketsList
            tickets={tickets}
            selectedTicket={selectedTicket}
            loading={loading}
            onSelectTicket={loadTicketDetail}
          />

          {/* Chat Window */}
          <div className={`${!selectedTicket ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-lg shadow`}>
            <TicketChat
              selectedTicket={selectedTicket}
              isConnected={isConnected}
              isOtherTyping={isOtherTyping}
              typingUser={typingUser}
              messageInput={messageInput}
              sendingMessage={sendingMessage}
              messagesEndRef={messagesEndRef}
              onClose={() => setSelectedTicket(null)}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      <NewTicketModal
        show={showNewTicketForm}
        newTicket={newTicket}
        setNewTicket={setNewTicket}
        submitting={submitting}
        onClose={() => setShowNewTicketForm(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
