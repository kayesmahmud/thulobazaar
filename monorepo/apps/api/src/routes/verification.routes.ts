import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadBusinessVerification, uploadIndividualVerification } from '../middleware/upload.js';

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
      if (businessRequest.status === 'pending' || businessRequest.status === 'pending_payment') {
        businessStatus = 'pending';
      } else if (businessRequest.status === 'rejected') {
        businessStatus = 'rejected';
      }
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
      if (individualRequest.status === 'pending' || individualRequest.status === 'pending_payment') {
        individualStatus = 'pending';
      } else if (individualRequest.status === 'rejected') {
        individualStatus = 'rejected';
      }
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
 * POST /api/verification/business
 * Submit business verification request
 */
router.post(
  '/business',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { businessName, licenseDocument } = req.body;

    await prisma.users.update({
      where: { id: userId },
      data: {
        account_type: 'business',
        business_name: businessName,
        business_license_document: licenseDocument,
        business_verification_status: 'pending',
      },
    });

    console.log(`✅ Business verification submitted by user ${userId}`);

    res.json({
      success: true,
      message: 'Business verification request submitted successfully',
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
    const { documentUrls } = req.body;

    // For individual verification, we just mark as pending
    // The actual verification would be done by admin
    await prisma.users.update({
      where: { id: userId },
      data: {
        individual_verified: false, // Stays false until admin approves
      },
    });

    console.log(`✅ Individual verification submitted by user ${userId}`);

    res.json({
      success: true,
      message: 'Individual verification request submitted successfully',
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
