import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/sms';

const BCRYPT_SALT_ROUNDS = 12;

const resetPasswordSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = resetPasswordSchema.safeParse(body);
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

    const { phone, otp, newPassword } = validation.data;

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Find the OTP record for this specific phone number
    const otpRecord = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        otp_code: otp,
        purpose: 'password_reset',
        is_used: false,
        expires_at: {
          gte: new Date(),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired OTP. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Find the user by phone number
    const user = await prisma.users.findFirst({
      where: {
        phone: formattedPhone,
        is_active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
        },
        { status: 404 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update user password
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    // Mark OTP as used
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });

    // Invalidate all other password reset OTPs for this phone
    await prisma.phone_otps.updateMany({
      where: {
        phone: formattedPhone,
        purpose: 'password_reset',
        is_used: false,
      },
      data: { is_used: true },
    });

    console.log(`Password reset successful for user: ${user.email || user.phone}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
