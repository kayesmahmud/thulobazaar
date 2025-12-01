import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { createToken } from '@/lib/jwt';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = loginSchema.safeParse(body);
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

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        full_name: true,
        phone: true,
        role: true,
        is_active: true,
        is_suspended: true,
        avatar: true,
        account_type: true,
        business_name: true,
        business_verification_status: true,
        individual_verified: true,
        shop_slug: true,
        seller_slug: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is inactive. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Check if user is suspended
    if (user.is_suspended) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is suspended. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
    });

    // Prepare user response (camelCase for frontend)
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      accountType: user.account_type,
      businessName: user.business_name,
      businessVerificationStatus: user.business_verification_status,
      individualVerified: user.individual_verified,
      shopSlug: user.shop_slug,
      sellerSlug: user.seller_slug,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
