import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken, optionalAuth, requireEditorOrAdmin } from '../middleware/auth.js';
import { uploadBusinessVerification, uploadIndividualVerification } from '../middleware/upload.js';
import { optimizeImage } from '../middleware/optimizeImage.js';
import { notifyEditors } from '../services/notification.service.js';

const router = Router();

/**
 * GET /api/verification/status
 * Get current user's verification status including pending/rejected requests
 * Returns 4 possible states for each verification type:
 * 1. Verified - User has approved verification
 * 2. Pending - User has submitted, awaiting review
 * 3. Rejected - User's verification was rejected (can resubmit)
 * 4. Not Verified - User hasn't started verification
 */
router.get(
  '/status',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Fetch user and verification requests in parallel
    const [user, businessRequest, individualRequest] = await Promise.all([
      prisma.users.findUnique({
        where: { id: userId },
        select: {
          account_type: true,
          business_verification_status: true,
          business_verification_expires_at: true,
          individual_verified: true,
          individual_verification_expires_at: true,
          business_name: true,
          full_name: true,
        },
      }),
      // Get the most recent business verification request
      prisma.business_verification_requests.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          status: true,
          business_name: true,
          rejection_reason: true,
          duration_days: true,
          created_at: true,
          payment_status: true,
          payment_amount: true,
        },
      }),
      // Get the most recent individual verification request
      prisma.individual_verification_requests.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          status: true,
          full_name: true,
          id_document_type: true,
          rejection_reason: true,
          duration_days: true,
          created_at: true,
          payment_status: true,
          payment_amount: true,
        },
      }),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Determine business verification state
    // Status priority: verified > request status (pending/rejected/pending_payment) > unverified
    const isBusinessVerified = user.business_verification_status === 'approved';

    // Derive the display status
    let businessStatus: string = 'unverified';
    if (isBusinessVerified) {
      businessStatus = 'verified';
    } else if (businessRequest) {
      // Map request status to display status
      if (businessRequest.status === 'pending') {
        businessStatus = 'pending';
      } else if (businessRequest.status === 'rejected') {
        businessStatus = 'rejected';
      }
      // pending_payment is treated as unverified — user hasn't completed submission
    }

    // Calculate days remaining for business verification
    const businessExpiresAt = user.business_verification_expires_at;
    const businessDaysRemaining = businessExpiresAt
      ? Math.ceil((new Date(businessExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const businessIsExpiringSoon = businessDaysRemaining !== null && businessDaysRemaining <= 30 && businessDaysRemaining > 0;

    const businessVerification = {
      status: businessStatus,
      verified: isBusinessVerified,
      businessName: user.business_name,
      expiresAt: businessExpiresAt?.toISOString() || null,
      daysRemaining: businessDaysRemaining,
      isExpiringSoon: businessIsExpiringSoon,
      hasRequest: !!businessRequest,
      request: businessRequest
        ? {
          id: businessRequest.id,
          status: businessRequest.status,
          businessName: businessRequest.business_name,
          rejectionReason: businessRequest.rejection_reason,
          durationDays: businessRequest.duration_days,
          createdAt: businessRequest.created_at?.toISOString(),
          paymentStatus: businessRequest.payment_status,
          paymentAmount: businessRequest.payment_amount ? Number(businessRequest.payment_amount) : null,
          canResubmitFree: businessRequest.status === 'rejected' &&
            (businessRequest.payment_status === 'paid' || businessRequest.payment_status === 'free'),
        }
        : undefined,
    };

    // Determine individual verification state
    // Status priority: verified > request status (pending/rejected/pending_payment) > unverified
    const isIndividualVerified = user.individual_verified === true;

    // Derive the display status
    let individualStatus: string = 'unverified';
    if (isIndividualVerified) {
      individualStatus = 'verified';
    } else if (individualRequest) {
      // Map request status to display status
      if (individualRequest.status === 'pending') {
        individualStatus = 'pending';
      } else if (individualRequest.status === 'rejected') {
        individualStatus = 'rejected';
      }
      // pending_payment is treated as unverified — user hasn't completed submission
    }

    // Calculate days remaining for individual verification
    const individualExpiresAt = user.individual_verification_expires_at;
    const individualDaysRemaining = individualExpiresAt
      ? Math.ceil((new Date(individualExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const individualIsExpiringSoon = individualDaysRemaining !== null && individualDaysRemaining <= 30 && individualDaysRemaining > 0;

    const individualVerification = {
      status: individualStatus,
      verified: isIndividualVerified,
      fullName: user.full_name,
      expiresAt: individualExpiresAt?.toISOString() || null,
      daysRemaining: individualDaysRemaining,
      isExpiringSoon: individualIsExpiringSoon,
      hasRequest: !!individualRequest,
      request: individualRequest
        ? {
          id: individualRequest.id,
          status: individualRequest.status,
          fullName: individualRequest.full_name,
          idDocumentType: individualRequest.id_document_type,
          rejectionReason: individualRequest.rejection_reason,
          durationDays: individualRequest.duration_days,
          createdAt: individualRequest.created_at?.toISOString(),
          paymentStatus: individualRequest.payment_status,
          paymentAmount: individualRequest.payment_amount ? Number(individualRequest.payment_amount) : null,
          canResubmitFree: individualRequest.status === 'rejected' &&
            (individualRequest.payment_status === 'paid' || individualRequest.payment_status === 'free'),
        }
        : undefined,
    };

    res.json({
      success: true,
      data: {
        accountType: user.account_type,
        businessVerification,
        individualVerification,
      },
    });
  })
);

/**
 * GET /api/verification/pricing
 * Get verification pricing for users (checks free eligibility)
 */
router.get(
  '/pricing',
  optionalAuth,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const now = new Date();

    // Get all active pricing
    const pricings = await prisma.verification_pricing.findMany({
      where: { is_active: true },
      orderBy: [
        { verification_type: 'asc' },
        { duration_days: 'asc' },
      ],
    });

    // Get active verification campaign (best one by discount)
    const activeCampaigns = await prisma.verification_campaigns.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
      orderBy: { discount_percentage: 'desc' },
    });

    // Filter campaigns that haven't reached max uses
    const validCampaigns = activeCampaigns.filter((c) => {
      if (c.max_uses && c.current_uses && c.current_uses >= c.max_uses) {
        return false;
      }
      return true;
    });

    const activeCampaign = validCampaigns.length > 0 ? validCampaigns[0] : null;
    let campaignData: any = null;

    if (activeCampaign) {
      const endDate = new Date(activeCampaign.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      campaignData = {
        id: activeCampaign.id,
        name: activeCampaign.name,
        description: activeCampaign.description,
        discountPercentage: activeCampaign.discount_percentage,
        bannerText: activeCampaign.banner_text || `${activeCampaign.banner_emoji} ${activeCampaign.name} - ${activeCampaign.discount_percentage}% OFF!`,
        bannerEmoji: activeCampaign.banner_emoji,
        startDate: activeCampaign.start_date,
        endDate: activeCampaign.end_date,
        daysRemaining,
        appliesToTypes: activeCampaign.applies_to_types || [],
        minDurationDays: activeCampaign.min_duration_days,
      };
    }

    // Get free verification settings
    const settings = await prisma.site_settings.findMany({
      where: {
        setting_key: {
          in: ['free_verification_enabled', 'free_verification_duration_days', 'free_verification_types'],
        },
      },
    });

    const settingsMap: Record<string, string | null> = {};
    settings.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    // Same predicate the submit handlers use. Guests (no token) count as
    // eligible: a brand-new account has never been verified, so the app can
    // show the FREE badge before sign-in without lying.
    const isEligibleForFreeVerification =
      settingsMap['free_verification_enabled'] === 'true' &&
      (userId === undefined || (await hasNeverBeenVerified(userId)));

    // Helper: format duration label
    const formatDurationLabel = (days: number): string => {
      switch (days) {
        case 30: return '1 Month';
        case 90: return '3 Months';
        case 180: return '6 Months';
        case 365: return '1 Year';
        default: return `${days} Days`;
      }
    };

    // Helper: get campaign discount for a type & duration
    const getCampaignDiscount = (verificationType: string, durationDays: number): number => {
      if (!campaignData) return 0;
      if (campaignData.appliesToTypes.length > 0 && !campaignData.appliesToTypes.includes(verificationType)) return 0;
      if (campaignData.minDurationDays && durationDays < campaignData.minDurationDays) return 0;
      return campaignData.discountPercentage;
    };

    const calculateFinalPrice = (price: number, discountPercentage: number): number => {
      if (discountPercentage <= 0) return price;
      return Math.round(price * (1 - discountPercentage / 100));
    };

    // Group pricing by type
    const individualPricing = pricings
      .filter((p) => p.verification_type === 'individual')
      .map((p) => {
        const basePrice = parseFloat(p.price.toString());
        const campaignDiscount = getCampaignDiscount('individual', p.duration_days);
        return {
          id: p.id,
          durationDays: p.duration_days,
          durationLabel: formatDurationLabel(p.duration_days),
          price: basePrice,
          discountPercentage: campaignDiscount,
          finalPrice: calculateFinalPrice(basePrice, campaignDiscount),
          hasCampaignDiscount: campaignDiscount > 0,
        };
      });

    const businessPricing = pricings
      .filter((p) => p.verification_type === 'business')
      .map((p) => {
        const basePrice = parseFloat(p.price.toString());
        const campaignDiscount = getCampaignDiscount('business', p.duration_days);
        return {
          id: p.id,
          durationDays: p.duration_days,
          durationLabel: formatDurationLabel(p.duration_days),
          price: basePrice,
          discountPercentage: campaignDiscount,
          finalPrice: calculateFinalPrice(basePrice, campaignDiscount),
          hasCampaignDiscount: campaignDiscount > 0,
        };
      });

    const freeVerification = {
      enabled: settingsMap['free_verification_enabled'] === 'true',
      durationDays: parseInt(settingsMap['free_verification_duration_days'] || '180', 10),
      types: JSON.parse(settingsMap['free_verification_types'] || '["individual","business"]'),
      isEligible: isEligibleForFreeVerification,
    };

    res.json({
      success: true,
      data: {
        individual: individualPricing,
        business: businessPricing,
        freeVerification,
        campaign: campaignData,
      },
    });
  })
);

