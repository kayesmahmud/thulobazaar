import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/verification/business
 * Submit business verification request
 *
 * Requires file:
 * - business_license_document (required)
 *
 * Body:
 * - business_name (required)
 * - business_category (optional)
 * - business_description (optional)
 * - business_website (optional)
 * - business_phone (optional)
 * - business_address (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const formData = await request.formData();

    // Extract fields
    const businessName = formData.get('business_name')?.toString();
    const businessCategory = formData.get('business_category')?.toString();
    const businessDescription = formData.get('business_description')?.toString();
    const businessWebsite = formData.get('business_website')?.toString();
    const businessPhone = formData.get('business_phone')?.toString();
    const businessAddress = formData.get('business_address')?.toString();

    // Extract file
    const businessLicenseDoc = formData.get('business_license_document') as File | null;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        business_verification_status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.business_verification_status === 'approved') {
      return NextResponse.json(
        {
          success: false,
          message: 'Your business is already verified',
        },
        { status: 400 }
      );
    }

    // Check for pending requests
    const pendingRequest = await prisma.business_verification_requests.findFirst({
      where: {
        user_id: userId,
        status: 'pending',
      },
      select: { id: true },
    });

    if (pendingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a pending verification request',
        },
        { status: 400 }
      );
    }

    // Validate required file
    if (!businessLicenseDoc) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business license document is required',
        },
        { status: 400 }
      );
    }

    // Validate business name
    if (!businessName || businessName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Business name is required',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(businessLicenseDoc.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business license document must be JPEG, PNG, or PDF',
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (businessLicenseDoc.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business license document must be less than 5MB',
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'business_verification'
    );
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const filename = `biz-${timestamp}-${random}${path.extname(businessLicenseDoc.name)}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await businessLicenseDoc.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create verification request
    const verificationRequest = await prisma.business_verification_requests.create({
      data: {
        user_id: userId,
        business_name: businessName.trim(),
        business_license_document: filename,
        business_category: businessCategory || null,
        business_description: businessDescription || null,
        business_website: businessWebsite || null,
        business_phone: businessPhone || null,
        business_address: businessAddress || null,
        status: 'pending',
      },
    });

    console.log(
      `✅ Business verification request submitted by user ${userId}, request ID: ${verificationRequest.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message:
          'Business verification request submitted successfully. Our team will review it shortly.',
        data: {
          requestId: verificationRequest.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Business verification error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit verification request',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
