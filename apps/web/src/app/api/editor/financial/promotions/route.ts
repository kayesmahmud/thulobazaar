import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { escapeLike } from '@/lib/financial/like';
import { MONTH_PATTERN, nptMonthRange, nptMonthSql } from '@/lib/financial/time';

/**
 * GET /api/editor/financial/promotions
 * Every ad promotion ever granted or paid for, newest first — one row per event.
 *
 * Source of record is the append-only `purchase_history` ledger (written only by
 * DB triggers, no FKs, so it survives ad and account deletion):
 *  - event='grant' kind='ad_promotion': one per ad_promotions INSERT, or a grant
 *    reconstructed from a verified payment whose entitlement was cascaded away.
 *    payment_status is 'paid' | 'comped' (staff, price 0) | 'unpaid' (price
 *    recorded, no verified payment — must stay visible).
 *  - event='payment' kind='ad_promotion' that NO grant references through
 *    payment_transaction_id: money received but never provisioned. Shown with
 *    status 'unknown' so revenue never silently disappears.
 *
 * Live tables only refine what the ledger says:
 *  - users: missing row => accountDeleted, identity from the snapshot; else the
 *    live name/phone/email/slug win (people fix typos in their profile).
 *  - ads: adDeleted when the row is gone, soft-deleted, or status 'deleted'.
 *  - ad_promotions (grant's source row): live is_active / expires_at drive
 *    active|ended|expired; when it is gone the snapshot expiry still says
 *    'expired', otherwise 'removed' (ad gone) or 'unknown'.
 *
 * All month bucketing and the month filter are in Nepal time (see lib/financial/time).
 *
 * Query: ?month=YYYY-MM ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;

interface PromotionRow {
  history_id: number;
  event: string;
  user_id: number;
  account_deleted: boolean;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  shop_slug: string | null;
  ad_id: number | null;
  ad_title: string | null;
  ad_deleted: boolean;
  promotion_type: string | null;
  duration_days: number | null;
  price: unknown;
  payment_status: string;
  occurred_at: Date;
  starts_at: Date | null;
  expires_at: Date | null;
  live_present: boolean;
  is_active: boolean | null;
}

type PromotionStatus = 'active' | 'ended' | 'expired' | 'removed' | 'unknown';
type PaymentStatus = 'paid' | 'comped' | 'unpaid';

/**
 * Extending a running promotion flips the OLD row to is_active=false while its
 * expires_at is still in the future, so "not expired" alone does not mean live.
 */
function promotionStatus(row: PromotionRow, now: number): PromotionStatus {
  // A payment nothing was ever provisioned for: there is no entitlement to describe.
  if (row.event === 'payment') return 'unknown';
  const expired = row.expires_at !== null && row.expires_at.getTime() <= now;
  if (row.live_present) {
    if (expired) return 'expired';
    return row.is_active === true ? 'active' : 'ended';
  }
  if (expired) return 'expired';
  return row.ad_deleted ? 'removed' : 'unknown';
}

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
    const pattern = `%${escapeLike(search)}%`;
    const offset = (page - 1) * limit;

    // The one row set every query below reads from. Test accounts are removed
    // here so the list, its count and the month totals can never disagree.
    const rowSet = Prisma.sql`
      SELECT h.id AS history_id,
             h.event,
             h.user_id,
             (u.id IS NULL) AS account_deleted,
             COALESCE(u.full_name, h.user_name) AS full_name,
             COALESCE(u.phone, h.user_phone) AS phone,
             COALESCE(u.email, h.user_email) AS email,
             COALESCE(u.custom_shop_slug, u.shop_slug, h.shop_slug) AS shop_slug,
             h.ad_id,
             COALESCE(a.title, h.ad_title) AS ad_title,
             (a.id IS NULL OR a.deleted_at IS NOT NULL OR COALESCE(a.status, '') = 'deleted') AS ad_deleted,
             h.promotion_type,
             h.duration_days,
             h.amount AS price,
             h.payment_status,
             h.occurred_at,
             p.starts_at,
             COALESCE(p.expires_at, h.expires_at) AS expires_at,
             (p.id IS NOT NULL) AS live_present,
             p.is_active
      FROM purchase_history h
      LEFT JOIN users u ON u.id = h.user_id
      LEFT JOIN ads a ON a.id = h.ad_id
      LEFT JOIN ad_promotions p ON h.source_table = 'ad_promotions' AND p.id = h.source_id
      WHERE h.kind = 'ad_promotion'
        AND h.user_id <> ALL(${excluded}::int[])
        AND (
          h.event = 'grant'
          OR (
            h.event = 'payment'
            AND NOT EXISTS (
              SELECT 1 FROM purchase_history g
              WHERE g.event = 'grant'
                AND g.kind = 'ad_promotion'
                AND g.payment_transaction_id = h.payment_transaction_id
            )
          )
        )
    `;

    const monthFilter = month
      ? (({ start, end }) => Prisma.sql`AND x.occurred_at >= ${start} AND x.occurred_at < ${end}`)(nptMonthRange(month))
      : Prisma.empty;

    const filters = Prisma.sql`
      WHERE TRUE
        ${monthFilter}
        AND (
          ${search} = ''
          OR x.full_name ILIKE ${pattern}
          OR x.phone ILIKE ${pattern}
          OR x.email ILIKE ${pattern}
        )
    `;

    const [rows, countRows, monthRows] = await Promise.all([
      prisma.$queryRaw<PromotionRow[]>`
        SELECT x.*
        FROM (${rowSet}) x
        ${filters}
        ORDER BY x.occurred_at DESC, x.history_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total
        FROM (${rowSet}) x
        ${filters}
      `,
      // Month list for the filter dropdown + per-month totals (unfiltered row set).
      // Revenue is money actually received: comped and unpaid grants add nothing.
      prisma.$queryRaw<{ month: string; purchases: bigint; buyers: bigint; revenue: unknown }[]>`
        SELECT ${nptMonthSql('x.occurred_at')} AS month,
               COUNT(*) AS purchases,
               COUNT(DISTINCT x.user_id) AS buyers,
               COALESCE(SUM(x.price) FILTER (WHERE x.payment_status = 'paid'), 0) AS revenue
        FROM (${rowSet}) x
        GROUP BY 1
        ORDER BY 1 DESC
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const now = Date.now();

    return NextResponse.json({
      success: true,
      data: {
        rows: rows.map(r => {
          // The ledger trigger writes exactly these three for ad_promotion events.
          const paymentStatus = r.payment_status as PaymentStatus;
          return {
            id: `h-${r.history_id}`,
            userId: r.user_id,
            userName: r.full_name || 'Unknown',
            userPhone: r.phone || '',
            userEmail: r.email || '',
            shopSlug: r.shop_slug || null,
            accountDeleted: r.account_deleted,
            adId: r.ad_id,
            adTitle: r.ad_title || (r.ad_deleted ? '(ad deleted)' : `Ad #${r.ad_id}`),
            adDeleted: r.ad_deleted,
            type: r.promotion_type || 'unknown',
            durationDays: r.duration_days,
            pricePaid: Number(r.price),
            paymentStatus,
            comped: paymentStatus === 'comped',
            purchasedAt: r.occurred_at.toISOString(),
            startsAt: r.starts_at?.toISOString() ?? null,
            expiresAt: r.expires_at?.toISOString() ?? null,
            status: promotionStatus(r, now),
          };
        }),
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
