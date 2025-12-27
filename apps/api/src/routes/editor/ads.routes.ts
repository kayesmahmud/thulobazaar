import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';
import { logReviewHistory } from '../../utils/responseHelpers.js';

const router = Router();

/**
 * GET /api/editor/ads/:id/history
 * Get review history for a specific ad
 */
router.get(
  '/:id/history',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adId = parseInt(id);

    const history = await prisma.ad_review_history.findMany({
      where: { ad_id: adId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: history.map((entry) => ({
        id: entry.id,
        action: entry.action,
        actorId: entry.actor_id,
        actorType: entry.actor_type,
        actorName: entry.users.full_name,
        actorEmail: entry.users.email,
        reason: entry.reason,
        notes: entry.notes,
        createdAt: entry.created_at,
      })),
    });
  })
);

/**
 * GET /api/editor/ads
 * Get ads for editor review
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { status, includeDeleted = 'false', limit = '20', offset = '0', page, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    // Support both page-based and offset-based pagination
    const effectiveLimit = parseInt(limit as string);
    const effectiveOffset = page ? (parseInt(page as string) - 1) * effectiveLimit : parseInt(offset as string);

    const where: any = {};

    const effectiveStatus = status || (includeDeleted === 'false' ? 'pending' : undefined);
    if (effectiveStatus && effectiveStatus !== 'all') {
      where.status = effectiveStatus;
    }

    if (includeDeleted === 'only') {
      where.deleted_at = { not: null };
    } else if (includeDeleted === 'true') {
      // Include all ads
    } else {
      where.deleted_at = null;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [ads, total] = await Promise.all([
      prisma.ads.findMany({
        where,
        include: {
          categories: { select: { name: true } },
          locations: { select: { name: true } },
          users_ads_user_idTousers: {
            select: {
              id: true,
              full_name: true,
              email: true,
              account_type: true,
              business_verification_status: true,
              individual_verified: true,
            },
          },
          ad_images: { take: 1 },
        },
        orderBy: { [sortBy as string]: sortOrder === 'ASC' ? 'asc' : 'desc' },
        take: effectiveLimit,
        skip: effectiveOffset,
      }),
      prisma.ads.count({ where }),
    ]);

    const totalPages = Math.ceil(total / effectiveLimit);
    const currentPage = page ? parseInt(page as string) : Math.floor(effectiveOffset / effectiveLimit) + 1;

    res.json({
      success: true,
      data: ads.map((ad) => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        condition: ad.condition,
        status: ad.status,
        statusReason: ad.status_reason,
        slug: ad.slug,
        viewCount: ad.view_count,
        createdAt: ad.created_at,
        updatedAt: ad.updated_at,
        reviewedAt: ad.reviewed_at,
        deletedAt: ad.deleted_at,
        categoryId: ad.category_id,
        locationId: ad.location_id,
        categoryName: ad.categories?.name,
        locationName: ad.locations?.name,
        user: ad.users_ads_user_idTousers
          ? {
              id: ad.users_ads_user_idTousers.id,
              fullName: ad.users_ads_user_idTousers.full_name,
              email: ad.users_ads_user_idTousers.email,
              accountType: ad.users_ads_user_idTousers.account_type,
              businessVerified: ad.users_ads_user_idTousers.business_verification_status === 'approved',
              individualVerified: ad.users_ads_user_idTousers.individual_verified,
            }
          : null,
        primaryImage: ad.ad_images[0]?.file_path || null,
        imageUrl: ad.ad_images[0]?.file_path || null,
        images: ad.ad_images.map(img => img.file_path).filter(Boolean),
      })),
      pagination: {
        total,
        limit: effectiveLimit,
        offset: effectiveOffset,
        page: currentPage,
        totalPages,
        hasMore: effectiveOffset + effectiveLimit < total,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
      },
    });
  })
);

/**
 * PUT /api/editor/ads/:id/status
 * Update ad status (approve/reject)
 */
router.put(
  '/:id/status',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const adId = parseInt(id);

    const ad = await prisma.ads.update({
      where: { id: adId },
      data: {
        status,
        status_reason: status === 'rejected' ? rejection_reason : null,
        reviewed_at: new Date(),
        reviewed_by: req.user!.userId,
      },
    });

    await logReviewHistory(
      adId,
      status,
      req.user!.userId,
      req.user!.role === 'super_admin' ? 'admin' : 'editor',
      status === 'rejected' ? rejection_reason : null,
      status === 'approved' ? 'Ad approved and published' : null
    );

    console.log(`✅ Ad ${id} status updated to ${status}`);

    res.json({
      success: true,
      message: `Ad ${status} successfully`,
      data: ad,
    });
  })
);

/**
 * DELETE /api/editor/ads/:id
 * Soft delete an ad
 */
router.delete(
  '/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true, status: true, deleted_at: true },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (ad.deleted_at) {
      throw new ValidationError('Ad is already deleted');
    }

    const deletedAd = await prisma.ads.update({
      where: { id: parseInt(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user!.userId,
        status: 'deleted',
      },
    });

    await prisma.ad_review_history.create({
      data: {
        ad_id: parseInt(id),
        action: 'deleted',
        actor_id: req.user!.userId,
        actor_type: req.user!.role === 'super_admin' ? 'admin' : 'editor',
        reason: reason || null,
        notes: 'Ad deleted by editor/admin',
      },
    });

    await prisma.ad_reports.updateMany({
      where: {
        ad_id: parseInt(id),
        status: 'pending',
      },
      data: {
        status: 'resolved',
        admin_notes: reason || 'Ad deleted by editor',
        updated_at: new Date(),
      },
    });

    console.log(`✅ Ad soft-deleted: ID ${id} - ${ad.title}`);

    res.json({
      success: true,
      message: 'Ad deleted successfully',
      data: {
        id: deletedAd.id,
        title: deletedAd.title,
        deletedAt: deletedAd.deleted_at,
      },
    });
  })
);

