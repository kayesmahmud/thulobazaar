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
 * - duration_days (required) - 30 | 90 | 180 | 365
 * - payment_amount (required) - price from verification_pricing table
 * - payment_reference (required) - mock payment reference number
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
    const durationDays = parseInt(formData.get('duration_days')?.toString() || '365');
    const paymentAmount = parseFloat(formData.get('payment_amount')?.toString() || '0');
    const paymentReference = formData.get('payment_reference')?.toString();

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

    // Check for pending requests (allow pending_payment to be resubmitted)
    const pendingRequest = await prisma.individual_verification_requests.findFirst({
      where: {
        user_id: userId,
        status: { in: ['pending', 'pending_payment'] },
      },
      select: { id: true, status: true },
    });

    if (pendingRequest && pendingRequest.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a pending verification request',
        },
        { status: 400 }
      );
    }

    // If there's a pending_payment request, delete it so user can start fresh
    if (pendingRequest && pendingRequest.status === 'pending_payment') {
      await prisma.individual_verification_requests.delete({
        where: { id: pendingRequest.id },
      });
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

    // Validate duration
    const validDurations = [30, 90, 180, 365];
    if (!validDurations.includes(durationDays)) {
      return NextResponse.json(
        {
          success: false,
          message: `Duration must be one of: ${validDurations.join(', ')} days`,
        },
        { status: 400 }
      );
    }

    // Validate payment reference
    if (!paymentReference || paymentReference.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment reference is required',
        },
        { status: 400 }
      );
    }

    // Get payment status to check if it's free verification
    const paymentStatusCheck = formData.get('payment_status')?.toString();
    const isFreeCheck = paymentStatusCheck === 'free';

    // Validate payment amount (allow 0 for free verifications)
    if (!isFreeCheck && paymentAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment amount is required',
        },
        { status: 400 }
      );
    }

    // Validate pricing matches database (with discount applied)
    const pricing = await prisma.verification_pricing.findFirst({
      where: {
        verification_type: 'individual',
        duration_days: durationDays,
        is_active: true,
      },
      select: { price: true, discount_percentage: true },
    });

    if (!pricing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid verification duration selected',
        },
        { status: 400 }
      );
    }

    // Calculate expected price with discount
    const basePrice = parseFloat(pricing.price.toString());
    const discountPercent = pricing.discount_percentage ? parseFloat(pricing.discount_percentage.toString()) : 0;
    const expectedPrice = Math.round(basePrice * (1 - discountPercent / 100));

    // Check for free verification promotion
    const paymentStatus = formData.get('payment_status')?.toString();
    const isFreeVerification = paymentStatus === 'free';

    // If it's a free verification, payment amount should be 0
    if (isFreeVerification) {
      // Verify free verification is actually enabled
      const freeVerificationSetting = await prisma.site_settings.findUnique({
        where: { setting_key: 'free_verification_enabled' },
      });

      const freeVerificationEnabled = freeVerificationSetting?.setting_value === 'true';

      if (!freeVerificationEnabled) {
        return NextResponse.json(
          {
            success: false,
            message: 'Free verification promotion is not currently available',
          },
          { status: 400 }
        );
      }
      // Free verification is valid, skip price check
    } else if (Math.abs(paymentAmount - expectedPrice) > 1) {
      // Allow for small rounding differences for paid verification
      return NextResponse.json(
        {
          success: false,
          message: `Payment amount does not match expected price (NPR ${expectedPrice})`,
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

    // Determine status based on payment
    // - 'pending' for free verifications (ready for review)
    // - 'pending_payment' for paid verifications (waiting for payment)
    const verificationStatus = isFreeVerification ? 'pending' : 'pending_payment';

    // Create verification request with payment info
    const verificationRequest = await prisma.individual_verification_requests.create({
      data: {
        user_id: userId,
        full_name: fullName.trim(),
        id_document_type: idDocumentType,
        id_document_number: idDocumentNumber || '',
        id_document_front: frontFilename,
        id_document_back: backFilename,
        selfie_with_id: selfieFilename,
        status: verificationStatus,
        duration_days: durationDays,
        payment_amount: paymentAmount,
        payment_reference: paymentReference.trim(),
        payment_status: isFreeVerification ? 'free' : 'pending', // 'pending' until payment confirmed
      },
    });

    console.log(
      `✅ Individual verification request submitted by user ${userId}, request ID: ${verificationRequest.id}`
    );
    console.log(`   Status: ${verificationStatus}, Duration: ${durationDays} days, Payment: NPR ${paymentAmount} (Ref: ${paymentReference})`);

    return NextResponse.json(
      {
        success: true,
        message: isFreeVerification
          ? 'Verification request submitted successfully. Our team will review it shortly.'
          : 'Verification request submitted. Please complete payment to proceed.',
        data: {
          requestId: verificationRequest.id,
          status: verificationStatus,
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
