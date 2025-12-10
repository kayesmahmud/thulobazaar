import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/jwt';

const nowUtc = () => {
  const d = new Date();
  d.setMilliseconds(0);
  return d;
};

const getRangeStart = (days: number) => {
  const d = nowUtc();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * GET /api/super-admin/editors/:id/activity
 * Aggregates activities for a given editor (ads + verifications + admin logs)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const editorId = parseInt(id, 10);
    if (Number.isNaN(editorId)) {
      return NextResponse.json({ success: false, message: 'Invalid editor id' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    let monthFilter: { gte: Date; lt: Date } | null = null;
    if (monthParam && yearParam) {
      const month = parseInt(monthParam, 10);
      const year = parseInt(yearParam, 10);
      if (!Number.isNaN(month) && !Number.isNaN(year) && month >= 1 && month <= 12) {
        const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        monthFilter = { gte: start, lt: end };
      }
    }

    const [adsReviewed, businessVerifications, individualVerifications, adminLogs] = await Promise.all([
      prisma.ads.findMany({
        where: {
          reviewed_by: editorId,
          status: { in: ['approved', 'rejected'] },
          ...(monthFilter ? { reviewed_at: monthFilter } : {}),
        },
        select: {
          id: true,
          title: true,
          status: true,
          reviewed_at: true,
          status_reason: true,
        },
        orderBy: { reviewed_at: 'desc' },
      }),
      prisma.business_verification_requests.findMany({
        where: {
          reviewed_by: editorId,
          status: { in: ['approved', 'rejected'] },
          ...(monthFilter ? { reviewed_at: monthFilter } : {}),
        },
        select: {
          id: true,
          user_id: true,
          business_name: true,
          status: true,
          rejection_reason: true,
          reviewed_at: true,
        },
        orderBy: { reviewed_at: 'desc' },
      }),
      prisma.individual_verification_requests.findMany({
        where: {
          reviewed_by: editorId,
          status: { in: ['approved', 'rejected'] },
          ...(monthFilter ? { reviewed_at: monthFilter } : {}),
        },
        select: {
          id: true,
          user_id: true,
          full_name: true,
          status: true,
          rejection_reason: true,
          reviewed_at: true,
        },
        orderBy: { reviewed_at: 'desc' },
      }),
      prisma.admin_activity_logs.findMany({
        where: { admin_id: editorId, ...(monthFilter ? { created_at: monthFilter } : {}) },
        orderBy: { created_at: 'desc' },
        take: 100,
      }).catch(() => []),
    ]);

    const supportTicketCounts = await prisma.support_tickets
      .count({ where: { assigned_to: editorId, ...(monthFilter ? { updated_at: monthFilter } : {}) } })
      .catch(() => 0);

    const buildRangeCounts = async (start: Date) => {
      const [ads, business, individual, tickets] = await Promise.all([
        prisma.ads.count({
          where: {
            reviewed_by: editorId,
            status: { in: ['approved', 'rejected'] },
            reviewed_at: { gte: start },
          },
        }),
        prisma.business_verification_requests.count({
          where: {
            reviewed_by: editorId,
            status: { in: ['approved', 'rejected'] },
            reviewed_at: { gte: start },
          },
        }),
        prisma.individual_verification_requests.count({
          where: {
            reviewed_by: editorId,
            status: { in: ['approved', 'rejected'] },
            reviewed_at: { gte: start },
          },
        }),
        prisma.support_tickets
          .count({ where: { assigned_to: editorId, updated_at: { gte: start } } })
          .catch(() => 0),
      ]);
      return { ads, business, individual, supportTickets: tickets };
    };

    const timeBuckets = monthFilter
      ? undefined
      : {
          daily: await buildRangeCounts(getRangeStart(1)),
          weekly: await buildRangeCounts(getRangeStart(7)),
          monthly: await buildRangeCounts(getRangeStart(30)),
        };

    const activities = [
      ...adsReviewed.map((ad) => ({
        id: ad.id,
        type: ad.status === 'approved' ? 'ad_approved' : 'ad_rejected',
        timestamp: ad.reviewed_at || new Date(),
        details: ad.title,
        relatedId: ad.id,
      })),
      ...businessVerifications.map((bv) => ({
        id: bv.id,
        type: bv.status === 'approved' ? 'business_approved' : 'business_rejected',
        timestamp: bv.reviewed_at || new Date(),
        details: bv.business_name,
        relatedId: bv.user_id,
      })),
      ...individualVerifications.map((iv) => ({
        id: iv.id,
        type: iv.status === 'approved' ? 'individual_approved' : 'individual_rejected',
        timestamp: iv.reviewed_at || new Date(),
        details: iv.full_name,
        relatedId: iv.user_id,
      })),
      ...adminLogs.map((log: any) => ({
        id: log.id,
        type: log.action_type,
        timestamp: log.created_at || new Date(),
        details: log.details,
        relatedId: log.target_id,
      })),
    ].sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime());

    const adWork = adsReviewed.map((ad) => ({
      id: ad.id,
      adTitle: ad.title || `Ad #${ad.id}`,
      action: ad.status === 'approved' ? 'approved' : 'rejected',
      timestamp: ad.reviewed_at || new Date(),
      reason: ad.status_reason || null,
    }));

    const businessWork = businessVerifications.map((bv) => ({
      id: bv.id,
      sellerName: bv.business_name || `Business #${bv.id}`,
      action: bv.status === 'approved' ? 'approved' : 'rejected',
      timestamp: bv.reviewed_at || new Date(),
      reason: bv.rejection_reason || null,
    }));

    const individualWork = individualVerifications.map((iv) => ({
      id: iv.id,
      sellerName: iv.full_name || `User #${iv.user_id}`,
      action: iv.status === 'approved' ? 'approved' : 'rejected',
      timestamp: iv.reviewed_at || new Date(),
      reason: iv.rejection_reason || null,
    }));

    const stats = {
      adsApproved: adWork.filter((a) => a.action === 'approved').length,
      adsRejected: adWork.filter((a) => a.action === 'rejected').length,
      adsEdited: 0,
      adsDeleted: 0,
      businessApproved: businessWork.filter((b) => b.action === 'approved').length,
      businessRejected: businessWork.filter((b) => b.action === 'rejected').length,
      individualApproved: individualWork.filter((i) => i.action === 'approved').length,
      individualRejected: individualWork.filter((i) => i.action === 'rejected').length,
      supportTickets: supportTicketCounts || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        activities,
        adWork,
        businessVerifications: businessWork,
        individualVerifications: individualWork,
        stats,
        timeBuckets,
      },
    });
  } catch (error: any) {
    console.error('Editor activity fetch error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch activity' },
      { status: error?.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
