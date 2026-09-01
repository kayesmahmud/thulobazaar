import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';

/**
 * GET /api/editor/financial/verifications
 * Every approved verification (business + individual), newest first.
 *
 * Sourced from the two *_verification_requests tables keyed on `reviewed_at`
 * — the moment the badge was actually granted. NOT from payment_transactions:
 * most verifications were granted free (site_settings.free_verification_enabled),
 * so a payments-only view would show ~4 people instead of ~64.
 *
 * One row per verification EVENT, so renewals show up as separate rows and a
 * user verified in two different months appears in both.
 *
 * Query: ?month=YYYY-MM ?type=business|individual ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

/** `%` and `_` are LIKE wildcards — a bare `_` would otherwise match every row. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, c => `\\${c}`);

interface VerificationRow {
  kind: string;
  request_id: number;
  user_id: number;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  shop_slug: string | null;
  custom_shop_slug: string | null;
  label: string | null;
  verified_at: Date | null;
  expires_at: Date | null;
  payment_amount: unknown;
  payment_status: string | null;
  duration_days: number | null;
  rn: bigint;
  total_count: bigint;
}

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
    const excludedArr = excluded.length > 0 ? excluded : [0];
    const pattern = `%${escapeLike(search)}%`;
    const offset = (page - 1) * limit;

    // Expiry truth, decided against production data:
    //   users.*_verification_expires_at is authoritative for the CURRENT badge — it
    //   reflects later manual extensions that `duration_days` never records (3 prod
    //   rows say duration_days=30 while the real badge runs +61/+62/+366 days).
    //   But it only describes the LATEST grant, so stamping it on an older grant
    //   would show a lapsed badge as "Active".
    // So: newest grant per (user, kind) uses the user column; older grants are
    // SUPERSEDED and assert no status at all. Deriving reviewed_at + duration_days
    // was rejected — it would show a false "Expired" on the extended badges above.
    // Both request tables share a shape once aliased; UNION ALL then filter once.
    const unioned = Prisma.sql`
      SELECT 'business' AS kind, r.id AS request_id, r.user_id,
             u.full_name, u.phone, u.email, u.shop_slug, u.custom_shop_slug,
             r.business_name AS label,
             r.reviewed_at AS verified_at,
             u.business_verification_expires_at AS expires_at,
             r.payment_amount, r.payment_status, r.duration_days
      FROM business_verification_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'approved' AND r.reviewed_at IS NOT NULL
      UNION ALL
      SELECT 'individual', r.id, r.user_id,
             u.full_name, u.phone, u.email, u.shop_slug, u.custom_shop_slug,
             r.full_name,
             r.reviewed_at,
             u.individual_verification_expires_at,
             r.payment_amount, r.payment_status, r.duration_days
      FROM individual_verification_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'approved' AND r.reviewed_at IS NOT NULL
    `;

    // rn is computed over the UNFILTERED set: if a month/type filter hid the newest
    // grant, ranking after filtering would wrongly promote an older one to "current".
    const ranked = Prisma.sql`
      SELECT x.*, ROW_NUMBER() OVER (
               PARTITION BY x.user_id, x.kind ORDER BY x.verified_at DESC
             ) AS rn
      FROM (${unioned}) x
    `;

    const filters = Prisma.sql`
      WHERE v.user_id <> ALL(${excludedArr}::int[])
        AND (${type} = '' OR v.kind = ${type})
        AND (${month} = '' OR to_char(v.verified_at, 'YYYY-MM') = ${month})
        AND (
          ${search} = ''
          OR v.full_name ILIKE ${pattern}
          OR v.phone ILIKE ${pattern}
          OR v.email ILIKE ${pattern}
          OR v.label ILIKE ${pattern}
        )
    `;

    const [rows, monthRows] = await Promise.all([
      prisma.$queryRaw<VerificationRow[]>`
        SELECT v.*, COUNT(*) OVER () AS total_count
        FROM (${ranked}) v
        ${filters}
        ORDER BY v.verified_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      prisma.$queryRaw<
        { month: string; business: bigint; individual: bigint; revenue: unknown }[]
      >`
        SELECT to_char(v.verified_at, 'YYYY-MM') AS month,
               COUNT(*) FILTER (WHERE v.kind = 'business') AS business,
               COUNT(*) FILTER (WHERE v.kind = 'individual') AS individual,
               COALESCE(SUM(v.payment_amount) FILTER (WHERE v.payment_status = 'paid'), 0) AS revenue
        FROM (${unioned}) v
        WHERE v.user_id <> ALL(${excludedArr}::int[])
        GROUP BY 1
        ORDER BY 1 DESC
      `,
    ]);

    const total = rows.length > 0 ? Number(rows[0]!.total_count) : 0;
    const now = Date.now();

    return NextResponse.json({
      success: true,
      data: {
        rows: rows.map(r => ({
          id: `${r.kind}-${r.request_id}`,
          type: r.kind,
          userId: r.user_id,
          userName: r.full_name || 'Unknown',
          userPhone: r.phone || '',
          userEmail: r.email || '',
          shopSlug: r.custom_shop_slug || r.shop_slug || null,
          label: r.label || '',
          verifiedAt: r.verified_at?.toISOString() ?? null,
          // Only the newest grant of a kind describes the live badge.
          superseded: Number(r.rn) > 1,
          expiresAt: Number(r.rn) > 1 ? null : (r.expires_at?.toISOString() ?? null),
          expired: Number(r.rn) === 1 && !!r.expires_at && r.expires_at.getTime() <= now,
          amount: r.payment_amount === null ? 0 : Number(r.payment_amount),
          paymentStatus: r.payment_status || 'unknown',
          durationDays: r.duration_days,
        })),
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
