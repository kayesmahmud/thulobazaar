import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAdmin } from '@/lib/jwt';

/**
 * PUT /api/admin/users/:id/promote
 * Promote a user to editor role
 * Requires: Super Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate super admin
    await requireAdmin(request);

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Check if user exists and is not already an editor
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.role === 'editor' || user.role === 'super_admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'User is already an editor or super admin',
        },
        { status: 400 }
      );
    }

    // Promote user to editor
    await prisma.users.update({
      where: { id: userId },
      data: { role: 'editor' },
    });

    console.log('Promoted user to editor:', { userId, email: user.email });

    return NextResponse.json(
      {
        success: true,
        message: 'User promoted to editor successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Promote user error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden') || error.message.includes('Super Admin')) {
      return NextResponse.json(
        { success: false, message: 'Super Admin access required' },
        { status: 403 }
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