/**
 * Free-verification eligibility: the user has never held EITHER badge.
 * Shared by GET /pricing (what the client is told) and the submit handlers
 * (what the server records), so the free/paid decision cannot diverge.
 */
async function hasNeverBeenVerified(userId: number): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      individual_verified: true,
      individual_verification_expires_at: true,
      business_verification_status: true,
      business_verification_expires_at: true,
    },
  });
  if (!user) return false;
  const hasHadIndividualVerification = user.individual_verified || user.individual_verification_expires_at;
  const hasHadBusinessVerification = user.business_verification_status === 'approved' || user.business_verification_expires_at;
  return !hasHadIndividualVerification && !hasHadBusinessVerification;
}

/**
 * Server-side resolution of a verification request's payment fields at submit time.
 * The client is NEVER trusted for payment_status / payment_amount / payment_reference:
 * 'free' only when the free-verification offer applies, otherwise 'pending' at the
 * active list price. A 'paid' status is only ever written by the gateway callback
 * after the transaction is verified.
 */
async function resolveSubmitPayment(
  userId: number,
  type: 'business' | 'individual',
  durationDays: number
): Promise<{ payment_status: 'free' | 'pending'; payment_amount: number } | null> {
  const pricing = await prisma.verification_pricing.findFirst({
    where: { verification_type: type, duration_days: durationDays, is_active: true },
    select: { price: true },
  });
  if (!pricing) return null;

  const settings = await prisma.site_settings.findMany({
    where: {
      setting_key: {
        in: ['free_verification_enabled', 'free_verification_duration_days', 'free_verification_types'],
      },
    },
  });
  const settingsMap: Record<string, string | null> = {};
  settings.forEach((s) => {
    settingsMap[s.setting_key] = s.setting_value;
  });

  const freeEnabled = settingsMap['free_verification_enabled'] === 'true';
  const freeDurationDays = parseInt(settingsMap['free_verification_duration_days'] || '180', 10);
  const freeTypes: string[] = JSON.parse(settingsMap['free_verification_types'] || '["individual","business"]');

  const isFree =
    freeEnabled &&
    freeTypes.includes(type) &&
    durationDays === freeDurationDays &&
    (await hasNeverBeenVerified(userId));

  return {
    payment_status: isFree ? 'free' : 'pending',
    payment_amount: isFree ? 0 : parseFloat(pricing.price.toString()),
  };
}

