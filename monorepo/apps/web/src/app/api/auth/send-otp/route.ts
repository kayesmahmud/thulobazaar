import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import {
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
} from '@/lib/aakashSms';

const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  purpose: z.enum(['registration', 'login', 'password_reset']).default('registration'),
});

const MAX_OTP_ATTEMPTS = 3;
const OTP_COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = sendOtpSchema.safeParse(body);
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

    const { phone, purpose } = validation.data;
    const formattedPhone = formatPhoneNumber(phone);

    if (!validateNepaliPhone(formattedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.',
        },
        { status: 400 }
      );
    }

    // For registration, check if phone is already registered
    if (purpose === 'registration') {
      const existingUser = await prisma.users.findFirst({
        where: {
          phone: formattedPhone,
          phone_verified: true,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'This phone number is already registered',
          },
          { status: 400 }
        );
      }
    }

    // For login, check if phone is registered
    if (purpose === 'login') {
      const existingUser = await prisma.users.findFirst({
        where: {
          phone: formattedPhone,
          phone_verified: true,
          is_active: true,
        },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'No account found with this phone number',
          },
          { status: 404 }
        );
      }

      // Check if user is suspended
      if (existingUser.is_suspended) {
        return NextResponse.json(
          {
            success: false,
            message: 'Your account has been suspended. Please contact support.',
          },
          { status: 403 }
        );
      }
    }

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

    // Check if user has exceeded max attempts
    const recentAttempts = await prisma.phone_otps.count({
      where: {
        phone: formattedPhone,
        purpose,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
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

    // Invalidate previous unused OTPs for this phone
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

    // Generate new OTP
    const otp = generateOtp();
    const expiresAt = getOtpExpiry();

    // Save OTP to database
    await prisma.phone_otps.create({
      data: {
        phone: formattedPhone,
        otp_code: otp,
        purpose,
        expires_at: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(formattedPhone, otp);

    if (!smsResult.success) {
      console.error('Failed to send OTP SMS:', smsResult.error);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send OTP. Please try again.',
        },
        { status: 500 }
      );
    }

    console.log(`OTP sent to ${formattedPhone} for ${purpose}`);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully',
        phone: formattedPhone,
        expiresIn: 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
