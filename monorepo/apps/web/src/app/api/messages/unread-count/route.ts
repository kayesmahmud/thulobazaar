import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Get all conversations user is participating in
    const participants = await prisma.conversation_participants.findMany({
      where: {
        user_id: userId,
        is_archived: false,
      },
      select: {
        conversation_id: true,
        last_read_at: true,
      },
    });

    // Count unread messages across all conversations
    let totalUnread = 0;

    for (const p of participants) {
      const unreadCount = await prisma.messages.count({
        where: {
          conversation_id: p.conversation_id,
          sender_id: { not: userId },
          created_at: { gt: p.last_read_at || new Date(0) },
        },
      });
      totalUnread += unreadCount;
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          unreadCount: totalUnread,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Unread count fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch unread count',
      },
      { status: 500 }
    );
  }
}
