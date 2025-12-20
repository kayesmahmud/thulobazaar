import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/auth';
import { sendNotificationByUserId } from '@/lib/notifications';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    const durationDays = parseInt(formData.get('duration_days')?.toString() || '365', 10);
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

    // Check for existing requests
    const existingRequest = await prisma.business_verification_requests.findFirst({
      where: {
        user_id: userId,
        status: { in: ['pending', 'pending_payment', 'rejected'] },
      },
      select: { id: true, status: true, payment_amount: true, duration_days: true },
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return NextResponse.json(
        {
          success: false,
          message: 'You already have a pending verification request',
        },
        { status: 400 }
      );
    }

    // If there's a pending_payment request, delete it so user can start fresh
    if (existingRequest && existingRequest.status === 'pending_payment') {
      await prisma.business_verification_requests.delete({
        where: { id: existingRequest.id },
      });
    }

    // Check if this is a resubmission of a rejected request
    const isResubmission = existingRequest && existingRequest.status === 'rejected';

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

    // Validate pricing matches database (with campaign discount applied)
    const pricing = await prisma.verification_pricing.findFirst({
      where: {
        verification_type: 'business',
        duration_days: durationDays,
        is_active: true,
      },
      select: { price: true },
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

    // Check for active verification campaign
    const now = new Date();
    const activeCampaign = await prisma.verification_campaigns.findFirst({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      orderBy: { discount_percentage: 'desc' },
    });

    // Calculate campaign discount if applicable
    let campaignDiscount = 0;
    if (activeCampaign) {
      // Check max uses
      const hasReachedMaxUses = activeCampaign.max_uses && activeCampaign.current_uses && activeCampaign.current_uses >= activeCampaign.max_uses;
      // Check if applies to business type
      const appliesToBusiness = !activeCampaign.applies_to_types || activeCampaign.applies_to_types.length === 0 || activeCampaign.applies_to_types.includes('business');
      // Check min duration
      const meetsMinDuration = !activeCampaign.min_duration_days || durationDays >= activeCampaign.min_duration_days;

      if (!hasReachedMaxUses && appliesToBusiness && meetsMinDuration) {
        campaignDiscount = activeCampaign.discount_percentage;
      }
    }

    // Calculate expected price with campaign discount
    const basePrice = parseFloat(pricing.price.toString());
    const expectedPrice = campaignDiscount > 0
      ? Math.round(basePrice * (1 - campaignDiscount / 100))
      : basePrice;

    // Check for free verification promotion
    const paymentStatus = formData.get('payment_status')?.toString();
    const isFreeVerification = paymentStatus === 'free';

    // If it's a free verification, payment amount should be 0
    if (isFreeVerification) {
      // For resubmissions, skip free verification check (user already paid previously)
      if (!isResubmission) {
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
      }
      // Free verification or resubmission is valid, skip price check
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
    // Support common image formats including HEIC (iPhone), WEBP, and PDF
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];

    // Helper to check if file type is allowed
    const isAllowedType = (file: File): boolean => {
      // Check MIME type
      if (allowedTypes.includes(file.type.toLowerCase())) {
        return true;
      }
      // Also check file extension for cases where MIME type is not set correctly
      const extension = file.name.toLowerCase().split('.').pop();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'];
      return extension ? allowedExtensions.includes(extension) : false;
    };

    if (!isAllowedType(businessLicenseDoc)) {
      console.log('🔍 Business doc file type:', businessLicenseDoc.type, 'name:', businessLicenseDoc.name);
      return NextResponse.json(
        {
          success: false,
          message: 'Business license document must be JPEG, PNG, WEBP, HEIC, or PDF',
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

    // Upload file to Express API
    const uploadFormData = new FormData();
    uploadFormData.append('business_license_document', businessLicenseDoc);

    const uploadResponse = await fetch(`${API_URL}/api/verification/business/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '')}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.json();
      return NextResponse.json(
        {
          success: false,
          message: uploadError.message || 'Failed to upload document',
        },
        { status: uploadResponse.status }
      );
    }

    const uploadResult = await uploadResponse.json();
    const filename = uploadResult.data.filename;

    // Determine status based on payment
    // - 'pending' for free verifications or resubmissions (ready for review)
    // - 'pending_payment' for paid verifications (waiting for payment)
    const verificationStatus = (isFreeVerification || isResubmission) ? 'pending' : 'pending_payment';

    let verificationRequest;

    if (isResubmission && existingRequest) {
      // Update the existing rejected request with new data
      verificationRequest = await prisma.business_verification_requests.update({
        where: { id: existingRequest.id },
        data: {
          business_name: businessName.trim(),
          business_license_document: filename,
          business_category: businessCategory || null,
          business_description: businessDescription || null,
          business_website: businessWebsite || null,
          business_phone: businessPhone || null,
          business_address: businessAddress || null,
          status: verificationStatus,
          // Keep the original payment info for resubmissions
          rejection_reason: null, // Clear rejection reason
          updated_at: new Date(),
        },
      });

      console.log(
        `🔄 Business verification RESUBMITTED by user ${userId}, request ID: ${verificationRequest.id}`
      );
      console.log(`   Status: ${verificationStatus}, Original Duration: ${existingRequest.duration_days} days`);
    } else {
      // Create new verification request with payment info
      verificationRequest = await prisma.business_verification_requests.create({
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

      // Increment campaign usage if campaign discount was applied
      if (activeCampaign && campaignDiscount > 0) {
        await prisma.verification_campaigns.update({
          where: { id: activeCampaign.id },
          data: {
            current_uses: { increment: 1 },
          },
        });
        console.log(`   📊 Campaign "${activeCampaign.name}" usage incremented`);
      }
    }

    // Send SMS/email notification that application is submitted and pending
    // Only send if status is 'pending' (ready for review, not waiting for payment)
    if (verificationStatus === 'pending') {
      sendNotificationByUserId(userId, 'business_verification_submitted')
        .then((result) => {
          if (result.success) {
            console.log(`📱 Business verification submitted notification sent to user ${userId}`);
          }
        })
        .catch((err) => console.error('Failed to send submitted notification:', err));
    }

    return NextResponse.json(
      {
        success: true,
        message: isResubmission
          ? 'Business verification resubmitted successfully. Our team will review it shortly.'
          : isFreeVerification
            ? 'Business verification request submitted successfully. Our team will review it shortly.'
            : 'Business verification request submitted. Please complete payment to proceed.',
        data: {
          requestId: verificationRequest.id,
          status: verificationStatus,
          isResubmission,
        },
      },
      { status: isResubmission ? 200 : 201 }
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