/**
 * POST /api/editor/ads/:id/suspend
 * Suspend an ad with reason and optional duration
 */
router.post(
  '/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, duration } = req.body;

    if (!reason) {
      throw new ValidationError('Suspension reason is required');
    }

    const adId = parseInt(id);
    const suspendedUntil = duration
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : null;

    const ad = await prisma.ads.update({
      where: { id: adId },
      data: {
        status: 'suspended',
        status_reason: reason,
        suspended_until: suspendedUntil,
        reviewed_at: new Date(),
        reviewed_by: req.user!.userId,
      },
    });

    await logReviewHistory(
      adId,
      'suspended',
      req.user!.userId,
      req.user!.role === 'super_admin' ? 'admin' : 'editor',
      reason,
      duration ? `Suspended for ${duration} days` : 'Suspended indefinitely'
    );

    console.log(`✅ Ad ${id} suspended by ${req.user!.email}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Ad suspended successfully',
      data: {
        id: ad.id,
        title: ad.title,
        status: ad.status,
        statusReason: ad.status_reason,
        suspendedUntil: ad.suspended_until,
      },
    });
  })
);

/**
 * POST /api/editor/ads/:id/unsuspend
 * Unsuspend an ad
 */
router.post(
  '/:id/unsuspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adId = parseInt(id);

    const ad = await prisma.ads.update({
      where: { id: adId },
      data: {
        status: 'approved',
        status_reason: null,
        suspended_until: null,
        reviewed_at: new Date(),
        reviewed_by: req.user!.userId,
      },
    });

    await logReviewHistory(
      adId,
      'unsuspended',
      req.user!.userId,
      req.user!.role === 'super_admin' ? 'admin' : 'editor',
      null,
      'Ad unsuspended and returned to approved status'
    );

    console.log(`✅ Ad ${id} unsuspended by ${req.user!.email}`);

    res.json({
      success: true,
      message: 'Ad unsuspended successfully',
      data: {
        id: ad.id,
        title: ad.title,
        status: ad.status,
      },
    });
  })
);

/**
 * POST /api/editor/ads/:id/restore
 * Restore a soft-deleted ad
 */
router.post(
  '/:id/restore',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adId = parseInt(id);

    const existingAd = await prisma.ads.findUnique({
      where: { id: adId },
      select: { id: true, title: true, deleted_at: true, status: true },
    });

    if (!existingAd) {
      throw new NotFoundError('Ad not found');
    }

    let ad = existingAd;
    let wasDeleted = false;

    // Only restore the ad if it's actually deleted
    if (existingAd.deleted_at) {
      wasDeleted = true;
      ad = await prisma.ads.update({
        where: { id: adId },
        data: {
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          status: 'approved',
          reviewed_at: new Date(),
          reviewed_by: req.user!.userId,
        },
      });

      await logReviewHistory(
        adId,
        'restored',
        req.user!.userId,
        req.user!.role === 'super_admin' ? 'admin' : 'editor',
        null,
        'Ad restored from deletion'
      );
    }

    // Always update any resolved reports to 'restored' status
    // This handles cases where ad was restored through another mechanism
    const updatedReports = await prisma.ad_reports.updateMany({
      where: {
        ad_id: adId,
        status: 'resolved',
      },
      data: {
        status: 'restored',
        admin_notes: wasDeleted
          ? 'Ad was restored by editor/admin'
          : 'Report marked as restored (ad was already active)',
        updated_at: new Date(),
      },
    });

    console.log(`✅ Ad ${id} ${wasDeleted ? 'restored' : 'reports updated'} by ${req.user!.email}. ${updatedReports.count} reports updated.`);

    res.json({
      success: true,
      message: wasDeleted
        ? 'Ad restored successfully'
        : 'Reports updated successfully (ad was already active)',
      data: {
        id: ad.id,
        title: ad.title,
        status: ad.status,
        reportsUpdated: updatedReports.count,
      },
    });
  })
);

/**
 * DELETE /api/editor/ads/:id/permanent
 * Permanently delete an ad
 */
router.delete(
  '/:id/permanent',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adId = parseInt(id);

    const ad = await prisma.ads.findUnique({
      where: { id: adId },
      select: {
        id: true,
        title: true,
        user_id: true,
        ad_images: { select: { file_path: true } },
      },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    await logReviewHistory(
      adId,
      'permanently_deleted',
      req.user!.userId,
      req.user!.role === 'super_admin' ? 'admin' : 'editor',
      reason || 'No reason provided',
      `Permanently deleted ad: ${ad.title}`
    );

    await prisma.ads.delete({
      where: { id: adId },
    });

    console.log(
      `🗑️ Ad ${id} ("${ad.title}") PERMANENTLY DELETED by ${req.user!.email}. Reason: ${reason || 'N/A'}`
    );

    res.json({
      success: true,
      message: 'Ad permanently deleted. This action cannot be undone.',
      data: {
        id: ad.id,
        title: ad.title,
      },
    });
  })
);

export default router;