/**
 * Check if user already has an active (non-expired) verification or a pending request.
 * Returns { blocked: true, reason, type } or { blocked: false }.
 */
async function checkVerificationEligibility(userId: number): Promise<{ blocked: boolean; reason?: string; type?: string }> {
  const [user, pendingBusiness, pendingIndividual] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: {
        business_verification_status: true,
        business_verification_expires_at: true,
        individual_verified: true,
        individual_verification_expires_at: true,
      },
    }),
    prisma.business_verification_requests.findFirst({
      where: { user_id: userId, status: 'pending' },
      select: { id: true },
    }),
    prisma.individual_verification_requests.findFirst({
      where: { user_id: userId, status: 'pending' },
      select: { id: true },
    }),
  ]);

  if (!user) return { blocked: false };

  // Check for pending requests first
  if (pendingBusiness) {
    return { blocked: true, reason: 'You already have a pending business verification request under review.', type: 'pending_business' };
  }
  if (pendingIndividual) {
    return { blocked: true, reason: 'You already have a pending individual verification request under review.', type: 'pending_individual' };
  }

  // Check for active (non-expired) verification
  const now = new Date();
  const businessActive =
    user.business_verification_status === 'approved' &&
    (!user.business_verification_expires_at || user.business_verification_expires_at > now);
  const individualActive =
    user.individual_verified === true &&
    (!user.individual_verification_expires_at || user.individual_verification_expires_at > now);

  if (businessActive) {
    return { blocked: true, reason: 'You already have an active business verification. You cannot apply until it expires.', type: 'active_business' };
  }
  if (individualActive) {
    return { blocked: true, reason: 'You already have an active individual verification. You cannot apply until it expires.', type: 'active_individual' };
  }

  return { blocked: false };
}

