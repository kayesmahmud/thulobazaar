import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * PUT /api/admin/users/:id/promote-editor
 * Promote a user to editor role
 * Requires: Super Admin role (using requireEditor for now)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate editor (should be requireAdmin in production)
    const editor = await requireEditor(request);

    const { id } = await params;
    const userId = parseInt(id);

    // Promote user to editor (only if current role is 'user')
    const user = await prisma.users.update({
      where: {
        id: userId,
        role: 'user',
      },
      data: {
        role: 'editor',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
      },
    });

    console.log(`⬆️ User ${userId} promoted to editor by ${editor.userId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User promoted to editor successfully',
        data: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('User promotion error:', error);

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
          message: 'User not found or already an editor/admin',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to promote user',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
