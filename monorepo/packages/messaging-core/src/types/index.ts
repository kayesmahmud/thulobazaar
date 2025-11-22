/**
 * Messaging Core Types
 * Shared type definitions for Thulobazaar messaging system
 * Used across Web (Next.js) and Mobile (React Native) apps
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: number;
  fullName: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface MessageSender extends User {
  // Additional sender-specific fields if needed
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageType = 'text' | 'image' | 'file';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender: MessageSender;
  content: string;
  type: MessageType;
  attachmentUrl?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageCreate {
  conversationId: number;
  content: string;
  type?: MessageType;
  attachmentUrl?: string;
}

export interface MessageUpdate {
  id: number;
  content: string;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export type ConversationType = 'direct' | 'group';

export interface AdInfo {
  id: number;
  title: string;
  slug: string;
  price?: number;
  imageUrl?: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  title?: string | null;
  participants: User[];
  lastMessage?: Message | null;
  unreadCount: number;
  adInfo?: AdInfo | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationCreate {
  participantIds: number[];
  type?: ConversationType;
  title?: string;
  adId?: number;
  initialMessage?: string;
}

export interface ConversationListItem {
  id: number;
  type: ConversationType;
  title?: string | null;
  participants: User[];
  lastMessage?: {
    id: number;
    content: string;
    type: MessageType;
    senderId: number;
    createdAt: string;
  } | null;
  unreadCount: number;
  adInfo?: AdInfo | null;
  lastMessageAt?: string | null;
}

// ============================================================================
// TYPING INDICATOR TYPES
// ============================================================================

export interface TypingUser {
  userId: number;
  conversationId: number;
  fullName?: string;
}

export interface TypingIndicator {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

// ============================================================================
// SOCKET EVENT TYPES
// ============================================================================

export interface SocketEventMap {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;

  // Message events
  'message:new': (message: Message) => void;
  'message:updated': (message: Message) => void;
  'message:deleted': (messageId: number) => void;
  'message:read': (data: { conversationId: number; userId: number }) => void;

  // Conversation events
  'conversation:updated': (data: {
    conversationId: number;
    lastMessage: Message;
    timestamp: string;
  }) => void;
  'conversation:created': (conversation: Conversation) => void;

  // Typing events
  'typing:start': (data: TypingUser) => void;
  'typing:stop': (data: TypingUser) => void;

  // User status events
  'user:online': (userId: number) => void;
  'user:offline': (userId: number) => void;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ConversationsResponse {
  conversations: ConversationListItem[];
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface UnreadCountResponse {
  unreadCount: number;
  conversationCounts: Array<{
    conversationId: number;
    count: number;
  }>;
}

// ============================================================================
// UPLOAD TYPES
// ============================================================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageUploadResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  state: LoadingState;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  // Re-export all types for convenience
  User as MessagingUser,
  Message as ChatMessage,
  Conversation as ChatConversation,
};
