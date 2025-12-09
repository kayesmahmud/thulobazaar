import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@thulobazaar/database';
import config from '../config/index.js';
import { catchAsync, NotFoundError, ValidationError, AuthenticationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { PAGINATION, SECURITY } from '../config/constants.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

// Root admin credentials (should be in env in production)
const ROOT_ADMIN_EMAIL = 'root@thulobazaar.com';
const ROOT_ADMIN_PASSWORD = 'ThuloRoot2024!';

/**
 * POST /api/editor/root-login
 * Root admin login (hardcoded credentials)
 */
router.post(
  '/root-login',
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (email !== ROOT_ADMIN_EMAIL || password !== ROOT_ADMIN_PASSWORD) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: 0, email: ROOT_ADMIN_EMAIL, role: 'super_admin' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ Root admin logged in`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 0,
          email: ROOT_ADMIN_EMAIL,
          fullName: 'Root Admin',
          role: 'super_admin',
        },
        token,
      },
    });
  })
);

/**
 * POST /api/editor/auth/login or /api/admin/auth/login
 * Editor/Admin login
 */
router.post(
  '/auth/login',
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Check root admin first
    if (email === ROOT_ADMIN_EMAIL) {
      if (password !== ROOT_ADMIN_PASSWORD) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: 0, email: ROOT_ADMIN_EMAIL, role: 'super_admin' },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: { id: 0, email: ROOT_ADMIN_EMAIL, fullName: 'Root Admin', role: 'super_admin' },
          token,
        },
      });
    }

    // Find editor/admin user
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        full_name: true,
        role: true,
        is_active: true,
        last_login: true,
        avatar: true,
      },
    });

    if (!user || !['editor', 'admin', 'super_admin'].includes(user.role || '')) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.is_active) {
      throw new AuthenticationError('Account is deactivated');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Get previous last_login before updating
    const previousLastLogin = user.last_login;

    // Update last_login timestamp
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    console.log(`✅ Editor/Admin logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          lastLogin: previousLastLogin, // Return PREVIOUS login time
        },
        token,
      },
    });
  })
);

/**
 * GET /api/editor/profile
 * Get current editor's profile
 */
router.get(
  '/profile',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        avatar: true,
        last_login: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        avatar: user.avatar,
        lastLogin: user.last_login,
        createdAt: user.created_at,
      },
    });
  })
);

/**
 * GET /api/editor/stats
 * Get dashboard statistics
 */
router.get(
  '/stats',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const [totalUsers, totalAds, pendingAds, approvedAds, rejectedAds, pendingVerifications] =
      await Promise.all([
        prisma.users.count(),
        prisma.ads.count(),
        prisma.ads.count({ where: { status: 'pending' } }),
        prisma.ads.count({ where: { status: 'approved' } }),
        prisma.ads.count({ where: { status: 'rejected' } }),
        prisma.users.count({
          where: {
            OR: [
              { business_verification_status: 'pending' },
              { individual_verified: false },
            ],
          },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAds,
        pendingAds,
        approvedAds,
        rejectedAds,
        pendingVerifications,
      },
    });
  })
);

/**
 * GET /api/editor/ads
 * Get ads for editor review
 */
router.get(
  '/ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { status = 'pending', limit = '20', offset = '0' } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
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
            },
          },
          ad_images: { take: 1 },
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.ads.count({ where }),
    ]);

    // Transform to camelCase for frontend (per CLAUDE.md guidelines)
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
            }
          : null,
        primaryImage: ad.ad_images[0]?.filename,
      })),
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total,
      },
    });
  })
);

/**
 * PUT /api/editor/ads/:id/status
 * Update ad status (approve/reject)
 */
router.put(
  '/ads/:id/status',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const ad = await prisma.ads.update({
      where: { id: parseInt(id) },
      data: {
        status,
        status_reason: status === 'rejected' ? rejection_reason : null,
        reviewed_at: new Date(),
        reviewed_by: req.user!.userId,
      },
    });

    console.log(`✅ Ad ${id} status updated to ${status}`);

    res.json({
      success: true,
      message: `Ad ${status} successfully`,
      data: ad,
    });
  })
);

