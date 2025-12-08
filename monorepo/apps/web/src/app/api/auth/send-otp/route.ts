import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import {
  validateNepaliPhone,
  formatPhoneNumber,
  generateOtp,
  sendOtpSms,
  getOtpExpiry,
  type OtpPurpose,
} from '@/lib/aakashSms';

const sendOtpSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  purpose: z.enum(['registration', 'login', 'password_reset']).default('registration'),
}).refine((data) => data.phone || data.email, {
  message: 'Either phone or email is required',
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

    const { phone, email, purpose } = validation.data;

    // Determine if using phone or email
    const usePhone = !!phone;
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;
    const identifier = usePhone ? formattedPhone : email;

    // Validate phone if provided
    if (usePhone && formattedPhone && !validateNepaliPhone(formattedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.',
        },
        { status: 400 }
      );
    }

    // For registration, check if phone/email is already registered
    if (purpose === 'registration') {
      const existingUser = await prisma.users.findFirst({
        where: usePhone
          ? { phone: formattedPhone!, phone_verified: true }
          : { email: email! },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: usePhone
              ? 'This phone number is already registered'
              : 'This email is already registered',
          },
          { status: 400 }
        );
      }
    }

    // For login, check if phone is registered (only for phone)
    if (purpose === 'login' && usePhone) {
      const existingUser = await prisma.users.findFirst({
        where: {
          phone: formattedPhone!,
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

    // For password_reset, check if account exists
    if (purpose === 'password_reset') {
      const existingUser = await prisma.users.findFirst({
        where: usePhone
          ? { phone: formattedPhone!, is_active: true }
          : { email: email!, is_active: true },
      });

      if (!existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: `No account found with this ${usePhone ? 'phone number' : 'email'}`,
          },
          { status: 404 }
        );
      }

      if (existingUser.is_suspended) {
        return NextResponse.json(
          {
            success: false,
            message: 'Your account has been suspended. Please contact support.',
          },
          { status: 403 }
        );
      }

      // For email-based password reset, check if user has a password (not OAuth-only)
      if (!usePhone && !existingUser.password_hash) {
        return NextResponse.json(
          {
            success: false,
            message: 'This account uses social login (Google/Facebook). Password reset is not available.',
          },
          { status: 400 }
        );
      }
    }

    // Check for recent OTP (cooldown)
    const recentOtp = await prisma.phone_otps.findFirst({
      where: {
        phone: identifier!,
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
        phone: identifier!,
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

    // Invalidate previous unused OTPs
    await prisma.phone_otps.updateMany({
      where: {
        phone: identifier!,
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
        phone: identifier!,
        otp_code: otp,
        purpose,
        expires_at: expiresAt,
      },
    });

    // Send OTP
    if (usePhone && formattedPhone) {
      // Send via SMS with purpose-specific message
      const smsResult = await sendOtpSms(formattedPhone, otp, purpose as OtpPurpose);

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
      console.log(`OTP sent via SMS to ${formattedPhone} for ${purpose}`);
    } else if (email) {
      // For email, just log for now (email service can be added later)
      // In production, integrate with email service like Resend, SendGrid, etc.
      console.log(`OTP for ${email} (${purpose}): ${otp}`);
      // TODO: Implement email sending
      // For now, we'll just store the OTP and let users know it's logged
    }

    return NextResponse.json(
      {
        success: true,
        message: usePhone
          ? 'OTP sent successfully via SMS'
          : 'OTP sent successfully to your email',
        identifier: usePhone ? formattedPhone : email,
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
