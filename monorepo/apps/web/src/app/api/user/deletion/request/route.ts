import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';
import {
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
  formatPhoneNumber,
} from '@/lib/sms';

const MAX_OTP_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 60;

/**
 * POST /api/user/deletion/request
 * Request account deletion - sends OTP to user's verified phone
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // Get user with verified phone
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        phone_verified: true,
        deleted_at: true,
        is_suspended: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if account is already deleted
    if (user.deleted_at) {
      return NextResponse.json(
        { success: false, message: 'Account is already scheduled for deletion' },
        { status: 400 }
      );
    }

    // Check if account is suspended
    if (user.is_suspended) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete a suspended account. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if user has a verified phone
    if (!user.phone || !user.phone_verified) {
      return NextResponse.json(
        { success: false, message: 'You need a verified phone number to delete your account' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(user.phone);
    const purpose = 'account_deletion';

    // Check for recent OTP (cooldown)
    const recentOtp = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        created_at: {
          gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (recentOtp) {
      const secondsRemaining = Math.ceil(
        (OTP_COOLDOWN_SECONDS * 1000 - (Date.now() - recentOtp.created_at.getTime())) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${secondsRemaining} seconds before requesting a new OTP`,
          cooldownRemaining: secondsRemaining,
        },
        { status: 429 }
      );
    }

    // Check max attempts in last hour
    const recentAttempts = await prisma.phone_otps.count({
      where: {
        phone: formattedPhone,
        purpose,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (recentAttempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many OTP requests. Please try again after 1 hour.',
        },
        { status: 429 }
      );
    }

    // Invalidate previous unused OTPs
    await prisma.phone_otps.updateMany({
      where: {
        phone: formattedPhone,
        purpose,
        is_used: false,
      },
      data: {
        is_used: true,
      },
    });

    // Generate and save new OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry();

    await prisma.phone_otps.create({
      data: {
        phone: formattedPhone,
        otp_code: otp,
        purpose,
        expires_at: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(formattedPhone, otp, 'account_deletion');

    if (!smsResult.success) {
      console.error('Failed to send account deletion OTP:', smsResult.error);
      return NextResponse.json(
        { success: false, message: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    // Mask phone for display (e.g., 98****5678)
    const maskedPhone = formattedPhone.slice(0, 2) + '****' + formattedPhone.slice(-4);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      phone: maskedPhone,
      expiresIn: 600, // 10 minutes
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Request deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
