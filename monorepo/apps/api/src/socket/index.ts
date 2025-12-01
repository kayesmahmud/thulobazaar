/**
 * Socket.IO Handler - TypeScript Version
 * - JWT Authentication at connection time
 * - Error handling and reconnection support
 * - Real-time messaging with typing indicators
 * - Read receipts and online status
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';

// Extend Socket type to include user info
interface AuthenticatedSocket extends Socket {
  userId: number;
  userEmail: string;
  userRole?: string;
}

// In-memory store for online users (use Redis in production for multi-server scaling)
const onlineUsers = new Map<number, string>(); // userId -> socketId

interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * Initialize Socket.IO with JWT authentication
 */
export function initializeSocketIO(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware - validates JWT token at connection time
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      // Attach user info to socket
      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = decoded.userId;
      authSocket.userEmail = decoded.email;
      authSocket.userRole = decoded.role;

      console.log(`✅ Socket.IO: User ${decoded.email} (ID: ${decoded.userId}) authenticated`);
      next();
    } catch (error) {
      const err = error as Error;
      console.error('❌ Socket.IO authentication failed:', err.message);
      return next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;
    console.log(`🔌 Socket.IO: User ${userId} connected (Socket: ${socket.id})`);

    // Store online user
    onlineUsers.set(userId, socket.id);

    // Broadcast user online status to their conversations
    broadcastUserOnlineStatus(io, userId, true);

    // Join user's conversation rooms
    joinUserConversations(socket, userId);

    // =====================
    // MESSAGE EVENTS
    // =====================

    interface SendMessagePayload {
      conversationId: number;
      content: string;
      type?: 'text' | 'image' | 'file';
      attachmentUrl?: string;
    }

    /**
     * Send a new message
     */
    socket.on('message:send', async (payload: SendMessagePayload, callback) => {
      try {
        const { conversationId, content, type = 'text', attachmentUrl } = payload;

        // Validate conversation membership
        const isMember = await checkConversationMembership(userId, conversationId);
        if (!isMember) {
          return callback({ error: 'Not a member of this conversation' });
        }

        // Insert message into database using Prisma
        const message = await prisma.messages.create({
          data: {
            conversation_id: conversationId,
            sender_id: userId,
            content,
            type,
            attachment_url: attachmentUrl || null,
          },
        });

        // Get sender info
        const sender = await prisma.users.findUnique({
          where: { id: userId },
          select: { id: true, full_name: true, avatar: true },
        });

        // Build complete message object
        const messageData = {
          id: message.id,
          conversationId: message.conversation_id,
          sender: {
            id: sender?.id,
            fullName: sender?.full_name,
            avatar: sender?.avatar,
          },
          content: message.content,
          type: message.type,
          attachmentUrl: message.attachment_url,
          createdAt: message.created_at,
        };

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', messageData);

        // Update last_read_at for sender
        await prisma.conversation_participants.updateMany({
          where: {
            conversation_id: conversationId,
            user_id: userId,
          },
          data: {
            last_read_at: new Date(),
          },
        });

        // Update conversation last_message_at timestamp
        await prisma.conversations.update({
          where: { id: conversationId },
          data: { last_message_at: new Date() },
        });

        // Broadcast conversation update to refresh conversation lists
        io.to(`conversation:${conversationId}`).emit('conversation:updated', {
          conversationId,
          lastMessage: messageData,
          timestamp: new Date(),
        });

        callback({ success: true, message: messageData });
      } catch (error) {
        console.error('❌ Error sending message:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on('message:read', async (payload: { conversationId: number }, callback) => {
      try {
        const { conversationId } = payload;

        // Update last_read_at timestamp
        await prisma.conversation_participants.updateMany({
          where: {
            conversation_id: conversationId,
            user_id: userId,
          },
          data: {
            last_read_at: new Date(),
          },
        });

        // Broadcast read receipt to other participants
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          readAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Edit a message
     */
    socket.on('message:edit', async (payload: { messageId: number; newContent: string }, callback) => {
      try {
        const { messageId, newContent } = payload;

        // Verify ownership
        const message = await prisma.messages.findFirst({
          where: {
            id: messageId,
            sender_id: userId,
          },
        });

        if (!message) {
          return callback({ error: 'Message not found or unauthorized' });
        }

        // Update message
        await prisma.messages.update({
          where: { id: messageId },
          data: {
            content: newContent,
            is_edited: true,
            edited_at: new Date(),
          },
        });

        // Broadcast edit to conversation
        io.to(`conversation:${message.conversation_id}`).emit('message:edited', {
          messageId,
          newContent,
          editedAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error editing message:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Delete a message
     */
    socket.on('message:delete', async (payload: { messageId: number }, callback) => {
      try {
        const { messageId } = payload;

        // Verify ownership
        const message = await prisma.messages.findFirst({
          where: {
            id: messageId,
            sender_id: userId,
          },
        });

        if (!message) {
          return callback({ error: 'Message not found or unauthorized' });
        }

        // Soft delete
        await prisma.messages.update({
          where: { id: messageId },
          data: {
            is_deleted: true,
            deleted_at: new Date(),
          },
        });

        // Broadcast deletion to conversation
        io.to(`conversation:${message.conversation_id}`).emit('message:deleted', {
          messageId,
          deletedAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        callback({ error: (error as Error).message });
      }
    });

    // =====================
    // TYPING INDICATORS
    // =====================

    /**
     * User is typing
     */
    socket.on('typing:start', async (payload: { conversationId: number }) => {
      try {
        const { conversationId } = payload;

        // Broadcast to other participants (not sender)
        socket.to(`conversation:${conversationId}`).emit('typing:user-started', {
          conversationId,
          userId,
        });

        // Store typing indicator in database with 5 second expiry
        const expiresAt = new Date(Date.now() + 5000);
        await prisma.typing_indicators.upsert({
          where: {
            conversation_id_user_id: {
              conversation_id: conversationId,
              user_id: userId,
            },
          },
          create: {
            conversation_id: conversationId,
            user_id: userId,
            expires_at: expiresAt,
          },
          update: {
            started_at: new Date(),
            expires_at: expiresAt,
          },
        });
      } catch (error) {
        console.error('❌ Error handling typing start:', error);
      }
    });

    /**
     * User stopped typing
     */
    socket.on('typing:stop', async (payload: { conversationId: number }) => {
      try {
        const { conversationId } = payload;

        // Broadcast to other participants
        socket.to(`conversation:${conversationId}`).emit('typing:user-stopped', {
          conversationId,
          userId,
        });

        // Remove typing indicator
        await prisma.typing_indicators.deleteMany({
          where: {
            conversation_id: conversationId,
            user_id: userId,
          },
        });
      } catch (error) {
        console.error('❌ Error handling typing stop:', error);
      }
    });

    // =====================
    // CONVERSATION EVENTS
    // =====================

    interface CreateConversationPayload {
      participantIds: number[];
      type?: 'direct' | 'group';
      title?: string;
      adId?: number;
    }

    /**
     * Create a new conversation
     */
    socket.on('conversation:create', async (payload: CreateConversationPayload, callback) => {
      try {
        const { participantIds, type = 'direct', title, adId } = payload;

        // Include the creator in participants
        const allParticipants = [...new Set([userId, ...participantIds])];

        // Create conversation
        const conversation = await prisma.conversations.create({
          data: {
            type,
            title: title || null,
            ad_id: adId || null,
          },
        });

        // Add participants
        await prisma.conversation_participants.createMany({
          data: allParticipants.map((participantId) => ({
            conversation_id: conversation.id,
            user_id: participantId,
          })),
        });

        // Make all participants join the room
        allParticipants.forEach((pId) => {
          const socketId = onlineUsers.get(pId);
          if (socketId) {
            io.sockets.sockets.get(socketId)?.join(`conversation:${conversation.id}`);
          }
        });

        // Broadcast to all participants
        io.to(`conversation:${conversation.id}`).emit('conversation:created', conversation);

        callback({ success: true, conversation });
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        callback({ error: (error as Error).message });
      }
    });

    // =====================
    // SUPPORT TICKET EVENTS
    // =====================

    /**
     * Join a support ticket room
     */
    socket.on('support:join-ticket', async (payload: { ticketId: number }, callback) => {
      try {
        const { ticketId } = payload;

        // Check if user has access (owner or staff)
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId },
          select: { user_id: true },
        });

        if (!ticket) {
          return callback({ error: 'Ticket not found' });
        }

        const isStaff = authSocket.userRole === 'editor' || authSocket.userRole === 'super_admin' || authSocket.userRole === 'root';

        if (!isStaff && ticket.user_id !== userId) {
          return callback({ error: 'Access denied' });
        }

        const roomName = `support:${ticketId}`;
        socket.join(roomName);
        console.log(`  🎫 User ${userId} joined support ticket room: ${roomName}`);

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error joining support ticket:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Leave a support ticket room
     */
    socket.on('support:leave-ticket', (payload: { ticketId: number }) => {
      const { ticketId } = payload;
      socket.leave(`support:${ticketId}`);
      console.log(`  🎫 User ${userId} left support ticket room: support:${ticketId}`);
    });

    /**
     * Send a support ticket message via Socket.IO
     */
    socket.on('support:send-message', async (payload: {
      ticketId: number;
      content: string;
      isInternal?: boolean;
    }, callback) => {
      try {
        const { ticketId, content, isInternal = false } = payload;

        // Validate access
        const ticket = await prisma.support_tickets.findUnique({
          where: { id: ticketId },
          select: { id: true, user_id: true, status: true },
        });

        if (!ticket) {
          return callback({ error: 'Ticket not found' });
        }

        const isStaff = authSocket.userRole === 'editor' || authSocket.userRole === 'super_admin' || authSocket.userRole === 'root';

        if (!isStaff && ticket.user_id !== userId) {
          return callback({ error: 'Access denied' });
        }

        // Non-staff cannot send internal messages
        const actualIsInternal = isStaff ? isInternal : false;

        // Create message
        const message = await prisma.support_messages.create({
          data: {
            ticket_id: ticketId,
            sender_id: userId,
            content: content.trim(),
            type: 'text',
            is_internal: actualIsInternal,
          },
          select: {
            id: true,
            sender_id: true,
            content: true,
            type: true,
            attachment_url: true,
            is_internal: true,
            created_at: true,
            users: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
                role: true,
              },
            },
          },
        });

        // Update ticket status
        const newStatus = isStaff ? 'waiting_on_user' : 'in_progress';
        if (ticket.status === 'open' || (isStaff && ticket.status === 'in_progress') || (!isStaff && ticket.status === 'waiting_on_user')) {
          await prisma.support_tickets.update({
            where: { id: ticketId },
            data: {
              status: newStatus,
              updated_at: new Date(),
            },
          });
        }

        // Build message data
        const messageData = {
          id: message.id,
          senderId: message.sender_id,
          content: message.content,
          type: message.type,
          attachmentUrl: message.attachment_url,
          isInternal: message.is_internal,
          createdAt: message.created_at,
          sender: {
            id: message.users.id,
            fullName: message.users.full_name,
            avatar: message.users.avatar,
            isStaff: message.users.role !== 'user',
          },
        };

        // Broadcast to ticket room
        // For internal messages, only broadcast to staff (filter on client side)
        io.to(`support:${ticketId}`).emit('support:message-new', {
          ticketId,
          message: messageData,
          newStatus,
        });

        // Notify all staff about ticket update (for their dashboard)
        io.to('support:staff').emit('support:ticket-updated', {
          ticketId,
          status: newStatus,
          lastMessage: {
            content: actualIsInternal ? '[Internal note]' : content.substring(0, 100),
            createdAt: message.created_at,
          },
        });

        callback({ success: true, message: messageData });
      } catch (error) {
        console.error('❌ Error sending support message:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Update support ticket (status, priority, assignment)
     */
    socket.on('support:update-ticket', async (payload: {
      ticketId: number;
      status?: string;
      priority?: string;
      assignedTo?: number | null;
    }, callback) => {
      try {
        const { ticketId, status, priority, assignedTo } = payload;

        // Only staff can update tickets
        const isStaff = authSocket.userRole === 'editor' || authSocket.userRole === 'super_admin' || authSocket.userRole === 'root';

        if (!isStaff) {
          return callback({ error: 'Only staff can update tickets' });
        }

        const updateData: any = {
          updated_at: new Date(),
        };

        if (status) {
          updateData.status = status;
          if (status === 'resolved') {
            updateData.resolved_at = new Date();
          } else if (status === 'closed') {
            updateData.closed_at = new Date();
          }
        }

        if (priority) {
          updateData.priority = priority;
        }

        if (assignedTo !== undefined) {
          updateData.assigned_to = assignedTo || null;
        }

        const ticket = await prisma.support_tickets.update({
          where: { id: ticketId },
          data: updateData,
          select: {
            id: true,
            ticket_number: true,
            status: true,
            priority: true,
            assigned_to: true,
            updated_at: true,
            users_support_tickets_assigned_toTousers: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
              },
            },
          },
        });

        const updatePayload = {
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          status: ticket.status,
          priority: ticket.priority,
          assignedTo: ticket.users_support_tickets_assigned_toTousers
            ? {
                id: ticket.users_support_tickets_assigned_toTousers.id,
                fullName: ticket.users_support_tickets_assigned_toTousers.full_name,
                avatar: ticket.users_support_tickets_assigned_toTousers.avatar,
              }
            : null,
          updatedAt: ticket.updated_at,
        };

        // Broadcast to ticket room (user and staff viewing this ticket)
        io.to(`support:${ticketId}`).emit('support:ticket-status-changed', updatePayload);

        // Broadcast to all staff
        io.to('support:staff').emit('support:ticket-updated', updatePayload);

        callback({ success: true, data: updatePayload });
      } catch (error) {
        console.error('❌ Error updating support ticket:', error);
        callback({ error: (error as Error).message });
      }
    });

    /**
     * Staff joins the staff room to receive all ticket updates
     */
    socket.on('support:join-staff-room', (callback) => {
      const isStaff = authSocket.userRole === 'editor' || authSocket.userRole === 'super_admin' || authSocket.userRole === 'root';

      if (!isStaff) {
        return callback({ error: 'Only staff can join this room' });
      }

      socket.join('support:staff');
      console.log(`  🎫 Staff ${userId} joined support:staff room`);
      callback({ success: true });
    });

    /**
     * Staff typing indicator
     */
    socket.on('support:typing-start', (payload: { ticketId: number }) => {
      const { ticketId } = payload;
      socket.to(`support:${ticketId}`).emit('support:typing', {
        ticketId,
        userId,
        isTyping: true,
      });
    });

    socket.on('support:typing-stop', (payload: { ticketId: number }) => {
      const { ticketId } = payload;
      socket.to(`support:${ticketId}`).emit('support:typing', {
        ticketId,
        userId,
        isTyping: false,
      });
    });

    // =====================
    // DISCONNECT
    // =====================

    socket.on('disconnect', () => {
      console.log(`🔌 Socket.IO: User ${userId} disconnected (Socket: ${socket.id})`);

      // Remove from online users
      onlineUsers.delete(userId);

      // Broadcast user offline status
      broadcastUserOnlineStatus(io, userId, false);

      // Clean up typing indicators
      prisma.typing_indicators
        .deleteMany({ where: { user_id: userId } })
        .catch((err) => console.error('Error cleaning typing indicators:', err));
    });

    // =====================
    // ERROR HANDLING
    // =====================

    socket.on('error', (error) => {
      console.error(`❌ Socket.IO error for user ${userId}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized with authentication');
  return io;
}

/**
 * Helper: Join user to their conversation rooms
 */
async function joinUserConversations(socket: Socket, userId: number): Promise<void> {
  try {
    const participants = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });

    participants.forEach((row) => {
      const roomName = `conversation:${row.conversation_id}`;
      socket.join(roomName);
      console.log(`  📨 User ${userId} joined room: ${roomName}`);
    });
  } catch (error) {
    console.error('❌ Error joining conversations:', error);
  }
}

/**
 * Helper: Check if user is a conversation member
 */
async function checkConversationMembership(userId: number, conversationId: number): Promise<boolean> {
  const participant = await prisma.conversation_participants.findFirst({
    where: {
      user_id: userId,
      conversation_id: conversationId,
    },
  });
  return !!participant;
}

/**
 * Helper: Broadcast user online/offline status
 */
async function broadcastUserOnlineStatus(io: Server, userId: number, isOnline: boolean): Promise<void> {
  try {
    // Get user's conversations
    const participants = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      select: { conversation_id: true },
    });

    // Broadcast to each conversation
    participants.forEach((row) => {
      io.to(`conversation:${row.conversation_id}`).emit('user:status', {
        userId,
        isOnline,
        timestamp: new Date(),
      });
    });
  } catch (error) {
    console.error('❌ Error broadcasting online status:', error);
  }
}

/**
 * Get online users (for admin dashboard)
 */
export function getOnlineUsers(): number[] {
  return Array.from(onlineUsers.keys());
}