/**
 * GET /api/editor/users
 * Get users list with full details for User Management page
 */
router.get(
  '/users',
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

    // Get suspended_by names if any
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

    // Return snake_case to match frontend interface
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
 * Also suspends all their approved ads
 */
router.put(
  '/users/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, duration } = req.body; // duration in days, optional
    const editorId = (req as any).user?.userId || (req as any).user?.id;
    const userId = parseInt(id);

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required',
      });
    }

    // Calculate suspended_until if duration provided
    let suspendedUntil: Date | null = null;
    if (duration && duration > 0) {
      suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + duration);
    }

    // Use transaction to update user and their ads together
    const [user, adsUpdated] = await prisma.$transaction([
      // Suspend the user
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
      // Suspend all their approved ads
      prisma.ads.updateMany({
        where: {
          user_id: userId,
          status: 'approved',
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

    // Log activity
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
  '/users/:id/unsuspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const editorId = (req as any).user?.userId || (req as any).user?.id;
    const userId = parseInt(id);

    // Use transaction to update user and their ads together
    const [user, adsRestored] = await prisma.$transaction([
      // Unsuspend the user
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
      // Restore all their suspended ads back to approved
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

    // Log activity
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

/**
 * GET /api/editor/activity-logs
 * Get activity logs for dashboard
 */
router.get(
  '/activity-logs',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { page = '1', limit = '10', admin_id } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (admin_id) {
      where.admin_id = parseInt(admin_id as string);
    }

    try {
      const [logs, total] = await Promise.all([
        prisma.activity_logs.findMany({
          where,
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          take: parseInt(limit as string),
          skip: offset,
        }),
        prisma.activity_logs.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs.map((log) => ({
          id: log.id,
          action_type: log.action_type,
          target_type: log.target_type,
          target_id: log.target_id,
          details: log.details,
          admin_id: log.admin_id,
          admin_name: log.users?.full_name || 'System',
          created_at: log.created_at,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      // If activity_logs table doesn't exist, return empty array
      console.log('Activity logs table may not exist, returning empty array');
      res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: 0,
          totalPages: 0,
        },
      });
    }
  })
);

// =====================================================
// EDITOR DASHBOARD EXTENSIONS
// =====================================================

/**
 * GET /api/editor/user-reports/count
 * Get user reports count (suspended or rejected verifications)
 */
router.get(
  '/user-reports/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    // Count users with issues: suspended or rejected verifications
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
 * GET /api/editor/notifications/count
 * Get urgent notifications/alerts count
 */
router.get(
  '/notifications/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [urgentReports, oldPendingAds, oldVerifications] = await Promise.all([
      prisma.ad_reports.count({
        where: {
          status: 'pending',
          reason: { in: ['scam', 'fraud'] },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'pending',
          created_at: { lt: threeDaysAgo },
        },
      }),
      prisma.users.count({
        where: {
          business_verification_status: 'pending',
          created_at: { lt: sevenDaysAgo },
        },
      }),
    ]);

    const totalNotifications = urgentReports + oldPendingAds + oldVerifications;

    res.json({
      success: true,
      data: {
        count: totalNotifications,
        breakdown: {
          urgentReports,
          oldPendingAds,
          oldVerifications,
        },
      },
    });
  })
);

/**
 * GET /api/editor/system-alerts
 * Get system alerts for dashboard
 */
router.get(
  '/system-alerts',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [scamReports, oldPendingAds, oldVerifications] = await Promise.all([
      prisma.ad_reports.count({
        where: {
          status: 'pending',
          reason: { in: ['scam', 'fraud'] },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'pending',
          created_at: { lt: twoDaysAgo },
        },
      }),
      prisma.users.count({
        where: {
          business_verification_status: 'pending',
          created_at: { lt: fiveDaysAgo },
        },
      }),
    ]);

    const alerts: Array<{ message: string; type: string; count: number }> = [];

    if (scamReports > 0) {
      alerts.push({
        message: `${scamReports} scam/fraud ${scamReports === 1 ? 'report' : 'reports'} need immediate attention`,
        type: 'danger',
        count: scamReports,
      });
    }

    if (oldPendingAds > 0) {
      alerts.push({
        message: `${oldPendingAds} ${oldPendingAds === 1 ? 'ad has' : 'ads have'} been pending for 2+ days`,
        type: 'warning',
        count: oldPendingAds,
      });
    }

    if (oldVerifications > 0) {
      alerts.push({
        message: `${oldVerifications} ${oldVerifications === 1 ? 'verification' : 'verifications'} pending for 5+ days`,
        type: 'warning',
        count: oldVerifications,
      });
    }

    res.json({
      success: true,
      data: alerts.length > 0 ? alerts[0] : null, // Return most urgent alert
    });
  })
);

/**
 * GET /api/editor/avg-response-time
 * Get average response time
 */
router.get(
  '/avg-response-time',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get reviewed ads from last 30 days
    const reviewedAds = await prisma.ads.findMany({
      where: {
        reviewed_at: { gte: thirtyDaysAgo },
        NOT: { reviewed_at: null },
      },
      select: {
        created_at: true,
        reviewed_at: true,
      },
    });

    let totalHours = 0;
    let count = 0;

    for (const ad of reviewedAds) {
      if (ad.reviewed_at && ad.created_at) {
        const diff = ad.reviewed_at.getTime() - ad.created_at.getTime();
        totalHours += diff / (1000 * 60 * 60); // Convert to hours
        count++;
      }
    }

    const avgHours = count > 0 ? totalHours / count : 0;

    // Format to human-readable string
    let formattedTime = 'N/A';
    if (avgHours > 0) {
      if (avgHours < 1) {
        formattedTime = `${Math.round(avgHours * 60)}m`;
      } else if (avgHours < 24) {
        formattedTime = `${avgHours.toFixed(1)}h`;
      } else {
        formattedTime = `${(avgHours / 24).toFixed(1)}d`;
      }
    }

    res.json({
      success: true,
      data: {
        avgResponseTime: formattedTime,
        breakdown: {
          adsAvgHours: avgHours,
          combinedAvgHours: avgHours,
        },
      },
    });
  })
);

