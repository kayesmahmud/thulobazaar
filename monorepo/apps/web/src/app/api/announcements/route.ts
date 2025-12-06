import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * Helper function to determine user's matching audience types
 */
function getUserAudienceTypes(user: {
  created_at: Date | null;
  business_verification_status: string | null;
  individual_verified: boolean | null;
}): string[] {
  const audiences: string[] = ['all_users']; // Everyone gets all_users

  // Check if new user (1-3 months old)
  if (user.created_at) {
    const now = new Date();
    const accountAge = now.getTime() - new Date(user.created_at).getTime();
    const monthsOld = accountAge / (1000 * 60 * 60 * 24 * 30);

    if (monthsOld >= 1 && monthsOld <= 3) {
      audiences.push('new_users');
    }
  }

  // Check business verified
  if (user.business_verification_status === 'approved') {
    audiences.push('business_verified');
  }

  // Check individual verified
  if (user.individual_verified === true) {
    audiences.push('individual_verified');
  }

  return audiences;
}

/**
 * GET /api/announcements
 * Get all announcements for the authenticated user based on their audience type
 *
 * Query params:
 * - includeRead: boolean (default: false) - Include already read announcements
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const includeRead = searchParams.get('includeRead') === 'true';

    // Get user details to determine audience types
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        created_at: true,
        business_verification_status: true,
        individual_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Determine which audiences this user belongs to
    const userAudiences = getUserAudienceTypes(user);

    // Build where clause
    const whereClause: any = {
      is_active: true,
      target_audience: { in: userAudiences },
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } },
      ],
    };

    // Exclude already read announcements unless includeRead is true
    if (!includeRead) {
      whereClause.NOT = {
        announcement_read_receipts: {
          some: { user_id: userId },
        },
      };
    }

    // Fetch announcements
    const announcements = await prisma.announcements.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        target_audience: true,
        created_at: true,
        expires_at: true,
        announcement_read_receipts: {
          where: { user_id: userId },
          select: { read_at: true },
        },
      },
    });

    // Transform response
    const response = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      targetAudience: a.target_audience,
      createdAt: a.created_at,
      expiresAt: a.expires_at,
      isRead: a.announcement_read_receipts.length > 0,
      readAt: a.announcement_read_receipts[0]?.read_at || null,
    }));

    // Count unread
    const unreadCount = response.filter((a) => !a.isRead).length;

    return NextResponse.json({
      success: true,
      data: response,
      unreadCount,
    });
  } catch (error: unknown) {
    console.error('Announcements fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}
