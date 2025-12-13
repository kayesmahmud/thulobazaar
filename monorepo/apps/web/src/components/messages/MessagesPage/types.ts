import type { Announcement } from '@/types/messaging';

export interface MessagesPageState {
  conversations: any[];
  selectedConversation: any | null;
  loading: boolean;
  error: string | null;
  activeTab: 'conversations' | 'announcements';
  announcementUnreadCount: number;
  selectedAnnouncement: Announcement | null;
  conversationMessages: any[];
}

export type TabType = 'conversations' | 'announcements';
