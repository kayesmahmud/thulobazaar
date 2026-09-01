import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import {
  businessBadgeState,
  individualBadgeState,
  snapshotBadgeState,
  SUPERSEDED_BADGE,
} from '@/lib/financial/badge';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { escapeLike } from '@/lib/financial/like';
import { MONTH_PATTERN, nptMonthSql } from '@/lib/financial/time';

/**
 * GET /api/editor/financial/verifications
 * Every badge grant ever made (business + individual), newest first.
 *
 * Sourced from the purchase_history ledger (event='grant', kind='*_verification'):
 * one row per grant, written by DB triggers, so it survives the request rows and
 * even the user being deleted. Most grants were free (site_settings
 * .free_verification_enabled) — that is the norm here, not missing data.
 *
 * The ledger is the record; the live users row refines it when it still exists:
 * identity prefers the live name/phone/email/slug, and the NEWEST grant per
 * (user, kind) takes its expiry / revoked / expired state from users.* (see
 * lib/financial/badge). Older grants are SUPERSEDED and assert no state. When the
 * account is gone the grant-time snapshot is all there is.
 *
 * Months are Nepal calendar months (see lib/financial/time).
 *
 * Query: ?month=YYYY-MM ?type=business|individual ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;

interface GrantRow {
  id: number;
  kind: string;
  user_id: number;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  shop_slug: string | null;
  account_deleted: boolean;
  label: string | null;
  occurred_at: Date;
  snapshot_expires_at: Date | null;
  amount: unknown;
  payment_status: string;
  duration_days: number | null;
  business_verification_status: string | null;
  business_verification_expires_at: Date | null;
  individual_verified: boolean | null;
  individual_verification_expires_at: Date | null;
  rn: bigint;
}

const KIND_SUFFIX = '_verification';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const search = (searchParams.get('search') || '').trim();
    const month = (searchParams.get('month') || '').trim();
    const type = (searchParams.get('type') || '').trim();

    if (month && !MONTH_PATTERN.test(month)) {
      return NextResponse.json({ success: false, message: 'month must be YYYY-MM' }, { status: 400 });
    }
    if (type && type !== 'business' && type !== 'individual') {
      return NextResponse.json({ success: false, message: 'type must be business or individual' }, { status: 400 });
    }

    const excluded = await getExcludedUserIds();
    const pattern = `%${escapeLike(search)}%`;
    const offset = (page - 1) * limit;
    const kindFilter = type ? `${type}${KIND_SUFFIX}` : '';

    // rn is computed over the UNFILTERED grant set: if a month/type filter hid the
    // newest grant, ranking after filtering would wrongly promote an older one to
    // "current". Identity columns COALESCE live -> snapshot, which also covers a
    // deleted account (every u.* is NULL there).
    const ranked = Prisma.sql`
      SELECT h.id, h.kind, h.user_id,
             COALESCE(u.full_name, h.user_name) AS full_name,
             COALESCE(u.phone, h.user_phone) AS phone,
             COALESCE(u.email, h.user_email) AS email,
             COALESCE(u.custom_shop_slug, u.shop_slug, h.shop_slug) AS shop_slug,
             (u.id IS NULL) AS account_deleted,
             h.label, h.occurred_at, h.expires_at AS snapshot_expires_at,
             h.amount, h.payment_status, h.duration_days,
             u.business_verification_status, u.business_verification_expires_at,
             u.individual_verified, u.individual_verification_expires_at,
             ROW_NUMBER() OVER (
               PARTITION BY h.user_id, h.kind ORDER BY h.occurred_at DESC, h.id DESC
             ) AS rn
      FROM purchase_history h
      LEFT JOIN users u ON u.id = h.user_id
      WHERE h.event = 'grant'
        AND h.kind IN ('business_verification', 'individual_verification')
    `;

    // The month filter uses the same NPT bucket expression as the aggregate below,
    // so a row always lands in the month the dropdown says it does.
    const filters = Prisma.sql`
      WHERE v.user_id <> ALL(${excluded}::int[])
        AND (${kindFilter} = '' OR v.kind = ${kindFilter})
        AND (${month} = '' OR ${nptMonthSql('v.occurred_at')} = ${month})
        AND (
          ${search} = ''
          OR v.full_name ILIKE ${pattern}
          OR v.phone ILIKE ${pattern}
          OR v.email ILIKE ${pattern}
          OR v.label ILIKE ${pattern}
        )
    `;

    const [rows, countRows, monthRows] = await Promise.all([
      prisma.$queryRaw<GrantRow[]>`
        SELECT v.*
        FROM (${ranked}) v
        ${filters}
        ORDER BY v.occurred_at DESC, v.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      // Separate count so a page past the end still reports the true total.
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total
        FROM (${ranked}) v
        ${filters}
      `,
      // Revenue = money a VERIFIED transaction backs; 'unverified' rows only
      // claimed to be paid (client-writable field) and are not counted.
      prisma.$queryRaw<
        { month: string; business: bigint; individual: bigint; revenue: unknown }[]
      >`
        SELECT ${nptMonthSql('h.occurred_at')} AS month,
               COUNT(*) FILTER (WHERE h.kind = 'business_verification') AS business,
               COUNT(*) FILTER (WHERE h.kind = 'individual_verification') AS individual,
               COALESCE(SUM(h.amount) FILTER (WHERE h.payment_status = 'paid'), 0) AS revenue
        FROM purchase_history h
        WHERE h.event = 'grant'
          AND h.kind IN ('business_verification', 'individual_verification')
          AND h.user_id <> ALL(${excluded}::int[])
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
          const badgeType = r.kind.replace(KIND_SUFFIX, '') as 'business' | 'individual';
          const newest = Number(r.rn) === 1;
          const badge = !newest
            ? SUPERSEDED_BADGE
            : r.account_deleted
              ? snapshotBadgeState(r.snapshot_expires_at, now)
              : badgeType === 'business'
                ? businessBadgeState(r.business_verification_status, r.business_verification_expires_at, now)
                : individualBadgeState(r.individual_verified, r.individual_verification_expires_at, now);
          return {
            id: `h-${r.id}`,
            type: badgeType,
            userId: r.user_id,
            userName: r.full_name || 'Unknown',
            userPhone: r.phone || '',
            userEmail: r.email || '',
            shopSlug: r.shop_slug || null,
            accountDeleted: r.account_deleted,
            label: r.label || '',
            verifiedAt: r.occurred_at.toISOString(),
            superseded: !newest,
            ...badge,
            amount: Number(r.amount),
            paymentStatus: r.payment_status,
            durationDays: r.duration_days,
          };
        }),
        months: monthRows.map(m => ({
          month: m.month,
          business: Number(m.business),
          individual: Number(m.individual),
          revenue: Number(m.revenue),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Financial verifications error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch verifications' }, { status: 500 });
  }
}
