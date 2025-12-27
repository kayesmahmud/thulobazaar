import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/editor/verifications
 * Get pending verifications (both business and individual)
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { type = 'all', status = 'pending' } = req.query;

    const businessWhere: any = {};
    if (status === 'pending') {
      businessWhere.status = 'pending';
    } else if (status !== 'all') {
      businessWhere.status = status;
    }

    const businessVerifications = type === 'individual' ? [] : await prisma.business_verification_requests.findMany({
      where: businessWhere,
      include: {
        users_business_verification_requests_user_idTousers: {
          select: {
            email: true,
            phone: true,
            avatar: true,
            full_name: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const individualWhere: any = {};
    if (status === 'pending') {
      individualWhere.status = 'pending';
    } else if (status !== 'all') {
      individualWhere.status = status;
    }

    const individualVerifications = type === 'business' ? [] : await prisma.individual_verification_requests.findMany({
      where: individualWhere,
      include: {
        users_individual_verification_requests_user_idTousers: {
          select: {
            email: true,
            phone: true,
            avatar: true,
            full_name: true,
            shop_slug: true,
            custom_shop_slug: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const verifications = [
      ...businessVerifications.map((v) => ({
        id: v.id,
        user_id: v.user_id,
        type: 'business' as const,
        full_name: v.users_business_verification_requests_user_idTousers?.full_name || null,
        email: v.users_business_verification_requests_user_idTousers?.email || '',
        phone: v.users_business_verification_requests_user_idTousers?.phone || null,
        business_name: v.business_name,
        business_license_document: v.business_license_document,
        business_category: v.business_category,
        business_description: v.business_description,
        business_website: v.business_website,
        business_phone: v.business_phone,
        business_address: v.business_address,
        status: v.status,
        rejection_reason: v.rejection_reason,
        avatar: v.users_business_verification_requests_user_idTousers?.avatar || null,
        created_at: v.created_at,
        updated_at: v.updated_at,
        reviewed_at: v.reviewed_at,
        duration_days: v.duration_days,
        payment_amount: v.payment_amount ? Number(v.payment_amount) : null,
        payment_reference: v.payment_reference,
        payment_status: v.payment_status,
      })),
      ...individualVerifications.map((v) => ({
        id: v.id,
        user_id: v.user_id,
        type: 'individual' as const,
        full_name: v.full_name || v.users_individual_verification_requests_user_idTousers?.full_name || '',
        email: v.users_individual_verification_requests_user_idTousers?.email || '',
        phone: v.users_individual_verification_requests_user_idTousers?.phone || null,
        shop_slug: v.users_individual_verification_requests_user_idTousers?.custom_shop_slug ||
                   v.users_individual_verification_requests_user_idTousers?.shop_slug || null,
        id_document_type: v.id_document_type,
        id_document_number: v.id_document_number,
        id_document_front: v.id_document_front,
        id_document_back: v.id_document_back,
        selfie_with_id: v.selfie_with_id,
        status: v.status,
        rejection_reason: v.rejection_reason,
        avatar: v.users_individual_verification_requests_user_idTousers?.avatar || null,
        created_at: v.created_at,
        updated_at: v.updated_at,
        reviewed_at: v.reviewed_at,
        duration_days: v.duration_days,
        payment_amount: v.payment_amount ? Number(v.payment_amount) : null,
        payment_reference: v.payment_reference,
        payment_status: v.payment_status,
      })),
    ];

    res.json({
      success: true,
      data: verifications,
    });
  })
);

/**
 * POST /api/editor/verifications/:id/approve
 * Approve a verification
 */
router.post(
  '/:id/approve',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type } = req.body;
    const reviewerId = req.user!.userId;

    if (type === 'business') {
      const request = await prisma.business_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          business_verification_status: 'approved',
          business_verified_at: new Date(),
          business_verified_by: reviewerId,
          business_name: request.business_name,
          business_verification_expires_at: request.duration_days
            ? new Date(Date.now() + request.duration_days * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      console.log(`✅ Business verification approved for request ${id} (user ${request.user_id})`);
    } else {
      const request = await prisma.individual_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          individual_verified: true,
          individual_verified_at: new Date(),
          individual_verified_by: reviewerId,
          verified_seller_name: request.full_name,
          individual_verification_expires_at: request.duration_days
            ? new Date(Date.now() + request.duration_days * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      console.log(`✅ Individual verification approved for request ${id} (user ${request.user_id})`);
    }

    res.json({
      success: true,
      message: `${type === 'business' ? 'Business' : 'Individual'} verification approved`,
    });
  })
);

/**
 * POST /api/editor/verifications/:id/reject
 * Reject a verification
 */
router.post(
  '/:id/reject',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, reason } = req.body;
    const reviewerId = req.user!.userId;

    if (type === 'business') {
      const request = await prisma.business_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'rejected',
          rejection_reason: reason || 'Verification rejected by admin',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          business_verification_status: 'rejected',
          business_rejection_reason: reason || 'Verification rejected by admin',
        },
      });

      console.log(`❌ Business verification rejected for request ${id} (user ${request.user_id})`);
    } else {
      const request = await prisma.individual_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'rejected',
          rejection_reason: reason || 'Verification rejected by admin',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          individual_verified: false,
        },
      });

      console.log(`❌ Individual verification rejected for request ${id} (user ${request.user_id})`);
    }

    res.json({
      success: true,
      message: `${type === 'business' ? 'Business' : 'Individual'} verification rejected`,
    });
  })
);

export default router;
