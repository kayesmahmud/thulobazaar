import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

const VALID_AUDIENCES = ['all_users', 'new_users', 'business_verified', 'individual_verified'] as const;
type AudienceType = typeof VALID_AUDIENCES[number];

/**
 * Helper function to get audience count
 */
async function getAudienceCount(audience: AudienceType): Promise<number> {
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  switch (audience) {
    case 'all_users':
      return prisma.users.count({ where: { is_active: true } });

    case 'new_users':
      return prisma.users.count({
        where: {
          is_active: true,
          created_at: {
            gte: threeMonthsAgo,
            lte: oneMonthAgo,
          },
        },
      });

    case 'business_verified':
      return prisma.users.count({
        where: {
          is_active: true,
          business_verification_status: 'approved',
        },
      });

    case 'individual_verified':
      return prisma.users.count({
        where: {
          is_active: true,
          individual_verified: true,
        },
      });

    default:
      return 0;
  }
}

/**
 * GET /api/super-admin/announcements
 * Get all announcements with analytics
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      prisma.announcements.findMany({
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          content: true,
          target_audience: true,
          created_at: true,
          expires_at: true,
          is_active: true,
          created_by: true,
          users: {
            select: {
              full_name: true,
            },
          },
          _count: {
            select: {
              announcement_read_receipts: true,
            },
          },
        },
      }),
      prisma.announcements.count(),
    ]);

    // Get audience counts for each announcement
    const announcementsWithStats = await Promise.all(
      announcements.map(async (a) => {
        const audienceCount = await getAudienceCount(a.target_audience as AudienceType);
        const readCount = a._count.announcement_read_receipts;
        const readRate = audienceCount > 0 ? ((readCount / audienceCount) * 100).toFixed(1) : '0';

        return {
          id: a.id,
          title: a.title,
          content: a.content,
          targetAudience: a.target_audience,
          createdAt: a.created_at,
          expiresAt: a.expires_at,
          isActive: a.is_active,
          createdByName: a.users.full_name,
          stats: {
            totalAudience: audienceCount,
            readCount,
            readRate: parseFloat(readRate),
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: announcementsWithStats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('Announcements fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super-admin/announcements
 * Create a new announcement
 *
 * Body:
 * - title: string (required)
 * - content: string (required)
 * - targetAudience: 'all_users' | 'new_users' | 'business_verified' | 'individual_verified' (default: 'all_users')
 * - expiresAt: ISO date string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const adminId = await requireSuperAdmin(request);

    const body = await request.json();
    const { title, content, targetAudience = 'all_users', expiresAt } = body;

    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, message: 'Content is required' },
        { status: 400 }
      );
    }

    // Validate target audience
    if (!VALID_AUDIENCES.includes(targetAudience)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid target audience. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Create announcement
    const announcement = await prisma.announcements.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        target_audience: targetAudience as AudienceType,
        expires_at: expiresAt ? new Date(expiresAt) : null,
        created_by: adminId,
        is_active: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        target_audience: true,
        created_at: true,
        expires_at: true,
        is_active: true,
      },
    });

    // Get audience count for response
    const audienceCount = await getAudienceCount(targetAudience as AudienceType);

    return NextResponse.json(
      {
        success: true,
        message: 'Announcement created successfully',
        data: {
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          targetAudience: announcement.target_audience,
          createdAt: announcement.created_at,
          expiresAt: announcement.expires_at,
          isActive: announcement.is_active,
          stats: {
            totalAudience: audienceCount,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Announcement create error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
