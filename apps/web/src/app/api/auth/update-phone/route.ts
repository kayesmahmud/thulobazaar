import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { updatePhone } from '@thulobazaar/auth-core';

// Thin wrapper over the shared updatePhone. The shared logic validates the
// HMAC-signed verification token, re-checks the number isn't taken by another
// account (excluding this user), then persists — same code the API uses.
const updatePhoneSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  verificationToken: z.string().min(1, 'Verification token is required'),
  // Proof of entitlement to move an already-verified number. Optional: adding
  // a first number needs none, and the requirement is gated by the
  // require_phone_change_proof setting.
  currentPassword: z.string().min(1).optional(),
  oldNumberOtpToken: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
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

    const { phone, verificationToken, currentPassword, oldNumberOtpToken } =
      validation.data;
    const userId = parseInt(session.user.id, 10);

    // Twin of the Express route — dropping the proof here would deny every
    // verified user once require_phone_change_proof is switched on.
    const result = await updatePhone(userId, phone, verificationToken, {
      currentPassword,
      oldNumberOtpToken,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error, requires: result.requires },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Phone number verified and updated successfully',
        data: {
          phone: result.phone,
          phoneVerified: result.phoneVerified,
          phoneVerifiedAt: result.phoneVerifiedAt,
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