/**
 * GET /api/editor/trends
 * Get trends (percentage changes)
 */
router.get(
  '/trends',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [currentPendingAds, pastPendingAds, currentPendingVerifications, pastPendingVerifications] =
      await Promise.all([
        prisma.ads.count({ where: { status: 'pending' } }),
        prisma.ads.count({
          where: {
            status: 'pending',
            created_at: { lte: sevenDaysAgo },
          },
        }),
        prisma.users.count({ where: { business_verification_status: 'pending' } }),
        prisma.users.count({
          where: {
            business_verification_status: 'pending',
            created_at: { lte: sevenDaysAgo },
          },
        }),
      ]);

    // Calculate percentage changes
    let pendingAdsChange = 0;
    if (pastPendingAds > 0) {
      pendingAdsChange = ((currentPendingAds - pastPendingAds) / pastPendingAds) * 100;
    } else if (currentPendingAds > 0) {
      pendingAdsChange = 100;
    }

    let verificationsChange = 0;
    if (pastPendingVerifications > 0) {
      verificationsChange =
        ((currentPendingVerifications - pastPendingVerifications) / pastPendingVerifications) * 100;
    } else if (currentPendingVerifications > 0) {
      verificationsChange = 100;
    }

    const formatChange = (change: number) => {
      if (change === 0) return '0%';
      const sign = change > 0 ? '+' : '';
      return `${sign}${Math.round(change)}%`;
    };

    res.json({
      success: true,
      data: {
        pendingChange: formatChange(pendingAdsChange),
        verificationsChange: formatChange(verificationsChange),
        breakdown: {
          currentPendingAds,
          pastPendingAds,
          pendingAdsChangePercent: pendingAdsChange,
          currentPendingVerifications,
          pastPendingVerifications,
          verificationsChangePercent: verificationsChange,
        },
      },
    });
  })
);

/**
 * GET /api/editor/support-chat/count
 * Get support chat count (unresolved messages/tickets)
 */
