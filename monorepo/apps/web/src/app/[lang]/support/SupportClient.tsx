/**
 * Support Client Component
 * Handles viewing tickets and creating new support requests
 * With real-time Socket.IO support
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useBackendToken } from '@/hooks/useBackendToken';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { formatDistanceToNow } from 'date-fns';

// Ticket categories with labels
const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'account', label: 'Account Issues' },
  { value: 'payment', label: 'Payment & Billing' },
  { value: 'ads', label: 'Ads & Listings' },
  { value: 'verification', label: 'Verification' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'report', label: 'Report a Problem' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_on_user: 'bg-purple-100 text-purple-800',
  resolved: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
};

interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface TicketMessage {
  id: number;
  senderId: number;
  content: string;
  type: string;
  attachmentUrl?: string;
  isInternal: boolean;
  createdAt: string;
  sender: {
    id: number;
    fullName: string;
    avatar?: string;
    isStaff: boolean;
  };
  isOwnMessage: boolean;
}

interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  user: {
    id: number;
    fullName: string;
    email: string;
    avatar?: string;
  };
  assignedTo?: {
    id: number;
    fullName: string;
    avatar?: string;
  };
}

export default function SupportClient() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { backendToken, loading: tokenLoading } = useBackendToken();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket form state
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Chat input state
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Typing indicator state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: { ticketId: number; message: any; newStatus?: string }) => {
    if (selectedTicket && data.ticketId === selectedTicket.id) {
      // Add message to current ticket
      setSelectedTicket((prev) => {
        if (!prev) return prev;
        // Check if message already exists
        if (prev.messages.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return {
          ...prev,
          status: data.newStatus || prev.status,
          messages: [...prev.messages, { ...data.message, isOwnMessage: false }],
        };
      });

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    // Update ticket in list
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
      setIsOtherTyping(data.isTyping);
      if (data.isTyping) {
        setTypingUser('Staff');
      } else {
        setTypingUser(null);
      }
    }
  }, [selectedTicket]);

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
    isStaff: false,
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
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticketId: number) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${backendToken}`,
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
        // Open the newly created ticket
        loadTicketDetail(data.data.id);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      // Try socket first for real-time
      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, messageInput, false);
        if (result.success && result.message) {
          // Add message to local state immediately
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

          // Scroll to bottom
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
          Authorization: `Bearer ${backendToken}`,
        },
        body: JSON.stringify({ content: messageInput }),
      });
      const data = await response.json();
      if (data.success) {
        setMessageInput('');
        // Refresh ticket to get new message
        loadTicketDetail(selectedTicket.id);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing while user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (selectedTicket && e.target.value.trim()) {
      startTyping(selectedTicket.id);
    }
  };

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

  if (!session) {
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
          <div className={`${selectedTicket ? 'hidden lg:block' : ''} lg:w-1/3`}>
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Your Tickets</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p>No tickets yet</p>
                  <p className="text-sm mt-1">Create a new support request to get started</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {tickets.map((ticket) => (
                    <li
                      key={ticket.id}
                      onClick={() => loadTicketDetail(ticket.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500">{ticket.ticketNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ticket.status] || 'bg-gray-100'}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h3>
                      {ticket.lastMessage && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.lastMessage.content}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`${!selectedTicket ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-lg shadow`}>
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{selectedTicket.ticketNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[selectedTicket.status]}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_COLORS[selectedTicket.priority]}`}>
                          {selectedTicket.priority}
                        </span>
                      </div>
                      <h2 className="font-semibold text-gray-900">{selectedTicket.subject}</h2>
                    </div>
                  </div>
                  {selectedTicket.assignedTo && (
                    <div className="text-right text-sm">
                      <p className="text-gray-500">Assigned to</p>
                      <p className="font-medium">{selectedTicket.assignedTo.fullName}</p>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[400px] max-h-[60vh]">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${message.isOwnMessage ? 'order-2' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {!message.isOwnMessage && (
                            <span className={`text-sm font-medium ${message.sender.isStaff ? 'text-blue-600' : 'text-gray-700'}`}>
                              {message.sender.fullName}
                              {message.sender.isStaff && (
                                <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">Staff</span>
                              )}
                            </span>
                          )}
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : message.sender.isStaff
                              ? 'bg-blue-100 text-gray-900'
                              : 'bg-white text-gray-900 border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className={`text-xs mt-1 ${message.isOwnMessage ? 'text-right' : ''} text-gray-500`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isOtherTyping && typingUser && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{typingUser} is typing</span>
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Connection status indicator */}
                {!isConnected && (
                  <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 flex items-center gap-2 text-sm text-yellow-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Connecting to real-time updates...</span>
                  </div>
                )}

                {/* Message Input */}
                {selectedTicket.status !== 'closed' && (
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || sendingMessage}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[400px]">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-lg font-medium">Select a ticket</p>
                  <p className="text-sm mt-1">Choose a ticket from the list or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">New Support Request</h2>
                <button
                  onClick={() => setShowNewTicketForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
