/**
 * Messaging & Announcements Types
 * Shared types for web and mobile apps
 */

// ============================================
// Announcement Types
// ============================================

export type AnnouncementAudience =
  | 'all_users'
  | 'new_users'
  | 'business_verified'
  | 'individual_verified';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: AnnouncementAudience;
  createdAt: string;
  expiresAt: string | null;
  isRead: boolean;
  readAt: string | null;
}

export interface AnnouncementsResponse {
  success: boolean;
  data: Announcement[];
  unreadCount: number;
  message?: string;
}

export interface AnnouncementMarkReadResponse {
  success: boolean;
  message?: string;
}

// ============================================
// Conversation Types
// ============================================

export type ConversationType = 'direct' | 'group';

export interface ConversationParticipant {
  id: number;
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  isOnline?: boolean;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  title: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participants: ConversationParticipant[];
  adId?: number;
  adTitle?: string;
  adImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isMuted: boolean;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  message?: string;
}

// ============================================
// Message Types
// ============================================

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string;
  type: MessageType;
  attachmentUrl: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface ConversationDetailResponse {
  success: boolean;
  data: Conversation & { messages: Message[] };
  message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: Message;
  message?: string;
}

// ============================================
// Hook State Types
// ============================================

export interface UseAnnouncementsState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

export interface UseAnnouncementsActions {
  loadAnnouncements: () => Promise<void>;
  markAsRead: (announcementId: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export type UseAnnouncementsReturn = UseAnnouncementsState & UseAnnouncementsActions;

// ============================================
// Utility Types
// ============================================

export interface ApiError {
  success: false;
  message: string;
}

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as ApiError).success === false
  );
}

/**
 * Format relative date for display
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Format full date with time
 */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
