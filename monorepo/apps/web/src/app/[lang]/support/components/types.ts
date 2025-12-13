export const CATEGORIES = [
  { value: 'general', label: 'General Question' },
  { value: 'account', label: 'Account Issues' },
  { value: 'payment', label: 'Payment & Billing' },
  { value: 'ads', label: 'Ads & Listings' },
  { value: 'verification', label: 'Verification' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'report', label: 'Report a Problem' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  waiting_on_user: 'bg-purple-100 text-purple-800',
  resolved: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
};

export interface Ticket {
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

export interface TicketDetail extends Ticket {
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

export interface NewTicketData {
  subject: string;
  category: string;
  priority: string;
  message: string;
}
