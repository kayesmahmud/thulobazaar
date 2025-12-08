import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { formatPhoneNumber, validateNepaliPhone } from '@/lib/aakashSms';

const phoneLoginSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = phoneLoginSchema.safeParse(body);
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

    const { phone, password } = validation.data;
    const formattedPhone = formatPhoneNumber(phone);

    if (!validateNepaliPhone(formattedPhone)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid phone number format',
        },
        { status: 400 }
      );
    }

    // Find the user with this phone number
    const user = await prisma.users.findFirst({
      where: {
        phone: formattedPhone,
        phone_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'No account found with this phone number',
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        },
        { status: 403 }
      );
    }

    // Check if user is suspended
    if (user.is_suspended) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account has been suspended. Please contact support.',
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
          message: 'Invalid password',
        },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fullName: user.full_name,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          phoneVerified: user.phone_verified,
          role: user.role,
          shopSlug: user.shop_slug,
          accountType: user.account_type,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
