/**
 * Messages API Routes - 2025 Best Practices
 * REST endpoints for message history, conversations, and user lookups
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { catchAsync, ValidationError, NotFoundError, AuthenticationError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/messages/search-users
 * Search for users to start a conversation with
 */
router.get('/search-users', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const searchTerm = `%${q.trim()}%`;

  const result = await pool.query(
    `SELECT
      id,
      full_name,
      email,
      avatar,
      created_at
    FROM users
    WHERE id != $1
      AND is_active = true
      AND (
        full_name ILIKE $2
        OR email ILIKE $2
      )
    ORDER BY full_name
    LIMIT 20`,
    [userId, searchTerm]
  );

  res.json({
    success: true,
    data: result.rows
  });
}));

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
router.get('/conversations', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { limit = 50, offset = 0 } = req.query;

  const result = await pool.query(
    `SELECT
      c.id,
      c.type,
      c.title,
      c.ad_id,
      c.created_at,
      c.last_message_at,
      cp.is_muted,
      cp.is_archived,
      cp.last_read_at,
      (SELECT COUNT(*)
       FROM messages m
       WHERE m.conversation_id = c.id
         AND m.created_at > cp.last_read_at
         AND m.sender_id != $1
         AND m.is_deleted = false
      ) as unread_count,
      -- Get last message
      (SELECT json_build_object(
        'id', m.id,
        'content', m.content,
        'type', m.type,
        'createdAt', m.created_at,
        'sender', json_build_object(
          'id', u.id,
          'fullName', u.full_name,
          'avatar', u.avatar
        )
      )
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = c.id AND m.is_deleted = false
       ORDER BY m.created_at DESC
       LIMIT 1
      ) as last_message,
      -- Get participants
      (SELECT json_agg(json_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'avatar', u.avatar,
        'email', u.email
      ))
       FROM conversation_participants cp2
       JOIN users u ON u.id = cp2.user_id
       WHERE cp2.conversation_id = c.id
      ) as participants,
      -- Get ad info if linked
      (SELECT json_build_object(
        'id', a.id,
        'title', a.title,
        'slug', a.slug
      )
       FROM ads a
       WHERE a.id = c.ad_id
      ) as ad_info
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = $1
      AND (cp.is_archived = false OR $4::boolean = true)
    ORDER BY c.last_message_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset, req.query.includeArchived === 'true']
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: result.rows.length
    }
  });
}));

/**
 * GET /api/messages/conversations/:id
 * Get a specific conversation with messages
 */
router.get('/conversations/:id', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const conversationId = parseInt(req.params.id);
  const { limit = 50, offset = 0 } = req.query;

  // Verify user is participant
  const participantCheck = await pool.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  if (participantCheck.rows.length === 0) {
    throw new AuthenticationError('You are not a member of this conversation');
  }

  // Get conversation details
  const convResult = await pool.query(
    `SELECT
      c.*,
      (SELECT json_agg(json_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'avatar', u.avatar,
        'email', u.email
      ))
       FROM conversation_participants cp
       JOIN users u ON u.id = cp.user_id
       WHERE cp.conversation_id = c.id
      ) as participants,
      (SELECT json_build_object(
        'id', a.id,
        'title', a.title,
        'slug', a.slug
      )
       FROM ads a
       WHERE a.id = c.ad_id
      ) as ad_info
    FROM conversations c
    WHERE c.id = $1`,
    [conversationId]
  );

  if (convResult.rows.length === 0) {
    throw new NotFoundError('Conversation not found');
  }

  // Get messages (ordered oldest first for chat display)
  const messagesResult = await pool.query(
    `SELECT
      m.id,
      m.conversation_id,
      m.content,
      m.type,
      m.attachment_url,
      m.is_edited,
      m.edited_at,
      m.is_deleted,
      m.created_at,
      json_build_object(
        'id', u.id,
        'fullName', u.full_name,
        'avatar', u.avatar
      ) as sender
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = $1
    ORDER BY m.created_at ASC
    LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  res.json({
    success: true,
    data: {
      conversation: convResult.rows[0],
      messages: messagesResult.rows
    },
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: messagesResult.rows.length
    }
  });
}));

/**
 * POST /api/messages/conversations
 * Create a new conversation or get existing one
 */
router.post('/conversations', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const { participantIds, type = 'direct', title, adId } = req.body;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    throw new ValidationError('participantIds array is required');
  }

  // Include creator in participants
  const allParticipants = [...new Set([userId, ...participantIds])];

  // Check if direct conversation already exists between these participants
  if (type === 'direct' && allParticipants.length === 2) {
    const existingConv = await pool.query(
      `SELECT c.id
       FROM conversations c
       WHERE c.type = 'direct'
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM conversation_participants cp1
           WHERE cp1.user_id = $1
         )
         AND c.id IN (
           SELECT cp2.conversation_id
           FROM conversation_participants cp2
           WHERE cp2.user_id = $2
         )
         AND (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) = 2
       LIMIT 1`,
      allParticipants
    );

    if (existingConv.rows.length > 0) {
      console.log(`✅ Found existing conversation ${existingConv.rows[0].id} for users:`, allParticipants);
      // Return existing conversation
      return res.json({
        success: true,
        data: { id: existingConv.rows[0].id },
        message: 'Conversation already exists'
      });
    }
  }

  // Create new conversation
  const convResult = await pool.query(
    `INSERT INTO conversations (type, title, ad_id)
     VALUES ($1, $2, $3)
     RETURNING id, type, title, ad_id, created_at`,
    [type, title || null, adId || null]
  );

  const conversation = convResult.rows[0];
  console.log(`✅ Created new conversation ${conversation.id} for users:`, allParticipants);

  // Add participants
  for (const participantId of allParticipants) {
    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id)
       VALUES ($1, $2)`,
      [conversation.id, participantId]
    );
  }

  res.status(201).json({
    success: true,
    data: conversation
  });
}));

/**
 * PUT /api/messages/conversations/:id/archive
 * Archive or unarchive a conversation
 */
router.put('/conversations/:id/archive', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const conversationId = parseInt(req.params.id);
  const { isArchived } = req.body;

  await pool.query(
    `UPDATE conversation_participants
     SET is_archived = $1
     WHERE conversation_id = $2 AND user_id = $3`,
    [isArchived, conversationId, userId]
  );

  res.json({
    success: true,
    message: `Conversation ${isArchived ? 'archived' : 'unarchived'}`
  });
}));

/**
 * PUT /api/messages/conversations/:id/mute
 * Mute or unmute a conversation
 */
router.put('/conversations/:id/mute', catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const conversationId = parseInt(req.params.id);
  const { isMuted } = req.body;

  await pool.query(
    `UPDATE conversation_participants
     SET is_muted = $1
     WHERE conversation_id = $2 AND user_id = $3`,
    [isMuted, conversationId, userId]
  );

  res.json({
    success: true,
    message: `Conversation ${isMuted ? 'muted' : 'unmuted'}`
  });
}));

/**
 * GET /api/messages/unread-count
 * Get total unread message count
 */
router.get('/unread-count', catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await pool.query(
    `SELECT COUNT(DISTINCT m.conversation_id) as unread_conversations,
            COUNT(m.id) as unread_messages
     FROM messages m
     JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
     WHERE cp.user_id = $1
       AND m.sender_id != $1
       AND m.created_at > cp.last_read_at
       AND m.is_deleted = false`,
    [userId]
  );

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

module.exports = router;
