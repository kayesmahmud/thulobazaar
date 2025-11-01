import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/users/:id/suspend
 * Suspend a user
 * Requires: Editor or Super Admin role
 *
 * Body:
 * - reason: string (required)
 * - duration: number (optional, in days, null = permanent)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor
    const editor = await requireEditor(request);

    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { reason, duration } = body;

    // Validate required fields
    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message: 'Suspension reason is required',
        },
        { status: 400 }
      );
    }

    // Calculate suspended_until date if duration provided
    let suspendedUntil: Date | null = null;
    if (duration && duration > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + duration);
    }

    // Update user
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        is_suspended: true,
        suspended_at: new Date(),
        suspended_until: suspendedUntil,
        suspended_by: editor.userId,
        suspension_reason: reason,
        is_active: false,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_suspended: true,
        suspended_until: true,
        suspension_reason: true,
      },
    });

    console.log(`⛔ User ${userId} suspended by editor ${editor.userId}. Reason: ${reason}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User suspended successfully',
        data: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          isSuspended: user.is_suspended,
          suspendedUntil: user.suspended_until,
          suspensionReason: user.suspension_reason,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User suspension error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to suspend user',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
