import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';

/**
 * GET /api/editor/financial/promotions
 * Every ad promotion ever bought, newest first — one row per purchase.
 *
 * Sourced from `ad_promotions` (the entitlement) rather than
 * payment_transactions, so staff-comped promotions are visible too, flagged as
 * `comped` when payment_method='manual'. Expired promotions are included by design.
 *
 * Query: ?month=YYYY-MM ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

/** `%` and `_` are LIKE wildcards — a bare `_` would otherwise match every row. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, c => `\\${c}`);

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const search = (searchParams.get('search') || '').trim();
    const month = (searchParams.get('month') || '').trim();

    if (month && !MONTH_PATTERN.test(month)) {
      return NextResponse.json({ success: false, message: 'month must be YYYY-MM' }, { status: 400 });
    }

    const excluded = await getExcludedUserIds();

    const where: any = {};
    if (excluded.length > 0) where.user_id = { notIn: excluded };

    if (month) {
      const [year, m] = month.split('-').map(Number);
      where.created_at = {
        gte: new Date(Date.UTC(year!, m! - 1, 1)),
        lt: new Date(Date.UTC(m === 12 ? year! + 1 : year!, m === 12 ? 0 : m!, 1)),
      };
    }

    if (search) {
      const safe = escapeLike(search);
      where.users = {
        OR: [
          { full_name: { contains: safe, mode: 'insensitive' } },
          { phone: { contains: safe, mode: 'insensitive' } },
          { email: { contains: safe, mode: 'insensitive' } },
        ],
      };
    }

    const [total, rows, monthRows] = await Promise.all([
      prisma.ad_promotions.count({ where }),
      prisma.ad_promotions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, user_id: true, ad_id: true, promotion_type: true,
          duration_days: true, price_paid: true, payment_method: true,
          starts_at: true, expires_at: true,
          is_active: true, created_at: true,
          ads: { select: { title: true } },
          users: {
            select: {
              id: true, full_name: true, phone: true, email: true,
              shop_slug: true, custom_shop_slug: true,
            },
          },
        },
      }),
      // Month list for the filter dropdown + per-month totals
      prisma.$queryRaw<{ month: string; purchases: bigint; buyers: bigint; revenue: unknown }[]>`
        SELECT to_char(created_at, 'YYYY-MM') AS month,
               COUNT(*) AS purchases,
               COUNT(DISTINCT user_id) AS buyers,
               COALESCE(SUM(price_paid), 0) AS revenue
        FROM ad_promotions
        WHERE (${excluded.length} = 0 OR user_id <> ALL(${excluded}::int[]))
        GROUP BY 1
        ORDER BY 1 DESC
      `,
    ]);

    const now = Date.now();

    return NextResponse.json({
      success: true,
      data: {
        rows: rows.map(p => ({
          id: p.id,
          userId: p.user_id,
          userName: p.users?.full_name || 'Unknown',
          userPhone: p.users?.phone || '',
          userEmail: p.users?.email || '',
          shopSlug: p.users?.custom_shop_slug || p.users?.shop_slug || null,
          adId: p.ad_id,
          adTitle: p.ads?.title || `Ad #${p.ad_id}`,
          type: p.promotion_type,
          durationDays: p.duration_days,
          pricePaid: Number(p.price_paid),
          paymentMethod: p.payment_method || '',
          // A staff-granted comp, not a sale. `payment_method` is the reliable signal:
          // verified on prod, 'manual' rows always have price_paid = 0 and 'online' rows
          // always have price_paid > 0. `promoted_by` is NOT a comp flag — it records who
          // initiated the promotion, which for self-serve checkout is the buyer themselves.
          comped: p.payment_method === 'manual',
          purchasedAt: p.created_at?.toISOString() ?? null,
          startsAt: p.starts_at?.toISOString() ?? null,
          expiresAt: p.expires_at.toISOString(),
          expired: p.expires_at.getTime() <= now,
        })),
        months: monthRows.map(m => ({
          month: m.month,
          purchases: Number(m.purchases),
          buyers: Number(m.buyers),
          revenue: Number(m.revenue),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Financial promotions error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch promotions' }, { status: 500 });
  }
}
