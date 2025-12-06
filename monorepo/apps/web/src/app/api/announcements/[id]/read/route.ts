import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * POST /api/announcements/[id]/read
 * Mark an announcement as read for the authenticated user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid announcement ID' },
        { status: 400 }
      );
    }

    // Check if announcement exists
    const announcement = await prisma.announcements.findUnique({
      where: { id: announcementId },
      select: { id: true },
    });

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Create read receipt (upsert to handle duplicate calls)
    await prisma.announcement_read_receipts.upsert({
      where: {
        announcement_id_user_id: {
          announcement_id: announcementId,
          user_id: userId,
        },
      },
      create: {
        announcement_id: announcementId,
        user_id: userId,
      },
      update: {}, // No update needed, just ensure exists
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement marked as read',
    });
  } catch (error: unknown) {
    console.error('Mark announcement read error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to mark announcement as read' },
      { status: 500 }
    );
  }
}
