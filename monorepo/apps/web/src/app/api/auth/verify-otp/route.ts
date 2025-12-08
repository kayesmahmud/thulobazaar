import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/aakashSms';

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['registration', 'login', 'password_reset']).default('registration'),
});

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = verifyOtpSchema.safeParse(body);
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

    const { phone, otp, purpose } = validation.data;
    const formattedPhone = formatPhoneNumber(phone);

    // Find the most recent valid OTP for this phone
    const otpRecord = await prisma.phone_otps.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
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
          message: 'OTP expired or not found. Please request a new OTP.',
        },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= MAX_VERIFY_ATTEMPTS) {
      // Mark OTP as used (invalidated)
      await prisma.phone_otps.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.',
        },
        { status: 429 }
      );
    }

    // Verify OTP
    if (otpRecord.otp_code !== otp) {
      // Increment attempt counter
      await prisma.phone_otps.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = MAX_VERIFY_ATTEMPTS - otpRecord.attempts - 1;
      return NextResponse.json(
        {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // OTP is valid - mark as used
    await prisma.phone_otps.update({
      where: { id: otpRecord.id },
      data: { is_used: true },
    });

    console.log(`OTP verified successfully for ${formattedPhone} (${purpose})`);

    // Return verification token for registration flow
    const verificationToken = Buffer.from(
      JSON.stringify({
        phone: formattedPhone,
        purpose,
        verifiedAt: Date.now(),
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
      })
    ).toString('base64');

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified successfully',
        phone: formattedPhone,
        verificationToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
