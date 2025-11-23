/**
 * Socket.IO Handler - 2025 Best Practices
 * - JWT Authentication at connection time
 * - Error handling and reconnection support
 * - Real-time messaging with typing indicators
 * - Read receipts and online status
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');
const pool = require('../config/database');

// In-memory store for online users (use Redis in production for multi-server scaling)
const onlineUsers = new Map(); // userId -> socketId

/**
 * Initialize Socket.IO with JWT authentication
 */
function initializeSocketIO(io) {
  // Authentication middleware - validates JWT token at connection time
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      socket.userRole = decoded.role;

      console.log(`✅ Socket.IO: User ${decoded.email} (ID: ${decoded.userId}) authenticated`);
      next();
    } catch (error) {
      console.error('❌ Socket.IO authentication failed:', error.message);
      return next(new Error('Invalid or expired token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
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

    /**
     * Send a new message
     * Payload: { conversationId, content, type: 'text'|'image'|'file', attachmentUrl? }
     */
    socket.on('message:send', async (payload, callback) => {
      try {
        const { conversationId, content, type = 'text', attachmentUrl } = payload;

        // Validate conversation membership
        const isMember = await checkConversationMembership(userId, conversationId);
        if (!isMember) {
          return callback({ error: 'Not a member of this conversation' });
        }

        // Insert message into database
        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content, type, attachment_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, conversation_id, sender_id, content, type, attachment_url, created_at`,
          [conversationId, userId, content, type, attachmentUrl || null]
        );

        const message = result.rows[0];

        // Get sender info
        const userResult = await pool.query(
          'SELECT id, full_name, avatar FROM users WHERE id = $1',
          [userId]
        );
        const sender = userResult.rows[0];

        // Build complete message object
        const messageData = {
          id: message.id,
          conversationId: message.conversation_id,
          sender: {
            id: sender.id,
            fullName: sender.full_name,
            avatar: sender.avatar,
          },
          content: message.content,
          type: message.type,
          attachmentUrl: message.attachment_url,
          createdAt: message.created_at,
        };

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', messageData);

        // Update last_read_at for sender
        await pool.query(
          `UPDATE conversation_participants
           SET last_read_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId]
        );

        // ✅ 2025 Best Practice: Update conversation last_message_at timestamp
        await pool.query(
          `UPDATE conversations
           SET last_message_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [conversationId]
        );

        // ✅ 2025 Best Practice: Broadcast conversation update to refresh conversation lists
        // This ensures all participants see the updated conversation in their sidebar
        io.to(`conversation:${conversationId}`).emit('conversation:updated', {
          conversationId,
          lastMessage: messageData,
          timestamp: new Date(),
        });

        callback({ success: true, message: messageData });
      } catch (error) {
        console.error('❌ Error sending message:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Mark messages as read
     * Payload: { conversationId }
     */
    socket.on('message:read', async (payload, callback) => {
      try {
        const { conversationId } = payload;

        // Update last_read_at timestamp
        await pool.query(
          `UPDATE conversation_participants
           SET last_read_at = CURRENT_TIMESTAMP
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, userId]
        );

        // Broadcast read receipt to other participants
        socket.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          readAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Edit a message
     * Payload: { messageId, newContent }
     */
    socket.on('message:edit', async (payload, callback) => {
      try {
        const { messageId, newContent } = payload;

        // Verify ownership
        const checkResult = await pool.query(
          'SELECT conversation_id FROM messages WHERE id = $1 AND sender_id = $2',
          [messageId, userId]
        );

        if (checkResult.rows.length === 0) {
          return callback({ error: 'Message not found or unauthorized' });
        }

        const conversationId = checkResult.rows[0].conversation_id;

        // Update message
        await pool.query(
          `UPDATE messages
           SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [newContent, messageId]
        );

        // Broadcast edit to conversation
        io.to(`conversation:${conversationId}`).emit('message:edited', {
          messageId,
          newContent,
          editedAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error editing message:', error);
        callback({ error: error.message });
      }
    });

    /**
     * Delete a message
     * Payload: { messageId }
     */
    socket.on('message:delete', async (payload, callback) => {
      try {
        const { messageId } = payload;

        // Verify ownership
        const checkResult = await pool.query(
          'SELECT conversation_id FROM messages WHERE id = $1 AND sender_id = $2',
          [messageId, userId]
        );

        if (checkResult.rows.length === 0) {
          return callback({ error: 'Message not found or unauthorized' });
        }

        const conversationId = checkResult.rows[0].conversation_id;

        // Soft delete
        await pool.query(
          `UPDATE messages
           SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [messageId]
        );

        // Broadcast deletion to conversation
        io.to(`conversation:${conversationId}`).emit('message:deleted', {
          messageId,
          deletedAt: new Date(),
        });

        callback({ success: true });
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        callback({ error: error.message });
      }
    });

    // =====================
    // TYPING INDICATORS
    // =====================

    /**
     * User is typing
     * Payload: { conversationId }
     */
    socket.on('typing:start', async (payload) => {
      try {
        const { conversationId } = payload;

        // Broadcast to other participants (not sender)
        socket.to(`conversation:${conversationId}`).emit('typing:user-started', {
          conversationId,
          userId,
        });

        // Store typing indicator in database with 5 second expiry
        const expiresAt = new Date(Date.now() + 5000);
        await pool.query(
          `INSERT INTO typing_indicators (conversation_id, user_id, expires_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (conversation_id, user_id)
           DO UPDATE SET started_at = CURRENT_TIMESTAMP, expires_at = $3`,
          [conversationId, userId, expiresAt]
        );
      } catch (error) {
        console.error('❌ Error handling typing start:', error);
      }
    });

    /**
     * User stopped typing
     * Payload: { conversationId }
     */
    socket.on('typing:stop', async (payload) => {
      try {
        const { conversationId } = payload;

        // Broadcast to other participants
        socket.to(`conversation:${conversationId}`).emit('typing:user-stopped', {
          conversationId,
          userId,
        });

        // Remove typing indicator
        await pool.query(
          'DELETE FROM typing_indicators WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, userId]
        );
      } catch (error) {
        console.error('❌ Error handling typing stop:', error);
      }
    });

    // =====================
    // CONVERSATION EVENTS
    // =====================

    /**
     * Create a new conversation
     * Payload: { participantIds: [userId1, userId2], type: 'direct'|'group', title?, adId? }
     */
    socket.on('conversation:create', async (payload, callback) => {
      try {
        const { participantIds, type = 'direct', title, adId } = payload;

        // Include the creator in participants
        const allParticipants = [...new Set([userId, ...participantIds])];

        // Create conversation
        const convResult = await pool.query(
          `INSERT INTO conversations (type, title, ad_id)
           VALUES ($1, $2, $3)
           RETURNING id, type, title, ad_id, created_at`,
          [type, title || null, adId || null]
        );

        const conversation = convResult.rows[0];

        // Add participants
        for (const participantId of allParticipants) {
          await pool.query(
            `INSERT INTO conversation_participants (conversation_id, user_id)
             VALUES ($1, $2)`,
            [conversation.id, participantId]
          );
        }

        // Make all participants join the room
        allParticipants.forEach(pId => {
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
        callback({ error: error.message });
      }
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
      pool.query('DELETE FROM typing_indicators WHERE user_id = $1', [userId])
        .catch(err => console.error('Error cleaning typing indicators:', err));
    });

    // =====================
    // ERROR HANDLING
    // =====================

    socket.on('error', (error) => {
      console.error(`❌ Socket.IO error for user ${userId}:`, error);
    });
  });

  console.log('✅ Socket.IO initialized with authentication');
}

/**
 * Helper: Join user to their conversation rooms
 */
async function joinUserConversations(socket, userId) {
  try {
    const result = await pool.query(
      'SELECT conversation_id FROM conversation_participants WHERE user_id = $1',
      [userId]
    );

    result.rows.forEach(row => {
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
async function checkConversationMembership(userId, conversationId) {
  const result = await pool.query(
    'SELECT 1 FROM conversation_participants WHERE user_id = $1 AND conversation_id = $2',
    [userId, conversationId]
  );
  return result.rows.length > 0;
}

/**
 * Helper: Broadcast user online/offline status
 */
async function broadcastUserOnlineStatus(io, userId, isOnline) {
  try {
    // Get user's conversations
    const result = await pool.query(
      'SELECT conversation_id FROM conversation_participants WHERE user_id = $1',
      [userId]
    );

    // Broadcast to each conversation
    result.rows.forEach(row => {
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
function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

module.exports = {
  initializeSocketIO,
  getOnlineUsers,
};
