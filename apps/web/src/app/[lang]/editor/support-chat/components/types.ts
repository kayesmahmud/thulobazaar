export interface SupportTicket {
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

export interface TicketMessage {
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

export interface TicketDetail extends SupportTicket {
  messages: TicketMessage[];
  isStaff: boolean;
}

export type StatusFilter = 'all' | 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
export type PriorityFilter = 'all' | 'low' | 'normal' | 'high' | 'urgent';

export const STATUS_BADGES: Record<string, string> = {
  open: 'bg-green-100 text-green-800 border-green-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  waiting_on_user: 'bg-purple-100 text-purple-800 border-purple-200',
  resolved: 'bg-blue-100 text-blue-800 border-blue-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const PRIORITY_BADGES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export const CATEGORY_ICONS: Record<string, string> = {
  general: '💬',
  account: '👤',
  payment: '💳',
  ads: '📢',
  verification: '✅',
  technical: '🔧',
  report: '🚨',
  other: '📋',
};

export interface TicketStats {
  open: number;
  inProgress: number;
  urgent: number;
  resolved: number;
}
