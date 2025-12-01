'use client';

import { useEffect, useState, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicket {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
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

interface TicketDetail extends SupportTicket {
  messages: TicketMessage[];
  isStaff: boolean;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';

const STATUS_BADGES: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_on_user: 'bg-purple-100 text-purple-800 border-purple-200',
  resolved: 'bg-blue-100 text-blue-800 border-blue-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PRIORITY_BADGES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const CATEGORY_ICONS: Record<string, string> = {
  general: '💬',
  account: '👤',
  payment: '💳',
  ads: '📢',
  verification: '✅',
  technical: '🔧',
  report: '🚨',
  other: '📋',
};

export default function SupportChatPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
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

  // Real-time state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUserName, setTypingUserName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Socket event handlers
  const handleNewMessage = useCallback((data: { ticketId: number; message: any; newStatus?: string }) => {
    // Update selected ticket messages
    if (selectedTicket && data.ticketId === selectedTicket.id) {
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

    // Update tickets list
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
    // Update tickets list with new status/priority/assignment
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
    // Update selected ticket
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

    // Update tickets list
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
    onTyping: handleTyping,
  });

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, params.lang, router]);

  // Load tickets
  useEffect(() => {
    if (!token) return;
    loadTickets();
  }, [token, statusFilter, priorityFilter, assignedFilter]);

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
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (priorityFilter !== 'all') queryParams.set('priority', priorityFilter);
      if (assignedFilter !== 'all') queryParams.set('assigned', assignedFilter);

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
  };

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      stopTyping(selectedTicket.id);

      // Try socket first for real-time
      if (isConnected) {
        const result = await sendSocketMessage(selectedTicket.id, newMessage, isInternal);
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
          setNewMessage('');
          setIsInternal(false);

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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          isInternal,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setIsInternal(false);
        loadTicketDetail(selectedTicket.id);
        loadTickets(); // Refresh list
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
      // Try socket first for real-time
      if (isConnected) {
        const result = await updateSocketTicket(selectedTicket.id, updates);
        if (result.success) {
          // Local state already updated via socket event
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

  // Handle typing while user types
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
  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    urgent: tickets.filter((t) => t.priority === 'urgent').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">Open</div>
                <div className="text-3xl font-bold text-green-900">{stats.open}</div>
              </div>
              <div className="text-4xl">📬</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700 mb-1">In Progress</div>
                <div className="text-3xl font-bold text-yellow-900">{stats.inProgress}</div>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Urgent</div>
                <div className="text-3xl font-bold text-red-900">{stats.urgent}</div>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Resolved</div>
                <div className="text-3xl font-bold text-blue-900">{stats.resolved}</div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_on_user">Waiting on User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Tickets</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">Tickets ({filteredTickets.length})</h3>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>No tickets found</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{CATEGORY_ICONS[ticket.category] || '💬'}</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm line-clamp-1">{ticket.subject}</div>
                          <div className="text-xs text-gray-500">{ticket.ticketNumber}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{ticket.user.fullName}</div>
                    {ticket.lastMessage && (
                      <div className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.lastMessage.content}</div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${STATUS_BADGES[ticket.status]}`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${PRIORITY_BADGES[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedTicket.user.fullName} • {selectedTicket.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{selectedTicket.ticketNumber}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_on_user">Waiting on User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {selectedTicket.assignedTo ? (
                      <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        Assigned: {selectedTicket.assignedTo.fullName}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleUpdateTicket({ assignedTo: staff?.id })}
                        className="text-xs bg-teal-100 text-teal-800 px-3 py-1 rounded-full hover:bg-teal-200"
                      >
                        Assign to Me
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-[400px] max-h-[500px]">
                  {selectedTicket.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isInternal
                            ? 'bg-yellow-100 border border-yellow-300 text-gray-900'
                            : message.isOwnMessage
                            ? 'bg-teal-500 text-white'
                            : message.sender.isStaff
                            ? 'bg-blue-100 text-gray-900'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold opacity-80">{message.sender.fullName}</span>
                          {message.sender.isStaff && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">Staff</span>
                          )}
                          {message.isInternal && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-1 rounded">Internal</span>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isOtherTyping && typingUserName && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{typingUserName} is typing</span>
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
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        Internal Note (not visible to user)
                      </label>
                      {isConnected && (
                        <span className="ml-auto text-xs text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={newMessage}
                        onChange={handleMessageInputChange}
                        placeholder={isInternal ? 'Add internal note...' : 'Type your message...'}
                        rows={3}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[500px]">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Select a ticket to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
