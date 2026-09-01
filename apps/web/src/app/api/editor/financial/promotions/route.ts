import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { escapeLike } from '@/lib/financial/like';
import { MONTH_PATTERN, nptMonthRange, nptMonthSql } from '@/lib/financial/time';

/**
 * GET /api/editor/financial/promotions
 * Every ad promotion ever bought, newest first — one row per purchase.
 *
 * Two sources, unioned:
 *  - `ad_promotions` (the entitlement). Includes staff-comped promotions, which
 *    never touch payment_transactions; `comped` = price_paid is 0. Expired and
 *    superseded (is_active=false) promotions are included by design.
 *  - Orphaned `payment_transactions`: verified promotion payments whose
 *    ad_promotions row no longer exists. ad_promotions cascades from ads and
 *    users can hard-delete ads, so real revenue would otherwise vanish from
 *    this history. Those rows get status 'unknown'; `adDeleted` is true only when
 *    the ad itself is gone (a still-existing ad means paid-without-entitlement).
 *    type/duration come from the transaction's metadata; title from the live ad
 *    when it exists, else from metadata.
 *
 * All month bucketing and the month filter are in Nepal time (see lib/financial/time).
 *
 * Query: ?month=YYYY-MM ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;

interface PromotionRow {
  id_key: string;
  orphan: boolean;
  user_id: number;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  shop_slug: string | null;
  custom_shop_slug: string | null;
  purchased_at: Date | null;
  ad_id: number | null;
  ad_title: string | null;
  ad_deleted: boolean;
  promotion_type: string | null;
  duration_days: number | null;
  price: unknown;
  starts_at: Date | null;
  expires_at: Date | null;
  is_active: boolean | null;
}

type PromotionStatus = 'active' | 'ended' | 'expired' | 'unknown';

/**
 * Extending a running promotion flips the OLD row to is_active=false while its
 * expires_at is still in the future, so "not expired" alone does not mean live.
 */
function promotionStatus(row: PromotionRow, now: number): PromotionStatus {
  if (row.orphan || !row.expires_at) return 'unknown';
  if (row.expires_at.getTime() <= now) return 'expired';
  return row.is_active === true ? 'active' : 'ended';
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

    // ad_promotions.payment_reference links to the transaction by EITHER its numeric
    // id as text (payment.service / payments/callback — all 51 online rows on prod)
    // or its gateway transaction_id (promotion.routes apply-after-paying path,
    // promotion.service, mock success). promotion.routes' own consumed-check accepts
    // both, so the orphan test must too or a promote-endpoint purchase double-counts.
    //
    // payment_transactions.metadata is written with JSON.stringify() into a Json
    // column, so on prod every row is a jsonb STRING scalar holding the object
    // (->> on it yields NULL). Mock/dev rows are plain objects. Normalise both;
    // a string that does not even look like an object is treated as empty rather
    // than letting the cast throw and 500 the whole tab.
    // Metadata keys, as written by payment.service.ts / payments/callback:
    //   promotionType, durationDays, adId, orderName. There is no ad-title key;
    //   the title is recoverable from orderName, which the clients build as
    //   web:    "Promote Ad: <title>"
    //   mobile: "<Featured|Urgent|Sticky> Promotion - <title>"
    const unioned = Prisma.sql`
      SELECT 'promo-' || p.id AS id_key,
             FALSE AS orphan,
             p.user_id,
             u.full_name, u.phone, u.email, u.shop_slug, u.custom_shop_slug,
             p.created_at AS purchased_at,
             p.ad_id,
             a.title AS ad_title,
             (a.id IS NULL) AS ad_deleted,
             p.promotion_type,
             p.duration_days,
             p.price_paid AS price,
             p.starts_at, p.expires_at, p.is_active
      FROM ad_promotions p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN ads a ON a.id = p.ad_id
      UNION ALL
      SELECT 'txn-' || t.id,
             TRUE,
             t.user_id,
             u.full_name, u.phone, u.email, u.shop_slug, u.custom_shop_slug,
             COALESCE(t.verified_at, t.created_at),
             t.related_id,
             COALESCE(
               a.title,
               substring(m.meta ->> 'orderName' FROM '^Promote Ad: (.+)$'),
               substring(m.meta ->> 'orderName' FROM '^[A-Za-z ]+ Promotion - (.+)$')
             ),
             (a.id IS NULL),
             m.meta ->> 'promotionType',
             CASE WHEN m.meta ->> 'durationDays' ~ '^[0-9]+$'
                  THEN (m.meta ->> 'durationDays')::int END,
             t.amount,
             NULL::timestamp, NULL::timestamp, NULL::boolean
      FROM payment_transactions t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN ads a ON a.id = t.related_id
      CROSS JOIN LATERAL (
        SELECT CASE jsonb_typeof(t.metadata)
                 WHEN 'string' THEN
                   CASE WHEN (t.metadata #>> '{}') ~ '^\\s*\\{' THEN (t.metadata #>> '{}')::jsonb
                        ELSE '{}'::jsonb END
                 WHEN 'object' THEN t.metadata
                 ELSE '{}'::jsonb
               END AS meta
      ) m
      WHERE t.status = 'verified'
        AND t.payment_type = 'ad_promotion'
        AND NOT EXISTS (
          SELECT 1 FROM ad_promotions p
          WHERE p.payment_reference IN (t.id::text, t.transaction_id)
        )
    `;

    const monthFilter = month
      ? (({ start, end }) => Prisma.sql`AND x.purchased_at >= ${start} AND x.purchased_at < ${end}`)(nptMonthRange(month))
      : Prisma.empty;

    const filters = Prisma.sql`
      WHERE x.user_id <> ALL(${excluded}::int[])
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
        FROM (${unioned}) x
        ${filters}
        ORDER BY x.purchased_at DESC NULLS LAST, x.id_key DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total
        FROM (${unioned}) x
        ${filters}
      `,
      // Month list for the filter dropdown + per-month totals (all rows, excluded users removed)
      prisma.$queryRaw<{ month: string; purchases: bigint; buyers: bigint; revenue: unknown }[]>`
        SELECT ${nptMonthSql('x.purchased_at')} AS month,
               COUNT(*) AS purchases,
               COUNT(DISTINCT x.user_id) AS buyers,
               COALESCE(SUM(x.price), 0) AS revenue
        FROM (${unioned}) x
        WHERE x.user_id <> ALL(${excluded}::int[])
          AND x.purchased_at IS NOT NULL
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
          const pricePaid = Number(r.price);
          return {
            id: r.id_key,
            userId: r.user_id,
            userName: r.full_name || 'Unknown',
            userPhone: r.phone || '',
            userEmail: r.email || '',
            shopSlug: r.custom_shop_slug || r.shop_slug || null,
            adId: r.ad_id,
            adTitle: r.ad_title || (r.ad_deleted ? '(ad deleted)' : `Ad #${r.ad_id}`),
            adDeleted: r.ad_deleted,
            type: r.promotion_type || 'unknown',
            durationDays: r.duration_days,
            pricePaid,
            // A staff-granted comp, not a sale. On prod price_paid = 0 exactly on the
            // hand-inserted payment_method='manual' rows, but no code path writes
            // 'manual', so the price is the robust signal.
            comped: pricePaid === 0,
            purchasedAt: r.purchased_at?.toISOString() ?? null,
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
