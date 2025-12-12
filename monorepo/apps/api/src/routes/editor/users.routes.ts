import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/editor/users
 * Get users list with full details for User Management page
 */
router.get(
  '/',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { limit = '20', page = '1', search, status } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status === 'suspended') {
      where.is_suspended = true;
    } else if (status === 'active') {
      where.is_suspended = false;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          full_name: true,
          phone: true,
          role: true,
          account_type: true,
          is_active: true,
          is_verified: true,
          is_suspended: true,
          suspended_until: true,
          suspension_reason: true,
          suspended_by: true,
          suspended_at: true,
          business_name: true,
          business_verification_status: true,
          individual_verified: true,
          avatar: true,
          shop_slug: true,
          custom_shop_slug: true,
          created_at: true,
          locations: {
            select: { name: true },
          },
          _count: {
            select: { ads_ads_user_idTousers: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: offset,
      }),
      prisma.users.count({ where }),
    ]);

    const suspendedByIds = users
      .filter((u) => u.suspended_by)
      .map((u) => u.suspended_by as number);
    const suspendedByUsers =
      suspendedByIds.length > 0
        ? await prisma.users.findMany({
            where: { id: { in: suspendedByIds } },
            select: { id: true, full_name: true },
          })
        : [];
    const suspendedByMap = new Map(
      suspendedByUsers.map((u) => [u.id, u.full_name])
    );

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        account_type: u.account_type,
        is_active: u.is_active,
        is_verified: u.is_verified,
        is_suspended: u.is_suspended,
        suspended_until: u.suspended_until,
        suspension_reason: u.suspension_reason,
        suspended_by_name: u.suspended_by
          ? suspendedByMap.get(u.suspended_by) || null
          : null,
        business_name: u.business_name,
        business_verification_status: u.business_verification_status || '',
        individual_verified: u.individual_verified || false,
        avatar: u.avatar,
        shop_slug: u.custom_shop_slug || u.shop_slug,
        location_name: u.locations?.name || null,
        created_at: u.created_at,
        ad_count: u._count.ads_ads_user_idTousers,
      })),
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

/**
 * PUT /api/editor/users/:id/suspend
 * Suspend a user with reason and optional duration
 */
router.put(
  '/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, duration } = req.body;
    const editorId = req.user!.userId;
    const userId = parseInt(id);

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    let suspendedUntil: Date | null = null;
    if (duration && duration > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + duration);
    }

    const [user, adsUpdated] = await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: {
          is_suspended: true,
          suspended_at: new Date(),
          suspended_by: editorId,
          suspended_until: suspendedUntil,
          suspension_reason: reason.trim(),
        },
      }),
      prisma.ads.updateMany({
        where: {
          user_id: userId,
          status: { in: ['approved', 'active'] },
        },
        data: {
          status: 'suspended',
          status_reason: `User suspended: ${reason.trim()}`,
        },
      }),
    ]);

    console.log(
      `✅ User ${id} suspended by editor ${editorId}, ${adsUpdated.count} ads suspended`
    );

    await prisma.admin_activity_logs
      .create({
        data: {
          admin_id: editorId,
          action_type: 'user_suspended',
          target_type: 'user',
          target_id: userId,
          details: {
            reason: reason.trim(),
            duration: duration || 'permanent',
            ads_suspended: adsUpdated.count,
          },
        },
      })
      .catch(() => {});

    res.json({
      success: true,
      message: `User suspended successfully. ${adsUpdated.count} ads have been hidden.`,
      data: user,
    });
  })
);

/**
 * PUT /api/editor/users/:id/unsuspend
 * Unsuspend a user and restore their ads
 */
router.put(
  '/:id/unsuspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const editorId = req.user!.userId;
    const userId = parseInt(id);

    const [user, adsRestored] = await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: {
          is_suspended: false,
          suspended_at: null,
          suspended_by: null,
          suspended_until: null,
          suspension_reason: null,
        },
      }),
      prisma.ads.updateMany({
        where: {
          user_id: userId,
          status: 'suspended',
        },
        data: {
          status: 'approved',
          status_reason: null,
        },
      }),
    ]);

    console.log(
      `✅ User ${id} unsuspended by editor ${editorId}, ${adsRestored.count} ads restored`
    );

    await prisma.admin_activity_logs
      .create({
        data: {
          admin_id: editorId,
          action_type: 'user_unsuspended',
          target_type: 'user',
          target_id: userId,
          details: {
            ads_restored: adsRestored.count,
          },
        },
      })
      .catch(() => {});

    res.json({
      success: true,
      message: `User unsuspended successfully. ${adsRestored.count} ads have been restored.`,
      data: user,
    });
  })
);

export default router;
