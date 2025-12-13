import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/messages/unread-count
 * Get total unread message count for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Single query to count all unread messages across all conversations
    // This avoids N+1 by using a subquery/join instead of looping
    const result = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM messages m
      INNER JOIN conversation_participants cp
        ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = ${userId}
        AND cp.is_archived = false
        AND m.sender_id != ${userId}
        AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamp)
    `;

    const totalUnread = Number(result[0]?.count || 0);

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
