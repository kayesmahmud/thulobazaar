import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

const REVENUE_STATUSES = ['verified', 'completed', 'paid', 'success', 'approved'];

/**
 * GET /api/super-admin/analytics
 * Comprehensive analytics for super-admin dashboard
 *
 * Query params:
 * - range: '7d' | '30d' | '90d' (default: '30d')
 * - month: 1-12 (optional, for monthly view)
 * - year: YYYY (optional, for yearly/monthly view)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') as '7d' | '30d' | '90d' | null;
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;
    let periodType: 'days' | 'month' | 'year' = 'days';
    let days = 30;

    const now = new Date();

    if (yearParam) {
      const year = parseInt(yearParam);

      if (monthParam) {
        // Monthly view
        const month = parseInt(monthParam) - 1; // JS months are 0-indexed
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month

        // Previous month for comparison
        prevStartDate = new Date(year, month - 1, 1);
        prevEndDate = new Date(year, month, 0, 23, 59, 59, 999);

        periodType = 'month';
        days = new Date(year, month + 1, 0).getDate(); // Days in month
      } else {
        // Yearly view
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // Previous year for comparison
        prevStartDate = new Date(year - 1, 0, 1);
        prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59, 999);

        periodType = 'year';
        days = 365;
      }
    } else {
      // Range-based view (7d, 30d, 90d)
      days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      // Previous period
      prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - days + 1);
      prevStartDate.setHours(0, 0, 0, 0);
    }

    const [
      // Current period stats
      totalUsers,
      activeUsers,
      newUsersCurrentPeriod,
      totalAds,
      activeAds,
      newAdsCurrentPeriod,
      totalViews,
      totalRevenue,
      periodViews,

      // Previous period for comparison
      newUsersPrevPeriod,
      newAdsPrevPeriod,
      prevRevenue,

      // Breakdowns (filtered by period)
      usersByType,
      adsByStatus,
      adsByCategory,
      adsByLocation,
      revenueByType,

      // Verifications
      pendingBusinessVerifications,
      pendingIndividualVerifications,
      approvedBusinessVerifications,
      approvedIndividualVerifications,

      // Period-specific verifications
      newBusinessVerifications,
      newIndividualVerifications,
      approvedBusinessInPeriod,
      approvedIndividualInPeriod,

      // Top performers in period
      topCategories,
      topLocations,
    ] = await Promise.all([
      // Current totals (all-time)
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
      prisma.ads.count({ where: { deleted_at: null } }),
      prisma.ads.count({ where: { deleted_at: null, status: { in: ['approved', 'active'] } } }),
      prisma.ads.count({ where: { deleted_at: null, created_at: { gte: startDate, lte: endDate } } }),
      prisma.ads.aggregate({ _sum: { view_count: true }, where: { deleted_at: null } }),
      prisma.payment_transactions.aggregate({
        _sum: { amount: true },
        where: { status: { in: REVENUE_STATUSES }, created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.ads.aggregate({
        _sum: { view_count: true },
        where: { deleted_at: null, created_at: { gte: startDate, lte: endDate } },
      }),

      // Previous period
      prisma.users.count({ where: { created_at: { gte: prevStartDate, lte: prevEndDate } } }),
      prisma.ads.count({ where: { deleted_at: null, created_at: { gte: prevStartDate, lte: prevEndDate } } }),
      prisma.payment_transactions.aggregate({
        _sum: { amount: true },
        where: { status: { in: REVENUE_STATUSES }, created_at: { gte: prevStartDate, lte: prevEndDate } },
      }),

      // User type breakdown (period)
      prisma.users.groupBy({
        by: ['account_type'],
        where: { created_at: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      // Ad status breakdown (period)
      prisma.ads.groupBy({
        by: ['status'],
        where: { deleted_at: null, created_at: { gte: startDate, lte: endDate } },
        _count: true,
      }),

      // Ads by category (period)
      prisma.ads.groupBy({
        by: ['category_id'],
        where: { deleted_at: null, category_id: { not: null }, created_at: { gte: startDate, lte: endDate } },
        _count: true,
        orderBy: { _count: { category_id: 'desc' } },
        take: 10,
      }),

      // Ads by location (period)
      prisma.ads.groupBy({
        by: ['location_id'],
        where: { deleted_at: null, location_id: { not: null }, created_at: { gte: startDate, lte: endDate } },
        _count: true,
        orderBy: { _count: { location_id: 'desc' } },
        take: 10,
      }),

      // Revenue by payment type (period)
      prisma.payment_transactions.groupBy({
        by: ['payment_type'],
        where: { status: { in: REVENUE_STATUSES }, created_at: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true,
      }),

      // Verifications (all-time)
      prisma.business_verification_requests.count({ where: { status: 'pending' } }),
      prisma.individual_verification_requests.count({ where: { status: 'pending' } }),
      prisma.users.count({ where: { business_verification_status: { in: ['approved', 'verified'] } } }),
      prisma.users.count({ where: { individual_verified: true } }),

      // Period-specific verifications
      prisma.business_verification_requests.count({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.individual_verification_requests.count({
        where: { created_at: { gte: startDate, lte: endDate } },
      }),
      prisma.business_verification_requests.count({
        where: { status: 'approved', reviewed_at: { gte: startDate, lte: endDate } },
      }),
      prisma.individual_verification_requests.count({
        where: { status: 'approved', reviewed_at: { gte: startDate, lte: endDate } },
      }),

      // Top categories (period)
      prisma.ads.groupBy({
        by: ['category_id'],
        where: { deleted_at: null, category_id: { not: null }, created_at: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { view_count: true },
        orderBy: { _count: { category_id: 'desc' } },
        take: 5,
      }),

      // Top locations (period)
      prisma.ads.groupBy({
        by: ['location_id'],
        where: { deleted_at: null, location_id: { not: null }, created_at: { gte: startDate, lte: endDate } },
        _count: true,
        orderBy: { _count: { location_id: 'desc' } },
        take: 5,
      }),
    ]);

    // Time series data based on period type
    let dailyUsers: Array<{ date: Date; count: bigint }> = [];
    let dailyAds: Array<{ date: Date; count: bigint }> = [];
    let dailyRevenue: Array<{ date: Date; total: number }> = [];

    if (periodType === 'year') {
      // Monthly aggregation for yearly view
      dailyUsers = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE_TRUNC('month', created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY date
      `;
      dailyAds = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE_TRUNC('month', created_at) as date, COUNT(*) as count
        FROM ads
        WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY date
      `;
      dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; total: number }>>`
        SELECT DATE_TRUNC('month', created_at) as date, COALESCE(SUM(amount), 0) as total
        FROM payment_transactions
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
          AND status IN ('verified', 'completed', 'paid', 'success', 'approved')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY date
      `;
    } else {
      // Daily aggregation for month or day range
      dailyUsers = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      dailyAds = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM ads
        WHERE created_at >= ${startDate} AND created_at <= ${endDate} AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      dailyRevenue = await prisma.$queryRaw<Array<{ date: Date; total: number }>>`
        SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as total
        FROM payment_transactions
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
          AND status IN ('verified', 'completed', 'paid', 'success', 'approved')
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
    }

    // Get category and location names
    const categoryIds = [...new Set([
      ...adsByCategory.map(c => c.category_id),
      ...topCategories.map(c => c.category_id),
    ])].filter((id): id is number => id !== null);

    const locationIds = [...new Set([
      ...adsByLocation.map(l => l.location_id),
      ...topLocations.map(l => l.location_id),
    ])].filter((id): id is number => id !== null);

    const [categories, locations] = await Promise.all([
      categoryIds.length ? prisma.categories.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      }) : [],
      locationIds.length ? prisma.locations.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, name: true },
      }) : [],
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentRevenue = Number(totalRevenue._sum.amount || 0);
    const previousRevenue = Number(prevRevenue._sum.amount || 0);

    // Build date labels for charts
    const dateLabels: string[] = [];
    const userChartData: number[] = [];
    const adChartData: number[] = [];
    const revenueChartData: number[] = [];

    if (periodType === 'year') {
      // Monthly labels for yearly view
      const months: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dailyUsersMap = new Map(dailyUsers.map(d => [
        new Date(d.date).getMonth(),
        Number(d.count),
      ]));
      const dailyAdsMap = new Map(dailyAds.map(d => [
        new Date(d.date).getMonth(),
        Number(d.count),
      ]));
      const dailyRevenueMap = new Map(dailyRevenue.map(d => [
        new Date(d.date).getMonth(),
        Number(d.total),
      ]));

      for (let i = 0; i < 12; i++) {
        dateLabels.push(months[i] as string);
        userChartData.push(dailyUsersMap.get(i) || 0);
        adChartData.push(dailyAdsMap.get(i) || 0);
        revenueChartData.push(dailyRevenueMap.get(i) || 0);
      }
    } else {
      // Daily labels
      const dailyUsersMap = new Map(dailyUsers.map(d => [
        new Date(d.date).toISOString().slice(0, 10),
        Number(d.count),
      ]));
      const dailyAdsMap = new Map(dailyAds.map(d => [
        new Date(d.date).toISOString().slice(0, 10),
        Number(d.count),
      ]));
      const dailyRevenueMap = new Map(dailyRevenue.map(d => [
        new Date(d.date).toISOString().slice(0, 10),
        Number(d.total),
      ]));

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const key = currentDate.toISOString().slice(0, 10);
        const label = days <= 7
          ? currentDate.toLocaleDateString('en-US', { weekday: 'short' })
          : currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        dateLabels.push(label);
        userChartData.push(dailyUsersMap.get(key) || 0);
        adChartData.push(dailyAdsMap.get(key) || 0);
        revenueChartData.push(dailyRevenueMap.get(key) || 0);

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Build period label
    let periodLabel = '';
    if (yearParam && monthParam) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      periodLabel = `${monthNames[parseInt(monthParam) - 1]} ${yearParam}`;
    } else if (yearParam) {
      periodLabel = `Year ${yearParam}`;
    } else {
      periodLabel = range === '7d' ? 'Last 7 Days' : range === '90d' ? 'Last 90 Days' : 'Last 30 Days';
    }

    return NextResponse.json({
      success: true,
      data: {
        // Period info
        period: {
          type: periodType,
          label: periodLabel,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },

        // Overview stats
        overview: {
          totalUsers,
          activeUsers,
          newUsers: newUsersCurrentPeriod,
          userGrowth: calcChange(newUsersCurrentPeriod, newUsersPrevPeriod),
          totalAds,
          activeAds,
          newAds: newAdsCurrentPeriod,
          adGrowth: calcChange(newAdsCurrentPeriod, newAdsPrevPeriod),
          totalViews: totalViews._sum.view_count || 0,
          periodViews: periodViews._sum.view_count || 0,
          totalRevenue: currentRevenue,
          revenueGrowth: calcChange(currentRevenue, previousRevenue),
        },

        // Verifications
        verifications: {
          pendingBusiness: pendingBusinessVerifications,
          pendingIndividual: pendingIndividualVerifications,
          approvedBusiness: approvedBusinessVerifications,
          approvedIndividual: approvedIndividualVerifications,
          // Period-specific
          newBusinessRequests: newBusinessVerifications,
          newIndividualRequests: newIndividualVerifications,
          approvedBusinessInPeriod,
          approvedIndividualInPeriod,
        },

        // Charts data
        charts: {
          labels: dateLabels,
          users: userChartData,
          ads: adChartData,
          revenue: revenueChartData,
        },

        // Breakdowns (for this period)
        usersByType: usersByType.map(u => ({
          type: u.account_type || 'unknown',
          count: u._count,
        })),

        adsByStatus: adsByStatus.map(a => ({
          status: a.status || 'unknown',
          count: a._count,
        })),

        topCategories: topCategories.map(c => ({
          id: c.category_id,
          name: categoryMap.get(c.category_id ?? 0) || 'Uncategorized',
          adCount: c._count,
          views: c._sum.view_count || 0,
        })),

        topLocations: topLocations.map(l => ({
          id: l.location_id,
          name: locationMap.get(l.location_id ?? 0) || 'Unknown',
          adCount: l._count,
        })),

        revenueByType: revenueByType.map(r => ({
          type: r.payment_type || 'other',
          amount: Number(r._sum.amount || 0),
          count: r._count,
        })),

        // Summary for reports
        summary: {
          totalNewUsers: newUsersCurrentPeriod,
          totalNewAds: newAdsCurrentPeriod,
          totalRevenue: currentRevenue,
          totalTransactions: revenueByType.reduce((sum, r) => sum + r._count, 0),
          verificationsProcessed: approvedBusinessInPeriod + approvedIndividualInPeriod,
          avgRevenuePerDay: days > 0 ? Math.round(currentRevenue / days) : 0,
          avgAdsPerDay: days > 0 ? Math.round(newAdsCurrentPeriod / days) : 0,
          avgUsersPerDay: days > 0 ? Math.round(newUsersCurrentPeriod / days) : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Super admin analytics error:', error);

    if (error?.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Super admin access required' },
        { status: 401 }
      );
    }

    if (error?.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
