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
    const businessName = formData.get('business_name')?.toString();
    const businessCategory = formData.get('business_category')?.toString();
    const businessDescription = formData.get('business_description')?.toString();
    const businessWebsite = formData.get('business_website')?.toString();
    const businessPhone = formData.get('business_phone')?.toString();
    const businessAddress = formData.get('business_address')?.toString();
    const durationDays = parseInt(formData.get('duration_days')?.toString() || '365');
    const paymentAmount = parseFloat(formData.get('payment_amount')?.toString() || '0');
    const paymentReference = formData.get('payment_reference')?.toString();

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

    // Check for pending requests (allow pending_payment to be resubmitted)
    const pendingRequest = await prisma.business_verification_requests.findFirst({
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
      await prisma.business_verification_requests.delete({
        where: { id: pendingRequest.id },
      });
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
        verification_type: 'business',
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

    // Determine status based on payment
    // - 'pending' for free verifications (ready for review)
    // - 'pending_payment' for paid verifications (waiting for payment)
    const verificationStatus = isFreeVerification ? 'pending' : 'pending_payment';

    // Create verification request with payment info
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
        status: verificationStatus,
        duration_days: durationDays,
        payment_amount: paymentAmount,
        payment_reference: paymentReference.trim(),
        payment_status: isFreeVerification ? 'free' : 'pending', // 'pending' until payment confirmed
      },
    });

    console.log(
      `✅ Business verification request submitted by user ${userId}, request ID: ${verificationRequest.id}`
    );
    console.log(`   Status: ${verificationStatus}, Duration: ${durationDays} days, Payment: NPR ${paymentAmount} (Ref: ${paymentReference})`);

    return NextResponse.json(
      {
        success: true,
        message: isFreeVerification
          ? 'Business verification request submitted successfully. Our team will review it shortly.'
          : 'Business verification request submitted. Please complete payment to proceed.',
        data: {
          requestId: verificationRequest.id,
          status: verificationStatus,
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
