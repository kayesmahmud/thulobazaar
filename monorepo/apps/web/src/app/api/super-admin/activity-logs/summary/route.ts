import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

/**
 * GET /api/super-admin/activity-logs/summary?adminId=12
 * Quick diagnostic to check if admin_activity_logs and review actions exist for a given editor.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const adminIdParam = searchParams.get('adminId') || searchParams.get('admin_id');
    const adminId = adminIdParam ? parseInt(adminIdParam, 10) : null;

    if (!adminId || Number.isNaN(adminId)) {
      return NextResponse.json(
        { success: false, message: 'adminId is required' },
        { status: 400 }
      );
    }

    const [logCount, sampleLogs, adsReviewed, businessReviewed, individualReviewed] = await Promise.all([
      prisma.admin_activity_logs.count({ where: { admin_id: adminId } }),
      prisma.admin_activity_logs.findMany({
        where: { admin_id: adminId },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),
      prisma.ads.count({
        where: { reviewed_by: adminId, status: { in: ['approved', 'rejected'] } },
      }),
      prisma.business_verification_requests.count({
        where: { reviewed_by: adminId, status: { in: ['approved', 'rejected'] } },
      }),
      prisma.individual_verification_requests.count({
        where: { reviewed_by: adminId, status: { in: ['approved', 'rejected'] } },
      }),
    ]).catch((err) => {
      console.error('Diagnostics error:', err);
      throw err;
    });

    return NextResponse.json({
      success: true,
      data: {
        adminId,
        adminActivityLogs: {
          total: logCount,
          sample: sampleLogs,
        },
        adsReviewed,
        businessReviewed,
        individualReviewed,
      },
    });
  } catch (error: any) {
    console.error('Activity logs summary error:', error);

    if (error?.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
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
      { success: false, message: 'Failed to fetch activity summary' },
      { status: 500 }
    );
  }
}
