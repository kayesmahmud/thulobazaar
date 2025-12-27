import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync } from '../../middleware/errorHandler.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/editor/stats
 * Get dashboard statistics
 */
router.get(
  '/stats',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
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
      data: alerts.length > 0 ? alerts[0] : null,
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
        totalHours += diff / (1000 * 60 * 60);
        count++;
      }
    }

    const avgHours = count > 0 ? totalHours / count : 0;

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
 * Get support chat count
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
 * GET /api/editor/avg-response-time/trend
 * Get average response time trend
 */
router.get(
  '/avg-response-time/trend',
  authenticateToken,
  catchAsync(async (_req: Request, res: Response) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const currentAds = await prisma.ads.findMany({
      where: {
        reviewed_at: { gte: sevenDaysAgo },
        NOT: { reviewed_at: null },
      },
      select: { created_at: true, reviewed_at: true },
    });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      adsApprovedToday,
      adsRejectedToday,
      adsEditedToday,
      businessVerificationsToday,
      individualVerificationsToday,
      supportTicketsAssigned,
    ] = await Promise.all([
      prisma.ads.count({
        where: {
          status: 'approved',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      prisma.ads.count({
        where: {
          status: 'rejected',
          reviewed_by: userId,
          reviewed_at: { gte: today },
        },
      }),
      prisma.admin_activity_logs.count({
        where: {
          admin_id: userId,
          action_type: { contains: 'edit' },
          created_at: { gte: today },
        },
      }).catch(() => 0),
      prisma.business_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
      prisma.individual_verification_requests.count({
        where: {
          reviewed_by: userId,
          reviewed_at: { gte: today },
          status: { in: ['approved', 'rejected'] },
        },
      }).catch(() => 0),
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

export default router;
