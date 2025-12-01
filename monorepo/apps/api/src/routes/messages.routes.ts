import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/messages/conversations
 * Get user's conversations
 */
router.get(
  '/conversations',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation_participants.findMany({
      where: { user_id: userId },
      include: {
        conversations: {
          include: {
            conversation_participants: {
              include: {
                users: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        conversations: {
          last_message_at: 'desc',
        },
      },
    });

    const data = conversations.map((cp) => {
      const conv = cp.conversations;
      // Transform participants to camelCase for frontend
      const otherParticipants = conv.conversation_participants
        .filter((p) => p.user_id !== userId)
        .map((p) => ({
          id: p.users.id,
          fullName: p.users.full_name,
          avatar: p.users.avatar,
        }));
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        participants: otherParticipants,
        last_message: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.created_at,
              senderId: lastMessage.sender_id,
              type: lastMessage.type,
            }
          : null,
        lastMessageAt: conv.last_message_at,
        createdAt: conv.created_at,
      };
    });

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/messages/conversations/:id
 * Get messages in a conversation
 */
router.get(
  '/conversations/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { limit = '50', before } = req.query;

    // Verify membership and get conversation details
    const conversationData = await prisma.conversations.findFirst({
      where: {
        id: parseInt(id),
        conversation_participants: {
          some: { user_id: userId },
        },
      },
      include: {
        conversation_participants: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversationData) {
      throw new NotFoundError('Conversation not found');
    }

    const where: any = {
      conversation_id: parseInt(id),
      is_deleted: false,
    };

    if (before) {
      where.created_at = { lt: new Date(before as string) };
    }

    const messages = await prisma.messages.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
    });

    // Update last_read_at
    await prisma.conversation_participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: parseInt(id),
          user_id: userId,
        },
      },
      data: { last_read_at: new Date() },
    });

    // Transform conversation data for frontend
    const otherParticipants = conversationData.conversation_participants
      .filter((p) => p.user_id !== userId)
      .map((p) => ({
        id: p.users.id,
        fullName: p.users.full_name,
        avatar: p.users.avatar,
      }));

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversationData.id,
          type: conversationData.type,
          title: conversationData.title,
          participants: otherParticipants,
          lastMessageAt: conversationData.last_message_at,
          createdAt: conversationData.created_at,
        },
        messages: messages.reverse().map((msg) => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          sender: {
            id: msg.users.id,
            fullName: msg.users.full_name,
            avatar: msg.users.avatar,
          },
          content: msg.content,
          type: msg.type,
          attachmentUrl: msg.attachment_url,
          isEdited: msg.is_edited,
          createdAt: msg.created_at,
        })),
      },
    });
  })
);

/**
 * POST /api/messages/conversations
 * Create a new conversation or get existing one
 */
router.post(
  '/conversations',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    // Support both participantId (single) and participantIds (array) for flexibility
    const { participantId, participantIds, adId } = req.body;

    // Extract participant ID from either format
    const targetParticipantId = participantId || (Array.isArray(participantIds) ? participantIds[0] : null);

    if (!targetParticipantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required',
      });
    }

    // Check if direct conversation already exists between these users
    const existingConversation = await prisma.$queryRaw<{ id: number }[]>`
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ${userId}
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ${parseInt(String(targetParticipantId))}
      WHERE c.type = 'direct'
      LIMIT 1
    `;

    if (existingConversation.length > 0) {
      return res.json({
        success: true,
        data: { id: existingConversation[0].id, isNew: false },
      });
    }

    // Create new conversation
    const conversation = await prisma.conversations.create({
      data: {
        type: 'direct',
        ad_id: adId ? parseInt(adId) : null,
      },
    });

    // Add participants
    await prisma.conversation_participants.createMany({
      data: [
        { conversation_id: conversation.id, user_id: userId },
        { conversation_id: conversation.id, user_id: parseInt(String(targetParticipantId)) },
      ],
    });

    console.log(`✅ Conversation created: ${conversation.id} between users ${userId} and ${targetParticipantId}`);

    res.status(201).json({
      success: true,
      data: { id: conversation.id, isNew: true },
    });
  })
);

/**
 * GET /api/messages/unread-count
 * Get unread message count
 */
router.get(
  '/unread-count',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = ${userId}
        AND m.sender_id != ${userId}
        AND m.is_deleted = false
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
    `;

    res.json({
      success: true,
      data: { unread_messages: Number(result[0]?.count || 0) },
    });
  })
);

export default router;