/**
 * POST /api/verification/business
 * Submit business verification request
 */
router.post(
  '/business',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Block if user already has active verification or pending request
    const eligibility = await checkVerificationEligibility(userId);
    if (eligibility.blocked) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
        data: { blockedType: eligibility.type },
      });
    }

    const {
      businessName,
      licenseDocument,
      businessCategory,
      businessDescription,
      businessWebsite,
      businessPhone,
      businessAddress,
      documentType,
      documentNumber,
      durationDays,
    } = req.body;

    const resolvedDurationDays = Number(durationDays) || 365;
    const payment = await resolveSubmitPayment(userId, 'business', resolvedDurationDays);
    if (!payment) {
      return res.status(400).json({ success: false, message: 'Invalid verification duration' });
    }

    // 1. Update user record
    await prisma.users.update({
      where: { id: userId },
      data: {
        account_type: 'business',
        business_name: businessName,
        business_license_document: licenseDocument,
        business_verification_status: 'pending',
      },
    });

    // 2. Create a verification request record so editors can review it.
    // Superseded REJECTED applications are deleted in the same transaction —
    // otherwise each resubmission leaves a stale rejected card behind in the
    // editor panel. If the create fails, the delete rolls back.
    // NEVER delete pending_payment rows here: they are the related_id target of
    // an in-flight Khalti/eSewa payment, and deleting one orphans the payment
    // (money captured, no request row left for the callback to promote).
    const [, businessRequest] = await prisma.$transaction([
      prisma.business_verification_requests.deleteMany({
        where: { user_id: userId, status: 'rejected' },
      }),
      prisma.business_verification_requests.create({
        data: {
          user_id: userId,
          business_name: businessName,
          business_license_document: licenseDocument,
          business_category: businessCategory || null,
          business_description: businessDescription || null,
          business_website: businessWebsite || null,
          business_phone: businessPhone || null,
          business_address: businessAddress || null,
          document_type: documentType || null,
          document_number: documentNumber || null,
          status: 'pending',
          duration_days: resolvedDurationDays,
          payment_status: payment.payment_status,
          payment_amount: payment.payment_amount,
        },
      }),
    ]);

    console.log(`✅ Business verification submitted by user ${userId}`);

    // Notify editors of a new business verification request (editor APK push + desktop bell)
    notifyEditors({
      type: 'verification_requested',
      title: 'New business verification request',
      body: `${businessName || 'A business'} submitted documents for verification.`,
      data: { route: '/editor/business-verification', kind: 'business' },
      referenceId: businessRequest.id,
    }).catch((err) => console.error('Business verification editor notification error:', err));

    res.json({
      success: true,
      message: 'Business verification request submitted successfully',
      data: { requestId: businessRequest.id },
    });
  })
);

