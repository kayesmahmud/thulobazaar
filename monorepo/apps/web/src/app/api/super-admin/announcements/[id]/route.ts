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
 * GET /api/super-admin/announcements/[id]
 * Get a single announcement with detailed analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid announcement ID' },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcements.findUnique({
      where: { id: announcementId },
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
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Get audience count
    const audienceCount = await getAudienceCount(announcement.target_audience as AudienceType);
    const readCount = announcement._count.announcement_read_receipts;
    const readRate = audienceCount > 0 ? ((readCount / audienceCount) * 100).toFixed(1) : '0';

    // Get read timeline (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const readTimeline = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(read_at) as date, COUNT(*) as count
      FROM announcement_read_receipts
      WHERE announcement_id = ${announcementId}
        AND read_at >= ${sevenDaysAgo}
      GROUP BY DATE(read_at)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        targetAudience: announcement.target_audience,
        createdAt: announcement.created_at,
        expiresAt: announcement.expires_at,
        isActive: announcement.is_active,
        createdByName: announcement.users.full_name,
        stats: {
          totalAudience: audienceCount,
          readCount,
          readRate: parseFloat(readRate),
          unreadCount: audienceCount - readCount,
        },
        timeline: readTimeline.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Announcement fetch error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch announcement' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/super-admin/announcements/[id]
 * Update an announcement
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid announcement ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, targetAudience, expiresAt, isActive } = body;

    // Validate target audience if provided
    if (targetAudience && !VALID_AUDIENCES.includes(targetAudience)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid target audience. Must be one of: ${VALID_AUDIENCES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (targetAudience !== undefined) updateData.target_audience = targetAudience;
    if (expiresAt !== undefined) updateData.expires_at = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) updateData.is_active = isActive;

    const updated = await prisma.announcements.update({
      where: { id: announcementId },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      data: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        targetAudience: updated.target_audience,
        createdAt: updated.created_at,
        expiresAt: updated.expires_at,
        isActive: updated.is_active,
      },
    });
  } catch (error: unknown) {
    console.error('Announcement update error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/super-admin/announcements/[id]
 * Delete an announcement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid announcement ID' },
        { status: 400 }
      );
    }

    await prisma.announcements.delete({
      where: { id: announcementId },
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Announcement delete error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
