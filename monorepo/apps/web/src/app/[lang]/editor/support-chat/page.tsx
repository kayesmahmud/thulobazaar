'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getEditorNavSections } from '@/lib/editorNavigation';

interface SupportTicket {
  id: number;
  ticketNumber: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface Message {
  id: number;
  sender: string;
  senderType: 'user' | 'editor';
  content: string;
  timestamp: string;
  attachments?: string[];
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent';

export default function SupportChatPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 1,
      ticketNumber: 'TKT-2024-001',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      subject: 'Unable to post ad',
      category: 'technical',
      priority: 'high',
      status: 'open',
      lastMessage: 'I am getting an error when trying to upload images to my ad.',
      messageCount: 3,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      ticketNumber: 'TKT-2024-002',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      subject: 'Account verification issue',
      category: 'verification',
      priority: 'medium',
      status: 'in_progress',
      lastMessage: 'My business verification has been pending for 3 days.',
      messageCount: 5,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      assignedTo: 'Editor Admin',
    },
    {
      id: 3,
      ticketNumber: 'TKT-2024-003',
      userName: 'Mike Johnson',
      userEmail: 'mike@example.com',
      subject: 'Payment not processed',
      category: 'billing',
      priority: 'urgent',
      status: 'open',
      lastMessage: 'I paid for ad promotion but it is not showing as promoted.',
      messageCount: 2,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      ticketNumber: 'TKT-2024-004',
      userName: 'Sarah Williams',
      userEmail: 'sarah@example.com',
      subject: 'How to delete my account?',
      category: 'account',
      priority: 'low',
      status: 'resolved',
      lastMessage: 'Thank you for the help!',
      messageCount: 4,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      assignedTo: 'Editor Admin',
    },
    {
      id: 5,
      ticketNumber: 'TKT-2024-005',
      userName: 'David Brown',
      userEmail: 'david@example.com',
      subject: 'Suspicious ad reported',
      category: 'safety',
      priority: 'high',
      status: 'in_progress',
      lastMessage: 'I found a scam ad and want to report it.',
      messageCount: 6,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      assignedTo: 'Editor User',
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${params.lang}/editor/login`);
  }, [logout, router, params.lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${params.lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, params.lang, router]);

  const loadMessages = (ticketId: number) => {
    // Mock messages - in a real app, this would fetch from API
    const mockMessages: Message[] = [
      {
        id: 1,
        sender: tickets.find((t) => t.id === ticketId)?.userName || 'User',
        senderType: 'user',
        content: tickets.find((t) => t.id === ticketId)?.lastMessage || '',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        sender: 'Support Team',
        senderType: 'editor',
        content: 'Thank you for contacting us. We are looking into your issue.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        sender: tickets.find((t) => t.id === ticketId)?.userName || 'User',
        senderType: 'user',
        content: 'Any update on this?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];
    setMessages(mockMessages);
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;

    const message: Message = {
      id: messages.length + 1,
      sender: staff?.fullName || 'Editor',
      senderType: 'editor',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Update ticket's last message and status
    const updatedTickets = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            lastMessage: newMessage,
            messageCount: t.messageCount + 1,
            status: t.status === 'open' ? 'in_progress' : t.status,
            assignedTo: staff?.fullName,
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    setTickets(updatedTickets);
    setSelectedTicket({
      ...selectedTicket,
      lastMessage: newMessage,
      messageCount: selectedTicket.messageCount + 1,
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
      assignedTo: staff?.fullName,
      updatedAt: new Date().toISOString(),
    });

    alert('Message sent successfully!');
  };

  const handleUpdateStatus = (status: SupportTicket['status']) => {
    if (!selectedTicket) return;

    const updatedTickets = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, status, updatedAt: new Date().toISOString() } : t
    );
    setTickets(updatedTickets);
    setSelectedTicket({ ...selectedTicket, status, updatedAt: new Date().toISOString() });
    alert(`Ticket status updated to ${status}`);
  };

  const handleUpdatePriority = (priority: SupportTicket['priority']) => {
    if (!selectedTicket) return;

    const updatedTickets = tickets.map((t) =>
      t.id === selectedTicket.id ? { ...t, priority, updatedAt: new Date().toISOString() } : t
    );
    setTickets(updatedTickets);
    setSelectedTicket({ ...selectedTicket, priority, updatedAt: new Date().toISOString() });
    alert(`Ticket priority updated to ${priority}`);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesSearch =
      !searchTerm ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      technical: '🔧',
      verification: '✅',
      billing: '💳',
      account: '👤',
      safety: '🛡️',
      general: '💬',
    };
    return icons[category] || '💬';
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-4xl text-white">⏳</span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-700">Loading support chat...</div>
          </div>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Open Tickets</div>
                <div className="text-3xl font-bold text-blue-900">
                  {tickets.filter((t) => t.status === 'open').length}
                </div>
              </div>
              <div className="text-4xl">📬</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-yellow-700 mb-1">In Progress</div>
                <div className="text-3xl font-bold text-yellow-900">
                  {tickets.filter((t) => t.status === 'in_progress').length}
                </div>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-700 mb-1">Urgent</div>
                <div className="text-3xl font-bold text-red-900">
                  {tickets.filter((t) => t.priority === 'urgent').length}
                </div>
              </div>
              <div className="text-4xl">🚨</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-700 mb-1">Resolved Today</div>
                <div className="text-3xl font-bold text-green-900">
                  {tickets.filter((t) => t.status === 'resolved').length}
                </div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by ticket #, subject, or user..."
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
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Tickets ({filteredTickets.length})
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {filteredTickets.length === 0 ? (
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
                        <span className="text-xl">{getCategoryIcon(ticket.category)}</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {ticket.subject}
                          </div>
                          <div className="text-xs text-gray-500">{ticket.ticketNumber}</div>
                        </div>
                      </div>
                      {ticket.messageCount > 0 && (
                        <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                          {ticket.messageCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2 line-clamp-1">
                      {ticket.userName} • {ticket.userEmail}
                    </div>
                    <div className="text-xs text-gray-500 mb-2 line-clamp-2">
                      {ticket.lastMessage}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                          ticket.status
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {getTimeAgo(ticket.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {selectedTicket.userName} • {selectedTicket.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{selectedTicket.ticketNumber}</div>
                      <div className="text-xs text-gray-500">
                        Created {getTimeAgo(selectedTicket.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        handleUpdateStatus(e.target.value as SupportTicket['status'])
                      }
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={selectedTicket.priority}
                      onChange={(e) =>
                        handleUpdatePriority(e.target.value as SupportTicket['priority'])
                      }
                      className="text-xs px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {selectedTicket.assignedTo && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                        Assigned: {selectedTicket.assignedTo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="p-4 overflow-y-auto h-[400px] bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.senderType === 'editor' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderType === 'editor'
                            ? 'bg-teal-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="text-xs font-semibold mb-1 opacity-80">
                          {message.sender}
                        </div>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
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
