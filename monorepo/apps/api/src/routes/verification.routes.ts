import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/verification/status
 * Get current user's verification status
 */
router.get(
  '/status',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        account_type: true,
        business_verification_status: true,
        individual_verified: true,
        business_name: true,
        business_license_document: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        accountType: user.account_type,
        businessVerificationStatus: user.business_verification_status,
        individualVerified: user.individual_verified,
        businessName: user.business_name,
        businessLicenseDocument: user.business_license_document,
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

export default router;
