import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/messages/search-users
 * Search for users to start a conversation with
 *
 * Query params:
 * - q: search query (required)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Search users by name or email (exclude current user)
    const users = await prisma.users.findMany({
      where: {
        id: { not: userId },
        is_active: true,
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        full_name: true,
        avatar: true,
        account_type: true,
        business_name: true,
      },
      take: 20,
    });

    const transformedUsers = users.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      avatar: u.avatar,
      accountType: u.account_type,
      businessName: u.business_name,
    }));

    return NextResponse.json(
      {
        success: true,
        data: transformedUsers,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('User search error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to search users' },
      { status: 500 }
    );
  }
}
