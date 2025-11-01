import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import bcrypt from 'bcrypt';

/**
 * PUT /api/profile/password
 * Change user password
 *
 * Body:
 * - currentPassword: string (required)
 * - newPassword: string (required, min 6 chars)
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password and new password are required',
        },
        { status: 400 }
      );
    }

    // Validate new password
    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    // Get user with password hash
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password_hash: true,
      },
    });

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect',
        },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date(),
      },
    });

    console.log(`✅ User ${userId} changed password successfully`);

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Password change error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to change password',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
