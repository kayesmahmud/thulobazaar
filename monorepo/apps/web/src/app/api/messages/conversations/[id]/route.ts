import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/messages/conversations/:id
 * Get a specific conversation with its messages
 *
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseInt(id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is a participant
    const participant = await prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch conversation with messages
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId },
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
            price: true,
            ad_images: {
              where: { is_primary: true },
              select: { file_path: true },
              take: 1,
            },
          },
        },
        conversation_participants: {
          select: {
            user_id: true,
            is_muted: true,
            is_archived: true,
            last_read_at: true,
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

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch messages
    const messages = await prisma.messages.findMany({
      where: { conversation_id: conversationId },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        attachment_url: true,
        is_edited: true,
        edited_at: true,
        is_deleted: true,
        deleted_at: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get total message count
    const totalMessages = await prisma.messages.count({
      where: { conversation_id: conversationId },
    });

    // Update last_read_at for current user
    await prisma.conversation_participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: {
        last_read_at: new Date(),
      },
    });

    // Get current user's participant info
    const currentUserParticipant = conversation.conversation_participants.find(
      (p) => p.user_id === userId
    );

    // Transform response
    const response = {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      adId: conversation.ad_id,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      lastMessageAt: conversation.last_message_at,
      isMuted: currentUserParticipant?.is_muted || false,
      isArchived: currentUserParticipant?.is_archived || false,
      ad: conversation.ads
        ? {
            id: conversation.ads.id,
            title: conversation.ads.title,
            slug: conversation.ads.slug,
            price: conversation.ads.price
              ? parseFloat(conversation.ads.price.toString())
              : null,
            image: conversation.ads.ad_images[0]?.file_path || null,
          }
        : null,
      participants: conversation.conversation_participants.map((p) => ({
        id: p.users.id,
        fullName: p.users.full_name,
        avatar: p.users.avatar,
        isCurrentUser: p.user_id === userId,
      })),
      messages: messages.reverse().map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.is_deleted ? '[Message deleted]' : m.content,
        type: m.type,
        attachmentUrl: m.attachment_url,
        isEdited: m.is_edited,
        editedAt: m.edited_at,
        isDeleted: m.is_deleted,
        createdAt: m.created_at,
        sender: {
          id: m.users.id,
          fullName: m.users.full_name,
          avatar: m.users.avatar,
        },
        isOwnMessage: m.sender_id === userId,
      })),
      pagination: {
        total: totalMessages,
        limit,
        offset,
        hasMore: offset + limit < totalMessages,
      },
    };

    return NextResponse.json(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Conversation fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations/:id
 * Send a message to the conversation
 *
 * Body:
 * - content: string (required)
 * - type: 'text' | 'image' | 'file' (default: 'text')
 * - attachmentUrl: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseInt(id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, type = 'text', attachmentUrl } = body;

    // For text messages, content is required
    // For image/file messages, content is optional (can be a caption)
    const isAttachmentMessage = type === 'image' || type === 'file';

    if (!isAttachmentMessage && (!content || content.trim().length === 0)) {
      return NextResponse.json(
        { success: false, message: 'Message content is required' },
        { status: 400 }
      );
    }

    // For attachment messages, require the attachment URL
    if (isAttachmentMessage && !attachmentUrl) {
      return NextResponse.json(
        { success: false, message: 'Attachment URL is required for image/file messages' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.messages.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: content?.trim() || '', // Empty string for image-only messages
        type,
        attachment_url: attachmentUrl || null,
      },
      select: {
        id: true,
        sender_id: true,
        content: true,
        type: true,
        attachment_url: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation last_message_at
    await prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    });

    // Update sender's last_read_at
    await prisma.conversation_participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { last_read_at: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          senderId: message.sender_id,
          content: message.content,
          type: message.type,
          attachmentUrl: message.attachment_url,
          createdAt: message.created_at,
          sender: {
            id: message.users.id,
            fullName: message.users.full_name,
            avatar: message.users.avatar,
          },
          isOwnMessage: true,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Message send error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/messages/conversations/:id
 * Leave a conversation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const conversationId = parseInt(id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid conversation ID' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversation_participants.findUnique({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Remove user from conversation
    await prisma.conversation_participants.delete({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
    });

    // Check if any participants remain
    const remainingParticipants = await prisma.conversation_participants.count({
      where: { conversation_id: conversationId },
    });

    // If no participants remain, delete the conversation
    if (remainingParticipants === 0) {
      await prisma.conversations.delete({
        where: { id: conversationId },
      });
    }

    return NextResponse.json(
      { success: true, message: 'Left conversation successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Leave conversation error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to leave conversation' },
      { status: 500 }
    );
  }
}
