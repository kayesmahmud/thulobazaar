import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

/**
 * GET /api/admin/stats
 * Get dashboard statistics for editor dashboard
 * Requires: Editor or Super Admin role
 *
 * Returns:
 * - totalUsers: Total registered users
 * - activeUsers: Active users count
 * - totalAds: Total ads count (not deleted)
 * - activeAds: Approved/active ads count
 * - pendingAds: Pending ads count
 * - adsThisWeek: Ads created during the last 7 days
 * - usersThisWeek: Users created during the last 7 days
 * - todayAds: Ads created since start of current day
 * - totalViews: Sum of ad view counts
 * - pendingVerifications: Pending business + individual verifications count
 * - topCategories: Top 5 categories by ad count
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate editor
    await requireEditor(request);

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalAds,
      pendingAds,
      activeAds,
      adsThisWeek,
      usersThisWeek,
      todayAds,
      viewsAggregate,
      topCategoryGroups,
      pendingBusinessVerifications,
      pendingIndividualVerifications,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.ads.count({ where: { deleted_at: null } }),
      prisma.ads.count({ where: { status: 'pending', deleted_at: null } }),
      prisma.ads.count({
        where: {
          deleted_at: null,
          status: { in: ['approved', 'active'] },
        },
      }),
      prisma.ads.count({
        where: {
          deleted_at: null,
          created_at: { gte: weekAgo },
        },
      }),
      prisma.users.count({
        where: {
          created_at: { gte: weekAgo },
        },
      }),
      prisma.ads.count({
        where: {
          deleted_at: null,
          created_at: { gte: startOfToday },
        },
      }),
      prisma.ads.aggregate({
        _sum: { view_count: true },
        where: { deleted_at: null },
      }),
      prisma.ads.groupBy({
        by: ['category_id'],
        where: { deleted_at: null, category_id: { not: null } },
        _count: true,
        orderBy: { _count: { category_id: 'desc' } },
        take: 5,
      }),
      prisma.business_verification_requests.count({ where: { status: 'pending' } }),
      prisma.individual_verification_requests.count({ where: { status: 'pending' } }),
    ]);

    const pendingVerifications = pendingBusinessVerifications + pendingIndividualVerifications;
    const totalViews = viewsAggregate._sum.view_count ?? 0;

    const categoryIds = topCategoryGroups
      .map((group) => group.category_id)
      .filter((id): id is number => typeof id === 'number');

    const categories = categoryIds.length
      ? await prisma.categories.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

    const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));

    const topCategories = topCategoryGroups.map((group) => ({
      categoryId: group.category_id,
      name: categoryNameMap.get(group.category_id ?? 0) || 'Uncategorized',
      totalAds: typeof group._count === 'number' ? group._count : 0,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalAds,
          activeAds,
          pendingAds,
          adsThisWeek,
          usersThisWeek,
          todayAds,
          totalViews,
          pendingVerifications,
          topCategories,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin stats fetch error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
