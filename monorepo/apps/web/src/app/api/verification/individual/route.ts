import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * POST /api/verification/individual
 * Submit individual seller verification request
 *
 * Requires files:
 * - id_document_front (required)
 * - selfie_with_id (required)
 * - id_document_back (optional)
 *
 * Body:
 * - full_name (required)
 * - id_document_type (required) - 'citizenship' | 'passport' | 'driving_license'
 * - id_document_number (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const formData = await request.formData();

    // Extract fields
    const fullName = formData.get('full_name')?.toString();
    const idDocumentType = formData.get('id_document_type')?.toString();
    const idDocumentNumber = formData.get('id_document_number')?.toString();

    // Extract files
    const idDocumentFront = formData.get('id_document_front') as File | null;
    const idDocumentBack = formData.get('id_document_back') as File | null;
    const selfieWithId = formData.get('selfie_with_id') as File | null;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        account_type: true,
        individual_verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.individual_verified) {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account is already verified',
        },
        { status: 400 }
      );
    }

    // Check for pending requests
    const pendingRequest = await prisma.individual_verification_requests.findFirst({
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

    // Validate required files
    if (!idDocumentFront || !selfieWithId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID document front and selfie with ID are required',
        },
        { status: 400 }
      );
    }

    // Validate full name
    if (!fullName || fullName.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Full name is required',
        },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ['citizenship', 'passport', 'driving_license'];
    if (!idDocumentType || !validDocTypes.includes(idDocumentType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Document type must be one of: ${validDocTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (!allowedTypes.includes(idDocumentFront.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID document front must be JPEG, PNG, or PDF',
        },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(selfieWithId.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Selfie with ID must be JPEG, PNG, or PDF',
        },
        { status: 400 }
      );
    }

    if (idDocumentBack && !allowedTypes.includes(idDocumentBack.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID document back must be JPEG, PNG, or PDF',
        },
        { status: 400 }
      );
    }

    // Validate file sizes (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (idDocumentFront.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID document front must be less than 5MB',
        },
        { status: 400 }
      );
    }

    if (selfieWithId.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'Selfie with ID must be less than 5MB',
        },
        { status: 400 }
      );
    }

    if (idDocumentBack && idDocumentBack.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID document back must be less than 5MB',
        },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'individual_verification'
    );
    await mkdir(uploadDir, { recursive: true });

    // Save files
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);

    const frontFilename = `id-front-${timestamp}-${random}${path.extname(idDocumentFront.name)}`;
    const frontPath = path.join(uploadDir, frontFilename);
    const frontBuffer = Buffer.from(await idDocumentFront.arrayBuffer());
    await writeFile(frontPath, frontBuffer);

    const selfieFilename = `selfie-${timestamp}-${random}${path.extname(selfieWithId.name)}`;
    const selfiePath = path.join(uploadDir, selfieFilename);
    const selfieBuffer = Buffer.from(await selfieWithId.arrayBuffer());
    await writeFile(selfiePath, selfieBuffer);

    let backFilename: string | null = null;
    if (idDocumentBack) {
      backFilename = `id-back-${timestamp}-${random}${path.extname(idDocumentBack.name)}`;
      const backPath = path.join(uploadDir, backFilename);
      const backBuffer = Buffer.from(await idDocumentBack.arrayBuffer());
      await writeFile(backPath, backBuffer);
    }

    // Create verification request
    const verificationRequest = await prisma.individual_verification_requests.create({
      data: {
        user_id: userId,
        full_name: fullName.trim(),
        id_document_type: idDocumentType,
        id_document_number: idDocumentNumber || null,
        id_document_front: frontFilename,
        id_document_back: backFilename,
        selfie_with_id: selfieFilename,
        status: 'pending',
      },
    });

    console.log(
      `✅ Individual verification request submitted by user ${userId}, request ID: ${verificationRequest.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Verification request submitted successfully. Our team will review it shortly.',
        data: {
          requestId: verificationRequest.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Individual verification error:', error);

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
