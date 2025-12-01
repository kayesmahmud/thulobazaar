import { NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { createToken } from '@/lib/jwt';

/**
 * POST /api/auth/refresh-token
 * Generate a fresh JWT for the given email.
 * Used by the web app to get a backend token without hitting the external Express server.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await prisma.users.findFirst({
      where: { email, is_active: true },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        data: { token },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
