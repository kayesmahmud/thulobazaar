import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 *
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - includeArchived: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Find all conversations where user is a participant
    const participantRecords = await prisma.conversation_participants.findMany({
      where: {
        user_id: userId,
        ...(includeArchived ? {} : { is_archived: false }),
      },
      select: {
        conversation_id: true,
        is_muted: true,
        is_archived: true,
        last_read_at: true,
        conversations: {
          select: {
            id: true,
            type: true,
            title: true,
            ad_id: true,
            created_at: true,
            updated_at: true,
            last_message_at: true,
            ads: {
              select: {
                id: true,
                title: true,
                slug: true,
                ad_images: {
                  where: { is_primary: true },
                  select: { file_path: true },
                  take: 1,
                },
              },
            },
            conversation_participants: {
              where: {
                user_id: { not: userId },
              },
              select: {
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
              select: {
                id: true,
                content: true,
                sender_id: true,
                created_at: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversations: {
          last_message_at: 'desc',
        },
      },
      skip: offset,
      take: limit,
    });

    // Count unread messages for each conversation
    const conversationsWithUnread = await Promise.all(
      participantRecords.map(async (p) => {
        const unreadCount = await prisma.messages.count({
          where: {
            conversation_id: p.conversation_id,
            sender_id: { not: userId },
            created_at: { gt: p.last_read_at || new Date(0) },
          },
        });

        const conv = p.conversations;
        const lastMessage = conv.messages[0];
        const otherParticipants = conv.conversation_participants.map(
          (cp) => cp.users
        );

        return {
          id: conv.id,
          type: conv.type,
          title: conv.title,
          adId: conv.ad_id,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
          lastMessageAt: conv.last_message_at,
          isMuted: p.is_muted,
          isArchived: p.is_archived,
          unreadCount,
          ad: conv.ads
            ? {
                id: conv.ads.id,
                title: conv.ads.title,
                slug: conv.ads.slug,
                image: conv.ads.ad_images[0]?.file_path || null,
              }
            : null,
          participants: otherParticipants.map((u) => ({
            id: u.id,
            fullName: u.full_name,
            avatar: u.avatar,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                senderId: lastMessage.sender_id,
                createdAt: lastMessage.created_at,
                type: lastMessage.type,
              }
            : null,
        };
      })
    );

    // Get total count
    const total = await prisma.conversation_participants.count({
      where: {
        user_id: userId,
        ...(includeArchived ? {} : { is_archived: false }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: conversationsWithUnread,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Conversations fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch conversations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations
 * Create a new conversation or return existing one
 *
 * Body:
 * - participantIds: number[] (required)
 * - type: 'direct' | 'group' (default: 'direct')
 * - title: string (optional, for group chats)
 * - adId: number (optional, links conversation to an ad)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const { participantIds, type = 'direct', title, adId } = body;

    // Validate
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Participant IDs are required' },
        { status: 400 }
      );
    }

    // For direct messages, check if conversation already exists
    if (type === 'direct' && participantIds.length === 1) {
      const otherUserId = participantIds[0];

      // Find existing direct conversation between these two users
      const existingConversation = await prisma.conversations.findFirst({
        where: {
          type: 'direct',
          conversation_participants: {
            every: {
              user_id: { in: [userId, otherUserId] },
            },
          },
          AND: [
            {
              conversation_participants: {
                some: { user_id: userId },
              },
            },
            {
              conversation_participants: {
                some: { user_id: otherUserId },
              },
            },
          ],
        },
        select: {
          id: true,
          type: true,
          title: true,
          ad_id: true,
          created_at: true,
          conversation_participants: {
            where: { user_id: { not: userId } },
            select: {
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

      if (existingConversation) {
        const otherParticipants = existingConversation.conversation_participants.map(
          (cp) => cp.users
        );

        return NextResponse.json(
          {
            success: true,
            data: {
              id: existingConversation.id,
              type: existingConversation.type,
              title: existingConversation.title,
              adId: existingConversation.ad_id,
              createdAt: existingConversation.created_at,
              participants: otherParticipants.map((u) => ({
                id: u.id,
                fullName: u.full_name,
                avatar: u.avatar,
              })),
              isExisting: true,
            },
          },
          { status: 200 }
        );
      }
    }

    // Create new conversation
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    const newConversation = await prisma.conversations.create({
      data: {
        type,
        title: title || null,
        ad_id: adId || null,
        conversation_participants: {
          create: allParticipantIds.map((id) => ({
            user_id: id,
          })),
        },
      },
      select: {
        id: true,
        type: true,
        title: true,
        ad_id: true,
        created_at: true,
        conversation_participants: {
          where: { user_id: { not: userId } },
          select: {
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

    const otherParticipants = newConversation.conversation_participants.map(
      (cp) => cp.users
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newConversation.id,
          type: newConversation.type,
          title: newConversation.title,
          adId: newConversation.ad_id,
          createdAt: newConversation.created_at,
          participants: otherParticipants.map((u) => ({
            id: u.id,
            fullName: u.full_name,
            avatar: u.avatar,
          })),
          isExisting: false,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Conversation create error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create conversation',
      },
      { status: 500 }
    );
  }
}