/**
 * POST /api/verification/individual
 * Submit individual verification request
 */
router.post(
  '/individual',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Block if user already has active verification or pending request
    const eligibility = await checkVerificationEligibility(userId);
    if (eligibility.blocked) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
        data: { blockedType: eligibility.type },
      });
    }

    const { documentUrls, fullName, idType, idNumber, durationDays } = req.body;

    const resolvedDurationDays = Number(durationDays) || 365;
    const payment = await resolveSubmitPayment(userId, 'individual', resolvedDurationDays);
    if (!payment) {
      return res.status(400).json({ success: false, message: 'Invalid verification duration' });
    }

    // 1. Update user record
    await prisma.users.update({
      where: { id: userId },
      data: {
        individual_verified: false, // Stays false until admin approves
      },
    });

    // 2. Create a verification request record so editors can review it.
    // Superseded REJECTED applications are deleted in the same transaction —
    // otherwise each resubmission leaves a stale rejected card behind in the
    // editor panel. If the create fails, the delete rolls back.
    // NEVER delete pending_payment rows here: they are the related_id target of
    // an in-flight Khalti/eSewa payment, and deleting one orphans the payment
    // (money captured, no request row left for the callback to promote).
    const [, individualRequest] = await prisma.$transaction([
      prisma.individual_verification_requests.deleteMany({
        where: { user_id: userId, status: 'rejected' },
      }),
      prisma.individual_verification_requests.create({
        data: {
          user_id: userId,
          full_name: fullName || null,
          id_document_type: idType || 'citizenship',
          id_document_number: idNumber || '',
          id_document_front: documentUrls?.id_document_front?.filename || documentUrls?.id_document_front?.url || null,
          id_document_back: documentUrls?.id_document_back?.filename || documentUrls?.id_document_back?.url || null,
          selfie_with_id: documentUrls?.selfie_with_id?.filename || documentUrls?.selfie_with_id?.url || null,
          status: 'pending',
          duration_days: resolvedDurationDays,
          payment_status: payment.payment_status,
          payment_amount: payment.payment_amount,
        },
      }),
    ]);

    console.log(`✅ Individual verification submitted by user ${userId}`);

    // Notify editors of a new individual verification request (editor APK push + desktop bell)
    notifyEditors({
      type: 'verification_requested',
      title: 'New individual verification request',
      body: `${fullName || 'A user'} submitted documents for verification.`,
      data: { route: '/editor/individual-verification', kind: 'individual' },
      referenceId: individualRequest.id,
    }).catch((err) => console.error('Individual verification editor notification error:', err));

    res.json({
      success: true,
      message: 'Individual verification request submitted successfully',
      data: { requestId: individualRequest.id },
    });
  })
);

