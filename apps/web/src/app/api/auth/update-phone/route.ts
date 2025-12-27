import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { formatPhoneNumber, validateNepaliPhone } from '@/lib/sms';

const updatePhoneSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  verificationToken: z.string().min(1, 'Verification token is required'),
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

    const validation = updatePhoneSchema.safeParse(body);
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

    const { phone, verificationToken } = validation.data;
    const formattedPhone = formatPhoneNumber(phone);

    // Validate Nepali phone number
    if (!validateNepaliPhone(formattedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid Nepali phone number. Must be 10 digits starting with 97 or 98.',
        },
        { status: 400 }
      );
    }

    // Decode and validate verification token
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(verificationToken, 'base64').toString());
    } catch (err) {
      console.warn('Invalid verification token format:', err);
      return NextResponse.json(
        { success: false, message: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Verify token structure and expiry
    if (!tokenData.identifier || !tokenData.verifiedAt || !tokenData.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification token structure' },
        { status: 400 }
      );
    }

    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json(
        { success: false, message: 'Verification token has expired. Please verify again.' },
        { status: 400 }
      );
    }

    // Verify the token's phone matches the request phone
    if (tokenData.identifier !== formattedPhone) {
      return NextResponse.json(
        { success: false, message: 'Phone number does not match verification' },
        { status: 400 }
      );
    }

    // Verify purpose is phone_verification
    if (tokenData.purpose !== 'phone_verification') {
      return NextResponse.json(
        { success: false, message: 'Invalid verification purpose' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id, 10);

    // Check if this phone is already verified by another user
    const existingVerifiedUser = await prisma.users.findFirst({
      where: {
        phone: formattedPhone,
        phone_verified: true,
        id: { not: userId },
      },
    });

    if (existingVerifiedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'This phone number is already verified by another account',
        },
        { status: 400 }
      );
    }

    // Update user's phone and mark as verified
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        phone: formattedPhone,
        phone_verified: true,
        phone_verified_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        phone: true,
        phone_verified: true,
        phone_verified_at: true,
      },
    });

    // Mark any OTPs as used
    await prisma.phone_otps.updateMany({
      where: {
        phone: formattedPhone,
        purpose: 'phone_verification',
        is_used: false,
      },
      data: {
        is_used: true,
      },
    });

    console.log(`Phone updated successfully for user ID: ${userId} to ${formattedPhone}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified and updated successfully',
        data: {
          phone: updatedUser.phone,
          phoneVerified: updatedUser.phone_verified,
          phoneVerifiedAt: updatedUser.phone_verified_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update phone error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
