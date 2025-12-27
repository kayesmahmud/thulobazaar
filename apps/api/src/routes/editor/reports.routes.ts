import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/editor/user-reports/count
 * Get user reports count
 */
router.get(
  '/user-reports/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const count = await prisma.users.count({
      where: {
        OR: [
          { is_active: false },
          { business_verification_status: 'rejected' },
        ],
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  })
);

/**
 * GET /api/editor/user-reports/trend
 * Get user reports trend
 */
router.get(
  '/user-reports/trend',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [suspendedToday, rejectedToday] = await Promise.all([
      prisma.users.count({
        where: {
          is_active: false,
          updated_at: { gte: today },
        },
      }),
      prisma.users.count({
        where: {
          business_verification_status: 'rejected',
          updated_at: { gte: today },
        },
      }),
    ]);

    const totalNewToday = suspendedToday + rejectedToday;

    res.json({
      success: true,
      data: {
        newToday: totalNewToday,
        formattedText: totalNewToday > 0 ? `${totalNewToday} new today` : 'No new reports',
        breakdown: {
          suspendedToday,
          rejectedToday,
        },
      },
    });
  })
);

/**
 * GET /api/editor/user-reports/list
 * Get list of problematic users
 */
router.get(
  '/user-reports/list',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', type = 'all', search = '' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};

    if (type === 'suspended') {
      where.is_active = false;
    } else if (type === 'rejected') {
      where.business_verification_status = 'rejected';
    } else {
      where.OR = [{ is_active: false }, { business_verification_status: 'rejected' }];
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { full_name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          is_active: true,
          business_verification_status: true,
          created_at: true,
          shop_slug: true,
          _count: { select: { ads_ads_user_idTousers: true } },
        },
        orderBy: { updated_at: 'desc' },
        take: parseInt(limit as string),
        skip: offset,
      }),
      prisma.users.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        isActive: u.is_active,
        businessVerificationStatus: u.business_verification_status,
        createdAt: u.created_at,
        shopSlug: u.shop_slug,
        adCount: u._count.ads_ads_user_idTousers,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

/**
 * GET /api/editor/reported-ads
 * Get all reported ads for editor review
 */
router.get(
  '/reported-ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { status, limit = '10', page = '1' } = req.query;
    const pageNum = Math.max(parseInt(page as string), 1);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const total = await prisma.ad_reports.count({ where });

    const reports = await prisma.ad_reports.findMany({
      where,
      select: {
        id: true,
        ad_id: true,
        reporter_id: true,
        reason: true,
        details: true,
        status: true,
        admin_notes: true,
        created_at: true,
        updated_at: true,
        ads: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            status: true,
            slug: true,
            user_id: true,
            ad_images: {
              where: { is_primary: true },
              select: { file_path: true },
              take: 1,
            },
            users_ads_user_idTousers: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum,
    });

    const transformedReports = reports.map((report) => ({
      reportId: report.id,
      adId: report.ad_id,
      adSlug: report.ads?.slug || '',
      adTitle: report.ads?.title || 'Unknown',
      adDescription: report.ads?.description || '',
      price: report.ads?.price ? parseFloat(report.ads.price.toString()) : 0,
      adStatus: report.ads?.status || 'unknown',
      reason: report.reason,
      description: report.details,
      status: report.status,
      reportedAt: report.created_at?.toISOString(),
      reporterId: report.reporter_id,
      reporterName: report.users?.full_name || 'Unknown',
      reporterEmail: report.users?.email || '',
      sellerName: report.ads?.users_ads_user_idTousers?.full_name || 'Unknown',
      sellerEmail: report.ads?.users_ads_user_idTousers?.email || '',
      primaryImage: report.ads?.ad_images?.[0]?.file_path || null,
    }));

    res.json({
      success: true,
      data: transformedReports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

/**
 * POST /api/editor/reports/:id/dismiss
 * Dismiss a report
 */
router.post(
  '/reports/:id/dismiss',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user!.userId;

    const report = await prisma.ad_reports.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, status: true, ad_id: true },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status !== 'pending') {
      throw new ValidationError('Only pending reports can be dismissed');
    }

    const dismissedReport = await prisma.ad_reports.update({
      where: { id: parseInt(id) },
      data: {
        status: 'dismissed',
        admin_notes: reason || `Report dismissed after review by admin (ID: ${reviewerId}) - no violation found`,
        updated_at: new Date(),
      },
    });

    console.log(`✅ Report dismissed: ID ${id} (ad ${report.ad_id})`);

    res.json({
      success: true,
      message: 'Report dismissed successfully',
      data: {
        reportId: dismissedReport.id,
        status: dismissedReport.status,
        adminNotes: dismissedReport.admin_notes,
      },
    });
  })
);

export default router;
