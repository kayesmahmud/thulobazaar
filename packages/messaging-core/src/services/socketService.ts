/**
 * Platform-Agnostic Socket.IO Service
 * Works with both Next.js (web) and React Native (mobile)
 *
 * Usage:
 * import { createSocketService } from '@thulobazaar/messaging-core';
 * const socketService = createSocketService();
 * socketService.connect('your-token', 'http://localhost:5000');
 */

import { io, Socket } from 'socket.io-client';
import type {
  Message,
  SocketEventMap,
  TypingIndicator,
  Conversation,
} from '../types';

export interface SocketServiceConfig {
  backendUrl: string;
  token: string;
  options?: {
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
  };
}

export type SocketEventCallback<T extends keyof SocketEventMap> = SocketEventMap[T];

export class SocketService {
  private socket: Socket | null = null;
  private backendUrl: string | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to Socket.IO server
   */
  connect(config: SocketServiceConfig): void {
    // Disconnect existing connection
    if (this.socket) {
      this.disconnect();
    }

    this.backendUrl = config.backendUrl;
    this.token = config.token;

    const defaultOptions = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    };

    this.socket = io(config.backendUrl, {
      ...defaultOptions,
      ...config.options,
      auth: {
        token: config.token,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupConnectionListeners();
    this.reattachEventListeners();
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get the underlying socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Setup connection event listeners
   */
  private setupConnectionListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.emit('error', error);
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Reattach all registered event listeners after reconnection
   */
  private reattachEventListeners(): void {
    if (!this.socket) return;

    for (const [eventName, callbacks] of this.eventListeners.entries()) {
      for (const callback of callbacks) {
        this.socket.on(eventName, callback as any);
      }
    }
  }

  /**
   * Add an event listener
   */
  on<T extends keyof SocketEventMap>(
    event: T,
    callback: SocketEventCallback<T>
  ): void {
    if (!this.socket) {
      console.warn(`Cannot add listener for "${event}": Socket not connected`);
      return;
    }

    // Track the listener for reconnection
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Attach to socket
    this.socket.on(event, callback as any);
  }

  /**
   * Remove an event listener
   */
  off<T extends keyof SocketEventMap>(
    event: T,
    callback: SocketEventCallback<T>
  ): void {
    if (!this.socket) return;

    // Remove from tracking
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }

    // Remove from socket
    this.socket.off(event, callback as any);
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, ...args: any[]): void {
    if (!this.socket) {
      console.warn(`Cannot emit "${event}": Socket not connected`);
      return;
    }

    this.socket.emit(event, ...args);
  }

  // ============================================================================
  // CONVENIENCE METHODS FOR COMMON EVENTS
  // ============================================================================

  /**
   * Join a conversation room
   */
  joinConversation(conversationId: number): void {
    this.emit('join-conversation', conversationId);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: number): void {
    this.emit('leave-conversation', conversationId);
  }

  /**
   * Send a message via Socket.IO
   */
  sendMessage(conversationId: number, content: string, type: 'text' | 'image' = 'text'): void {
    this.emit('send-message', { conversationId, content, type });
  }

  /**
   * Edit a message via Socket.IO
   */
  editMessage(messageId: number, content: string): void {
    this.emit('edit-message', { messageId, content });
  }

  /**
   * Delete a message via Socket.IO
   */
  deleteMessage(messageId: number): void {
    this.emit('delete-message', { messageId });
  }

  /**
   * Mark messages as read via Socket.IO
   */
  markAsRead(conversationId: number): void {
    this.emit('mark-as-read', { conversationId });
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: number): void {
    this.emit('typing-start', { conversationId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: number): void {
    this.emit('typing-stop', { conversationId });
  }

  // ============================================================================
  // EVENT LISTENER HELPERS
  // ============================================================================

  /**
   * Listen for new messages
   */
  onMessageNew(callback: (message: Message) => void): void {
    this.on('message:new', callback);
  }

  /**
   * Listen for message updates
   */
  onMessageUpdated(callback: (message: Message) => void): void {
    this.on('message:updated', callback);
  }

  /**
   * Listen for message deletions
   */
  onMessageDeleted(callback: (messageId: number) => void): void {
    this.on('message:deleted', callback);
  }

  /**
   * Listen for conversation updates
   */
  onConversationUpdated(
    callback: (data: { conversationId: number; lastMessage: Message; timestamp: string }) => void
  ): void {
    this.on('conversation:updated', callback);
  }

  /**
   * Listen for new conversations
   */
  onConversationCreated(callback: (conversation: Conversation) => void): void {
    this.on('conversation:created', callback);
  }

  /**
   * Listen for typing start
   */
  onTypingStart(callback: (data: { userId: number; conversationId: number; fullName?: string }) => void): void {
    this.on('typing:start', callback);
  }

  /**
   * Listen for typing stop
   */
  onTypingStop(callback: (data: { userId: number; conversationId: number; fullName?: string }) => void): void {
    this.on('typing:stop', callback);
  }

  /**
   * Listen for user online status
   */
  onUserOnline(callback: (userId: number) => void): void {
    this.on('user:online', callback);
  }

  /**
   * Listen for user offline status
   */
  onUserOffline(callback: (userId: number) => void): void {
    this.on('user:offline', callback);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return;

    for (const [eventName, callbacks] of this.eventListeners.entries()) {
      for (const callback of callbacks) {
        this.socket.off(eventName, callback as any);
      }
    }

    this.eventListeners.clear();
  }
}

/**
 * Factory function to create a socket service instance
 */
export function createSocketService(): SocketService {
  return new SocketService();
}

/**
 * Default export for convenience
 */
export default SocketService;
