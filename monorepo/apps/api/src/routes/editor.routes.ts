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
 * Get users list
 */
router.get(
  '/users',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { limit = '20', offset = '0', search } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { full_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
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
          role: true,
          account_type: true,
          is_active: true,
          business_verification_status: true,
          individual_verified: true,
          created_at: true,
          _count: {
            select: { ads_ads_user_idTousers: true },
          },
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.users.count({ where }),
    ]);

    // Transform to camelCase for frontend (per CLAUDE.md guidelines)
    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        phone: u.phone,
        role: u.role,
        accountType: u.account_type,
        isActive: u.is_active,
        businessVerificationStatus: u.business_verification_status,
        individualVerified: u.individual_verified,
        createdAt: u.created_at,
        adsCount: u._count.ads_ads_user_idTousers,
      })),
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * PUT /api/editor/users/:id/suspend
 * Suspend/unsuspend a user
 */
router.put(
  '/users/:id/suspend',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await prisma.users.update({
      where: { id: parseInt(id) },
      data: { is_active: is_active !== false },
    });

    console.log(`✅ User ${id} ${is_active ? 'activated' : 'suspended'}`);

    res.json({
      success: true,
      message: `User ${is_active ? 'activated' : 'suspended'} successfully`,
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
      // Ads edited today by this editor (use activity_logs if available, fallback to 0)
      prisma.activity_logs.count({
        where: {
          admin_id: userId,
          action_type: { contains: 'edit' },
          created_at: { gte: today },
        },
      }).catch(() => 0),
      // Business verifications processed today by this editor
      prisma.activity_logs.count({
        where: {
          admin_id: userId,
          target_type: 'business_verification',
          created_at: { gte: today },
        },
      }).catch(() => 0),
      // Individual verifications processed today by this editor
      prisma.activity_logs.count({
        where: {
          admin_id: userId,
          target_type: 'individual_verification',
          created_at: { gte: today },
        },
      }).catch(() => 0),
      // Support tickets assigned to this editor (open or in_progress)
      prisma.support_tickets.count({
        where: {
          assigned_to: userId,
          status: { in: ['open', 'in_progress', 'waiting_on_user'] },
        },
      }).catch(() => 0),
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
 */
router.get(
  '/verifications',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { type = 'all', status = 'pending' } = req.query;

    // Get business verifications
    const businessWhere: any = {};
    if (status === 'pending') {
      businessWhere.business_verification_status = 'pending';
    } else if (status === 'all') {
      businessWhere.business_verification_status = { not: null };
    }

    const businessVerifications = type === 'individual' ? [] : await prisma.users.findMany({
      where: {
        ...businessWhere,
        account_type: 'business',
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        business_name: true,
        business_registration_number: true,
        business_type: true,
        business_verification_status: true,
        business_documents: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Get individual verifications (users who requested but aren't verified yet)
    const individualWhere: any = {
      individual_verified: false,
      // Users who have submitted documents for individual verification
      OR: [
        { id_document_type: { not: null } },
        { id_document_number: { not: null } },
      ],
    };

    const individualVerifications = type === 'business' ? [] : await prisma.users.findMany({
      where: individualWhere,
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        id_document_type: true,
        id_document_number: true,
        id_document_front: true,
        id_document_back: true,
        selfie_with_id: true,
        individual_verified: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform and combine results
    const verifications = [
      ...businessVerifications.map((v) => ({
        id: v.id,
        type: 'business' as const,
        fullName: v.full_name,
        email: v.email,
        phone: v.phone,
        businessName: v.business_name,
        registrationNumber: v.business_registration_number,
        businessType: v.business_type,
        status: v.business_verification_status,
        documents: v.business_documents,
        avatar: v.avatar,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      })),
      ...individualVerifications.map((v) => ({
        id: v.id,
        type: 'individual' as const,
        fullName: v.full_name,
        email: v.email,
        phone: v.phone,
        documentType: v.id_document_type,
        documentNumber: v.id_document_number,
        documentFront: v.id_document_front,
        documentBack: v.id_document_back,
        selfieWithId: v.selfie_with_id,
        status: v.individual_verified ? 'approved' : 'pending',
        avatar: v.avatar,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
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

    if (type === 'business') {
      await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          business_verification_status: 'approved',
          business_verified_at: new Date(),
        },
      });
    } else {
      await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          individual_verified: true,
          individual_verified_at: new Date(),
        },
      });
    }

    console.log(`✅ ${type} verification approved for user ${id}`);

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

    if (type === 'business') {
      await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          business_verification_status: 'rejected',
          business_rejection_reason: reason || 'Verification rejected by admin',
        },
      });
    } else {
      await prisma.users.update({
        where: { id: parseInt(id) },
        data: {
          individual_verified: false,
          // Clear the submitted documents
          id_document_type: null,
          id_document_number: null,
          id_document_front: null,
          id_document_back: null,
          selfie_with_id: null,
        },
      });
    }

    console.log(`❌ ${type} verification rejected for user ${id}`);

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
 */
router.post(
  '/editors',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    // Only super_admin can create editors
    if (req.user!.role !== 'super_admin') {
      throw new AuthenticationError('Access denied. Super admin only.');
    }

    const { fullName, email, password } = req.body;

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

    const newEditor = await prisma.users.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
        role: 'editor',
        is_active: true,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    console.log(`✅ New editor created: ${email}`);

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

    console.log('📝 Updating editor:', { id, fullName, email, hasPassword: !!password, isActive });
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

    if (password && typeof password === 'string' && password.trim().length > 0) {
      updateData.password_hash = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);
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

export default router;