router.get(
  '/support-chat/count',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const count = await prisma.ad_reports.count({
      where: {
        status: 'pending',
        admin_notes: null,
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
 * Get user reports trend (new reports today)
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
 * GET /api/editor/avg-response-time/trend
 * Get average response time trend (improvement percentage)
 */
router.get(
  '/avg-response-time/trend',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Get reviewed ads from current period (last 7 days)
    const currentAds = await prisma.ads.findMany({
      where: {
        reviewed_at: { gte: sevenDaysAgo },
        NOT: { reviewed_at: null },
      },
      select: { created_at: true, reviewed_at: true },
    });

    // Get reviewed ads from previous period (7-14 days ago)
    const previousAds = await prisma.ads.findMany({
      where: {
        reviewed_at: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        NOT: { reviewed_at: null },
      },
      select: { created_at: true, reviewed_at: true },
    });

    const calculateAvgHours = (ads: Array<{ created_at: Date | null; reviewed_at: Date | null }>) => {
      let total = 0;
      let count = 0;
      for (const ad of ads) {
        if (ad.reviewed_at && ad.created_at) {
          total += (ad.reviewed_at.getTime() - ad.created_at.getTime()) / (1000 * 60 * 60);
          count++;
        }
      }
      return count > 0 ? total / count : 0;
    };

    const currentAvg = calculateAvgHours(currentAds);
    const previousAvg = calculateAvgHours(previousAds);

    let improvementPercent = 0;
    let formattedText = 'No change';

    if (previousAvg > 0 && currentAvg > 0) {
      improvementPercent = ((currentAvg - previousAvg) / previousAvg) * 100;

      if (improvementPercent < -5) {
        formattedText = `Improved ${Math.abs(Math.round(improvementPercent))}%`;
      } else if (improvementPercent > 5) {
        formattedText = `Slower by ${Math.round(improvementPercent)}%`;
      } else {
        formattedText = 'Stable';
      }
    }

    res.json({
      success: true,
      data: {
        improvementPercent: Math.round(improvementPercent),
        formattedText,
        isImproved: improvementPercent < 0,
        breakdown: {
          currentAvgHours: currentAvg,
          previousAvgHours: previousAvg,
        },
      },
    });
  })
);

/**
 * GET /api/editor/my-work-today
 * Get editor's work statistics for today
 */
router.get(
  '/my-work-today',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all work done by this editor today
    const [
      adsApprovedToday,
      adsRejectedToday,
      adsEditedToday,
      businessVerificationsToday,
      individualVerificationsToday,
      supportTicketsAssigned,
    ] = await Promise.all([
      // Ads approved today by this editor
      prisma.ads.count({
        where: {
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      // Ads rejected today by this editor
      prisma.ads.count({
        where: {
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      // Ads edited today by this editor (from admin_activity_logs)
      prisma.admin_activity_logs.count({
        where: {
          admin_id: userId,
          action_type: { contains: 'edit' },
          created_at: { gte: today },
        },
      }).catch(() => 0),
      // Business verifications processed today by this editor (query directly from verification table)
      prisma.business_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
      // Individual verifications processed today by this editor (query directly from verification table)
      prisma.individual_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
      // Support tickets this editor responded to today (count unique tickets with editor messages today)
      prisma.support_messages.groupBy({
        by: ['ticket_id'],
        where: {
          sender_id: userId,
          created_at: { gte: today },
        },
      }).then((result) => result.length).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: {
        adsApprovedToday,
        adsRejectedToday,
        adsEditedToday,
        businessVerificationsToday,
        individualVerificationsToday,
        supportTicketsAssigned,
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

    // Filter by type
    if (type === 'suspended') {
      where.is_active = false;
    } else if (type === 'rejected') {
      where.business_verification_status = 'rejected';
    } else {
      // 'all' - show both suspended and rejected
      where.OR = [{ is_active: false }, { business_verification_status: 'rejected' }];
    }

    // Search filter
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

    // Transform to camelCase for frontend (per CLAUDE.md guidelines)
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

// =====================================================
// VERIFICATIONS MANAGEMENT
// =====================================================

/**
 * GET /api/editor/verifications
 * Get pending verifications (both business and individual)
 * Queries from the separate verification_requests tables which store payment info
 */
router.get(
  '/verifications',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { type = 'all', status = 'pending' } = req.query;

    // Get business verification requests from dedicated table
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

    // Get individual verification requests from dedicated table
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

    // Transform and combine results - using snake_case for frontend compatibility
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
        // Payment and duration fields
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
        // Shop slug fields for viewing user's shop
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
        // Payment and duration fields
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
  '/verifications/:id/approve',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type } = req.body; // 'business' or 'individual'
    const reviewerId = req.user!.userId;

    if (type === 'business') {
      // Update the verification request
      const request = await prisma.business_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      // Also update the user's status
      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          business_verification_status: 'approved',
          business_verified_at: new Date(),
          business_verified_by: reviewerId,
          business_name: request.business_name,
          // Set expiration based on duration_days
          business_verification_expires_at: request.duration_days
            ? new Date(Date.now() + request.duration_days * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      console.log(`✅ Business verification approved for request ${id} (user ${request.user_id})`);
    } else {
      // Update the verification request
      const request = await prisma.individual_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      // Also update the user's status
      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          individual_verified: true,
          individual_verified_at: new Date(),
          individual_verified_by: reviewerId,
          verified_seller_name: request.full_name,
          // Set expiration based on duration_days
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
  '/verifications/:id/reject',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, reason } = req.body;
    const reviewerId = req.user!.userId;

    if (type === 'business') {
      // Update the verification request
      const request = await prisma.business_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'rejected',
          rejection_reason: reason || 'Verification rejected by admin',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      // Also update the user's status
      await prisma.users.update({
        where: { id: request.user_id },
        data: {
          business_verification_status: 'rejected',
          business_rejection_reason: reason || 'Verification rejected by admin',
        },
      });

      console.log(`❌ Business verification rejected for request ${id} (user ${request.user_id})`);
    } else {
      // Update the verification request
      const request = await prisma.individual_verification_requests.update({
        where: { id: parseInt(id) },
        data: {
          status: 'rejected',
          rejection_reason: reason || 'Verification rejected by admin',
          reviewed_by: reviewerId,
          reviewed_at: new Date(),
        },
      });

      // Also update the user's status (keep individual_verified as false)
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

// =====================================================
// EDITORS MANAGEMENT (Super Admin)
// =====================================================

/**
 * GET /api/editor/editors
 * Get list of all editors (for super admin)
 */
router.get(
  '/editors',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can see editors list
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const editors = await prisma.users.findMany({
      where: {
        role: 'editor',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        avatar: true,
        last_login: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Return editors list (activity counts can be added later with proper Prisma regeneration)
    res.json({
      success: true,
      data: editors.map((editor) => ({
        id: editor.id,
        full_name: editor.full_name,
        email: editor.email,
        role: editor.role,
        is_active: editor.is_active,
        avatar: editor.avatar,
        last_login: editor.last_login,
        created_at: editor.created_at,
        total_actions: 0, // TODO: Add activity log counting after Prisma regeneration
      })),
    });
  })
);

/**
 * POST /api/editor/editors
 * Create a new editor (super admin only)
 * Supports avatar file upload via multipart/form-data
 */
router.post(
  '/editors',
  authenticateToken,
  uploadAvatar.single('avatar'),
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can create editors
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { fullName, email, password } = req.body;

    console.log('📝 Creating editor:', { fullName, email, hasPassword: !!password });
    console.log('📁 Uploaded file:', req.file);

    if (!fullName || !email || !password) {
      throw new ValidationError('Full name, email, and password are required');
    }

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);

    // Prepare create data with optional avatar
    const createData: Record<string, unknown> = {
      full_name: fullName,
      email,
      password_hash: passwordHash,
      role: 'editor',
      is_active: true,
    };

    // Handle avatar file upload
    if (req.file) {
      createData.avatar = req.file.filename;
      console.log('📷 Avatar uploaded:', req.file.filename);
    }

    const newEditor = await prisma.users.create({
      data: createData as any,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        avatar: true,
        created_at: true,
      },
    });

    console.log(`✅ New editor created: ${email}${req.file ? ' (with avatar)' : ''}`);

    res.status(201).json({
      success: true,
      message: 'Editor created successfully',
      data: newEditor,
    });
  })
);

/**
 * PUT /api/editor/editors/:id
 * Update an editor (super admin only)
 * Supports both JSON and multipart/form-data for avatar uploads
 */
router.put(
  '/editors/:id',
  authenticateToken,
  uploadAvatar.single('avatar'),
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can update editors
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;
    const { fullName, email, password, isActive } = req.body;

    console.log('📝 Updating editor:', {
      id,
      fullName,
      email,
      password: password ? `[${typeof password}:${password.length}chars]` : 'not provided',
      isActive
    });
    console.log('📁 Uploaded file:', req.file);

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData.full_name = fullName;
    if (email) updateData.email = email;
    if (typeof isActive === 'boolean') {
      updateData.is_active = isActive;
    } else if (isActive === 'true' || isActive === 'false') {
      // Handle string boolean from FormData
      updateData.is_active = isActive === 'true';
    }

    // Only hash password if it's a non-empty string (not 'undefined' string from FormData)
    const passwordStr = password?.toString().trim();
    if (passwordStr && passwordStr.length > 0 && passwordStr !== 'undefined') {
      updateData.password_hash = await bcrypt.hash(passwordStr, SECURITY.BCRYPT_ROUNDS);
    }

    // Handle avatar file upload
    if (req.file) {
      updateData.avatar = req.file.filename;
      console.log('📷 Avatar uploaded:', req.file.filename);
    }

    const updatedEditor = await prisma.users.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        avatar: true,
        created_at: true,
      },
    });

    console.log(`✅ Editor updated: ${updatedEditor.email}`);

    res.json({
      success: true,
      message: 'Editor updated successfully',
      data: updatedEditor,
    });
  })
);

/**
 * DELETE /api/editor/ads/:id
 * Soft delete an ad (set deleted_at timestamp)
 */
router.delete(
  '/ads/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if ad exists
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

    // Soft delete the ad
    const deletedAd = await prisma.ads.update({
      where: { id: parseInt(id) },
      data: {
        deleted_at: new Date(),
        status: 'deleted',
      },
    });

    // Also update any pending reports for this ad to 'resolved'
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
 * POST /api/editor/ads/:id/restore
 * Restore a soft-deleted ad
 */
router.post(
  '/ads/:id/restore',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if ad exists and is deleted
    const ad = await prisma.ads.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true, status: true, deleted_at: true },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    if (!ad.deleted_at) {
      throw new ValidationError('Ad is not deleted');
    }

    // Restore the ad (clear deleted_at, set status back to approved)
    const restoredAd = await prisma.ads.update({
      where: { id: parseInt(id) },
      data: {
        deleted_at: null,
        status: 'approved',
      },
    });

    // Update related reports back to pending so editors can re-review if needed
    await prisma.ad_reports.updateMany({
      where: {
        ad_id: parseInt(id),
        status: 'resolved',
      },
      data: {
        status: 'pending',
        admin_notes: 'Ad restored by editor - report re-opened for review',
        updated_at: new Date(),
      },
    });

    console.log(`✅ Ad restored: ID ${id} - ${ad.title}`);

    res.json({
      success: true,
      message: 'Ad restored successfully',
      data: {
        id: restoredAd.id,
        title: restoredAd.title,
        status: restoredAd.status,
      },
    });
  })
);

/**
 * DELETE /api/editor/editors/:id
 * Delete an editor (super admin only)
 */
router.delete(
  '/editors/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can delete editors
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;

    await prisma.users.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ Editor deleted: ID ${id}`);

    res.json({
      success: true,
      message: 'Editor deleted successfully',
    });
  })
);

/**
 * PUT /api/editor/editors/:id/suspend
 * Suspend/unsuspend an editor (super admin only)
 */
router.put(
  '/editors/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can suspend editors
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { id } = req.params;
    const { suspend } = req.body; // true to suspend, false to unsuspend

    const updatedEditor = await prisma.users.update({
      where: { id: parseInt(id) },
      data: { is_active: !suspend },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_active: true,
      },
    });

    console.log(`✅ Editor ${suspend ? 'suspended' : 'unsuspended'}: ${updatedEditor.email}`);

    res.json({
      success: true,
      message: `Editor ${suspend ? 'suspended' : 'activated'} successfully`,
      data: updatedEditor,
    });
  })
);

/**
 * GET /api/editor/reported-ads
 * Get all reported ads for editor review
 * Query params:
 * - status: 'pending' | 'reviewed' | 'resolved' | 'dismissed' (optional)
 * - limit: number (default: 10)
 * - page: number (default: 1)
 */
router.get(
  '/reported-ads',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { status, limit = '10', page = '1' } = req.query;
    const pageNum = Math.max(parseInt(page as string), 1);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.ad_reports.count({ where });

    // Fetch reports with relations
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

    // Transform to camelCase format expected by frontend
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
 * Dismiss a report (mark as false report)
 */
router.post(
  '/reports/:id/dismiss',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user!.userId;

    // Check if report exists
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

    // Update report status to dismissed
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

// =====================================================
// CATEGORY MANAGEMENT (Super Admin)
// =====================================================

/**
 * GET /api/editor/categories
 * Get all categories with subcategories for admin management
 */
router.get(
  '/categories',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Get all categories with subcategories and ad counts
    const categories = await prisma.categories.findMany({
      where: { parent_id: null },
      include: {
        other_categories: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { ads: true },
            },
          },
        },
        _count: {
          select: { ads: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to include ad counts
    const categoriesWithCounts = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      parentId: cat.parent_id,
      formTemplate: cat.form_template,
      adCount: cat._count.ads,
      subcategories: cat.other_categories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        icon: sub.icon,
        parentId: sub.parent_id,
        formTemplate: sub.form_template,
        adCount: sub._count.ads,
      })),
    }));

    console.log(`✅ [Admin] Retrieved ${categories.length} categories`);

    res.json({
      success: true,
      data: categoriesWithCounts,
    });
  })
);

/**
 * POST /api/editor/categories
 * Create a new category (Super Admin only)
 */
router.post(
  '/categories',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { name, icon, parent_id, form_template } = req.body;

    if (!name) {
      throw new ValidationError('Category name is required');
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if slug already exists
    const existing = await prisma.categories.findFirst({
      where: { slug },
    });

    if (existing) {
      throw new ValidationError('A category with this name already exists');
    }

    const category = await prisma.categories.create({
      data: {
        name,
        slug,
        icon: icon || null,
        parent_id: parent_id || null,
        form_template: form_template || null,
      },
    });

    console.log(`✅ [Admin] Created category: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        parentId: category.parent_id,
        formTemplate: category.form_template,
      },
    });
  })
);

