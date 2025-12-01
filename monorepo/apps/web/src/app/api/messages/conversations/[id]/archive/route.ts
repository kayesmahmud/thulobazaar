import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * PUT /api/messages/conversations/:id/archive
 * Archive or unarchive a conversation
 *
 * Body:
 * - isArchived: boolean (required)
 */
export async function PUT(
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
    const { isArchived } = body;

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'isArchived must be a boolean' },
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

    // Update archive status
    await prisma.conversation_participants.update({
      where: {
        conversation_id_user_id: {
          conversation_id: conversationId,
          user_id: userId,
        },
      },
      data: { is_archived: isArchived },
    });

    return NextResponse.json(
      {
        success: true,
        message: isArchived
          ? 'Conversation archived'
          : 'Conversation unarchived',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Archive conversation error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to archive conversation' },
      { status: 500 }
    );
  }
}
