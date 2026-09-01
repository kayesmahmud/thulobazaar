import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, NotFoundError, ValidationError } from '../../middleware/errorHandler.js';
import { authenticateToken, requireEditorOrAdmin } from '../../middleware/auth.js';

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
      where.is_suspended = true;
    } else if (type === 'rejected') {
      where.business_verification_status = 'rejected';
    } else {
      where.OR = [
        { is_suspended: true },
        { is_active: false },
        { business_verification_status: 'rejected' },
      ];
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
          is_suspended: true,
          deleted_at: true,
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
        isSuspended: u.is_suspended,
        deletedAt: u.deleted_at,
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
    const { status, limit = '10', page = '1', search } = req.query;
    const pageNum = Math.max(parseInt(page as string), 1);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    // Optional search: ad title, seller, reporter, or reason
    const term = typeof search === 'string' ? search.trim() : '';
    if (term) {
      const contains = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { ads: { title: contains } },
        { ads: { users_ads_user_idTousers: { OR: [{ full_name: contains }, { email: contains }] } } },
        { users: { OR: [{ full_name: contains }, { email: contains }] } },
        { reason: contains },
      ];
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

/**
 * GET /api/editor/reported-users
 * List user reports (from chat) for editor review
 */
router.get(
  '/reported-users',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { status, limit = '10', page = '1', search } = req.query;
    const pageNum = Math.max(parseInt(page as string), 1);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    // Optional search: reported user, reporter, or reason
    const term = typeof search === 'string' ? search.trim() : '';
    if (term) {
      const contains = { contains: term, mode: 'insensitive' as const };
      where.OR = [
        { reported: { OR: [{ full_name: contains }, { email: contains }] } },
        { reporter: { OR: [{ full_name: contains }, { email: contains }] } },
        { reason: contains },
      ];
    }

    const total = await prisma.user_reports.count({ where });

    const reports = await prisma.user_reports.findMany({
      where,
      select: {
        id: true,
        reported_user_id: true,
        reporter_id: true,
        reason: true,
        details: true,
        status: true,
        admin_notes: true,
        conversation_id: true,
        created_at: true,
        updated_at: true,
        reported: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar: true,
            shop_slug: true,
            is_active: true,
          },
        },
        reporter: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum,
    });

    const transformedReports = reports.map((report) => ({
      reportId: report.id,
      reportedUserId: report.reported_user_id,
      reportedUserName: report.reported?.full_name || 'Unknown',
      reportedUserEmail: report.reported?.email || '',
      reportedUserAvatar: report.reported?.avatar || null,
      reportedUserShopSlug: report.reported?.shop_slug || null,
      reportedUserActive: report.reported?.is_active ?? true,
      reason: report.reason,
      description: report.details,
      status: report.status,
      conversationId: report.conversation_id,
      adminNotes: report.admin_notes,
      reportedAt: report.created_at?.toISOString(),
      reporterId: report.reporter_id,
      reporterName: report.reporter?.full_name || 'Unknown',
      reporterEmail: report.reporter?.email || '',
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
 * POST /api/editor/reported-users/:id/dismiss
 * Dismiss a user report (no violation found)
 */
router.post(
  '/reported-users/:id/dismiss',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user!.userId;

    const report = await prisma.user_reports.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, status: true, reported_user_id: true },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }
    if (report.status !== 'pending') {
      throw new ValidationError('Only pending reports can be dismissed');
    }

    const updated = await prisma.user_reports.update({
      where: { id: parseInt(id) },
      data: {
        status: 'dismissed',
        admin_notes: reason || `Dismissed after review by admin (ID: ${reviewerId}) - no violation found`,
        resolved_by: reviewerId,
        updated_at: new Date(),
      },
    });

    await prisma.admin_activity_logs.create({
      data: {
        admin_id: reviewerId,
        action_type: 'dismiss_user_report',
        target_type: 'user_report',
        target_id: report.id,
        details: { reportedUserId: report.reported_user_id, reason: reason || null },
      },
    });

    console.log(`✅ User report dismissed: ID ${id}`);
    res.json({
      success: true,
      message: 'Report dismissed successfully',
      data: { reportId: updated.id, status: updated.status },
    });
  })
);

/**
 * POST /api/editor/reported-users/:id/resolve
 * Resolve a user report, optionally suspending the reported user
 */
router.post(
  '/reported-users/:id/resolve',
  authenticateToken,
  requireEditorOrAdmin,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, suspend = true } = req.body;
    const reviewerId = req.user!.userId;

    const report = await prisma.user_reports.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, status: true, reported_user_id: true },
    });

    if (!report) {
      throw new NotFoundError('Report not found');
    }
    if (report.status !== 'pending') {
      throw new ValidationError('Only pending reports can be resolved');
    }

    if (suspend) {
      await prisma.users.update({
        where: { id: report.reported_user_id },
        data: { is_active: false, updated_at: new Date() },
      });
    }

    const updated = await prisma.user_reports.update({
      where: { id: parseInt(id) },
      data: {
        status: 'resolved',
        admin_notes: reason || `Resolved by admin (ID: ${reviewerId})${suspend ? ' - user suspended' : ''}`,
        resolved_by: reviewerId,
        updated_at: new Date(),
      },
    });

    await prisma.admin_activity_logs.create({
      data: {
        admin_id: reviewerId,
        action_type: suspend ? 'resolve_user_report_suspend' : 'resolve_user_report',
        target_type: 'user_report',
        target_id: report.id,
        details: { reportedUserId: report.reported_user_id, suspended: !!suspend, reason: reason || null },
      },
    });

    console.log(`✅ User report resolved: ID ${id} (suspend=${suspend})`);
    res.json({
      success: true,
      message: suspend ? 'Report resolved and user suspended' : 'Report resolved',
      data: { reportId: updated.id, status: updated.status },
    });
  })
);

export default router;
