import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateUniqueShopSlug } from '@/lib/urls';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  phoneVerificationToken: z.string().optional(),
});

// Helper to validate phone verification token
function validatePhoneToken(token: string): { phone: string; expiresAt: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.expiresAt < Date.now()) {
      return null;
    }
    if (decoded.purpose !== 'registration') {
      return null;
    }
    // Handle both old format (phone) and new format (identifier)
    const phone = decoded.phone || decoded.identifier;
    if (!phone) {
      return null;
    }
    return { phone, expiresAt: decoded.expiresAt };
  } catch (err) {
    console.debug('Phone token decode failed:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = registerSchema.safeParse(body);
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

    const { email, password, fullName, phone, phoneVerificationToken } = validation.data;

    // Determine registration type: email or phone
    let verifiedPhone: string | null = null;
    let userEmail: string | null = email || null;

    // If phone verification token provided, validate it
    if (phoneVerificationToken) {
      const tokenData = validatePhoneToken(phoneVerificationToken);
      if (!tokenData) {
        return NextResponse.json(
          {
            success: false,
            message: 'Phone verification expired. Please verify again.',
          },
          { status: 400 }
        );
      }
      verifiedPhone = tokenData.phone;
    }

    // Must have either email or verified phone
    if (!userEmail && !verifiedPhone) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email or verified phone number is required',
        },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    if (userEmail) {
      const existingEmailUser = await prisma.users.findUnique({
        where: { email: userEmail },
      });

      if (existingEmailUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email already registered',
          },
          { status: 400 }
        );
      }
    }

    // Check if phone already registered (for verified phone users)
    if (verifiedPhone) {
      const existingPhoneUser = await prisma.users.findFirst({
        where: {
          phone: verifiedPhone,
          phone_verified: true,
        },
      });

      if (existingPhoneUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Phone number already registered',
          },
          { status: 400 }
        );
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate unique shop slug from full name
    const shop_slug = await generateUniqueShopSlug(fullName);

    // Create user with phone verified if using phone registration
    const user = await prisma.users.create({
      data: {
        email: userEmail,
        password_hash,
        full_name: fullName,
        phone: verifiedPhone || phone || null,
        phone_verified: verifiedPhone ? true : false,
        phone_verified_at: verifiedPhone ? new Date() : null,
        role: 'user',
        is_active: true,
        shop_slug,
        account_type: 'individual',
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        role: true,
        shop_slug: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          phoneVerified: user.phone_verified,
          role: user.role,
          shopSlug: user.shop_slug,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
