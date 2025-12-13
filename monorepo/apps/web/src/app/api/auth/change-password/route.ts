import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';

const BCRYPT_SALT_ROUNDS = 12;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: parseInt(session.user.id, 10) },
      select: {
        id: true,
        password_hash: true,
        oauth_provider: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password_hash) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password change is not available for social login accounts',
        },
        { status: 400 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update the password
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        updated_at: new Date(),
      },
    });

    console.log(`Password changed successfully for user ID: ${user.id}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