/**
 * GET /api/verification/pending
 * Get pending verification requests (admin only)
 */
router.get(
  '/pending',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { type = 'all', limit = '20', offset = '0' } = req.query;

    const where: any = {};

    if (type === 'business') {
      where.business_verification_status = 'pending';
    } else if (type === 'individual') {
      where.individual_verified = false;
      where.account_type = 'individual';
    } else {
      where.OR = [
        { business_verification_status: 'pending' },
        { individual_verified: false, account_type: 'individual' },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          account_type: true,
          business_name: true,
          business_license_document: true,
          business_verification_status: true,
          individual_verified: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.users.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * PUT /api/verification/:userId/approve
 * Approve verification (admin only)
 */
router.put(
  '/:userId/approve',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { type } = req.body; // 'business' or 'individual'

    const updateData: any = {};

    if (type === 'business') {
      updateData.business_verification_status = 'approved';
    } else {
      updateData.individual_verified = true;
    }

    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: updateData,
    });

    console.log(`✅ ${type} verification approved for user ${userId}`);

    res.json({
      success: true,
      message: 'Verification approved successfully',
    });
  })
);

/**
 * PUT /api/verification/:userId/reject
 * Reject verification (admin only)
 */
router.put(
  '/:userId/reject',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { type, reason } = req.body;

    const updateData: any = {};

    if (type === 'business') {
      updateData.business_verification_status = 'rejected';
    }

    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: updateData,
    });

    console.log(`✅ ${type} verification rejected for user ${userId}`);

    res.json({
      success: true,
      message: 'Verification rejected',
    });
  })
);

/**
 * POST /api/verification/business/upload
 * Upload business verification document
 */
router.post(
  '/business/upload',
  authenticateToken,
  uploadBusinessVerification.single('business_license_document'),
  optimizeImage('document'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    console.log(`📄 Business verification document uploaded by user ${userId}: ${req.file.filename}`);

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        url: `/uploads/business_verification/${req.file.filename}`,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  })
);

/**
 * POST /api/verification/individual/upload
 * Upload individual verification documents (supports multiple files)
 */
router.post(
  '/individual/upload',
  authenticateToken,
  uploadIndividualVerification.fields([
    { name: 'id_document_front', maxCount: 1 },
    { name: 'id_document_back', maxCount: 1 },
    { name: 'selfie_with_id', maxCount: 1 },
  ]),
  optimizeImage('document'),
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploadedFiles: any = {};

    if (files.id_document_front) {
      uploadedFiles.id_document_front = {
        filename: files.id_document_front[0].filename,
        url: `/uploads/individual_verification/${files.id_document_front[0].filename}`,
      };
    }

    if (files.id_document_back) {
      uploadedFiles.id_document_back = {
        filename: files.id_document_back[0].filename,
        url: `/uploads/individual_verification/${files.id_document_back[0].filename}`,
      };
    }

    if (files.selfie_with_id) {
      uploadedFiles.selfie_with_id = {
        filename: files.selfie_with_id[0].filename,
        url: `/uploads/individual_verification/${files.selfie_with_id[0].filename}`,
      };
    }

    console.log(`📄 Individual verification documents uploaded by user ${userId}:`, Object.keys(uploadedFiles));

    res.json({
      success: true,
      data: uploadedFiles,
    });
  })
);

export default router;
