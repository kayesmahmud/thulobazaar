import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { formatPhoneNumber } from '@/lib/sms';

const confirmSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * POST /api/user/deletion/confirm
 * Confirm account deletion with OTP - soft deletes the account
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();

    const validation = confirmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid OTP format',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { otp } = validation.data;

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        phone_verified: true,
        deleted_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.deleted_at) {
      return NextResponse.json(
        { success: false, message: 'Account is already scheduled for deletion' },
        { status: 400 }
      );
    }

    if (!user.phone || !user.phone_verified) {
      return NextResponse.json(
        { success: false, message: 'No verified phone number found' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(user.phone);
    const purpose = 'account_deletion';

    // Find valid OTP
    const validOtp = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        otp_code: otp,
        purpose,
        is_used: false,
        expires_at: { gte: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!validOtp) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as used and soft delete user in a transaction
    const now = new Date();
    await prisma.$transaction([
      prisma.phone_otps.update({
        where: { id: validOtp.id },
        data: { is_used: true },
      }),
      prisma.users.update({
        where: { id: userId },
        data: {
          deleted_at: now,
          deletion_requested_at: now,
          is_active: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion. You have 30 days to recover it by logging in.',
      recoveryDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Confirm deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