/**
 * PUT /api/editor/categories/:id
 * Update a category (Super Admin only)
 */
router.put(
  '/categories/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, icon, form_template } = req.body;

    const existingCategory = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Generate new slug if name changed
    let slug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if new slug already exists (excluding current category)
      const slugExists = await prisma.categories.findFirst({
        where: {
          slug,
          id: { not: parseInt(id) },
        },
      });

      if (slugExists) {
        throw new ValidationError('A category with this name already exists');
      }
    }

    const category = await prisma.categories.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingCategory.name,
        slug,
        icon: icon !== undefined ? icon : existingCategory.icon,
        form_template: form_template !== undefined ? form_template : existingCategory.form_template,
      },
    });

    console.log(`✅ [Admin] Updated category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        parentId: category.parent_id,
        formTemplate: category.form_template,
      },
    });
  })
);

/**
 * DELETE /api/editor/categories/:id
 * Delete a category (Super Admin only)
 */
router.delete(
  '/categories/:id',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.categories.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            ads: true,
            other_categories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has ads
    if (category._count.ads > 0) {
      throw new ValidationError(
        `Cannot delete category with ${category._count.ads} ads. Please move or delete the ads first.`
      );
    }

    // Check if category has subcategories
    if (category._count.other_categories > 0) {
      throw new ValidationError(
        `Cannot delete category with ${category._count.other_categories} subcategories. Please delete subcategories first.`
      );
    }

    await prisma.categories.delete({
      where: { id: parseInt(id) },
    });

    console.log(`✅ [Admin] Deleted category: ${category.name}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  })
);

export default router;
