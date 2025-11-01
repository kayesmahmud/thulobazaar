import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/users/:id/unsuspend
 * Unsuspend a user
 * Requires: Editor or Super Admin role
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

    // Update user - clear all suspension fields
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        is_suspended: false,
        suspended_at: null,
        suspended_until: null,
        suspended_by: null,
        suspension_reason: null,
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_suspended: true,
      },
    });

    console.log(`✅ User ${userId} unsuspended by editor ${editor.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User unsuspended successfully',
        data: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          isSuspended: user.is_suspended,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User unsuspension error:', error);

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
        message: 'Failed to unsuspend user',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
