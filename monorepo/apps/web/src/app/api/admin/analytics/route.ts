import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/jwt';

const REVENUE_STATUSES = ['verified', 'completed', 'paid', 'success', 'approved'];

const getStartDate = (range: '7d' | '30d' | '90d') => {
  const now = new Date();
  const start = new Date(now);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildDateBuckets = (start: Date, end: Date) => {
  const buckets: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    buckets.push(current.toISOString().slice(0, 10)); // YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }
  return buckets;
};

const formatLabel = (isoDate: string, range: '7d' | '30d' | '90d') => {
  const date = new Date(isoDate);
  if (range === '7d') {
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // Dec 10
};

export async function GET(request: NextRequest) {
  try {
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as '7d' | '30d' | '90d') || '7d';

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = getStartDate(range);
    const buckets = buildDateBuckets(start, end);

    const [payments, users] = await Promise.all([
      prisma.payment_transactions.findMany({
        where: {
          created_at: { gte: start },
          status: { in: REVENUE_STATUSES },
        },
        select: { amount: true, created_at: true },
      }),
      prisma.users.findMany({
        where: { created_at: { gte: start } },
        select: { created_at: true },
      }),
    ]);

    const revenueMap = new Map<string, number>();
    const userMap = new Map<string, number>();

    buckets.forEach((d) => {
      revenueMap.set(d, 0);
      userMap.set(d, 0);
    });

    payments.forEach((p) => {
      if (!p.created_at) return;
      const key = new Date(p.created_at).toISOString().slice(0, 10);
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) || 0) + Number(p.amount || 0));
      }
    });

    users.forEach((u) => {
      if (!u.created_at) return;
      const key = new Date(u.created_at).toISOString().slice(0, 10);
      if (userMap.has(key)) {
        userMap.set(key, (userMap.get(key) || 0) + 1);
      }
    });

    const labels = buckets.map((d) => formatLabel(d, range));
    const revenueSeries = buckets.map((d) => revenueMap.get(d) || 0);
    const userSeries = buckets.map((d) => userMap.get(d) || 0);

    return NextResponse.json({
      success: true,
      data: {
        labels,
        revenueSeries,
        userSeries,
        range,
      },
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);

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
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
