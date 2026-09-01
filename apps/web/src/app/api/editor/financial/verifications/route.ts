import { NextRequest, NextResponse } from 'next/server';
import { Prisma, prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { escapeLike } from '@/lib/financial/like';
import { MONTH_PATTERN, nptMonthSql } from '@/lib/financial/time';

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
 * Months are Nepal calendar months (see lib/financial/time).
 *
 * Query: ?month=YYYY-MM ?type=business|individual ?search= ?page= ?limit=
 */

const MAX_LIMIT = 100;

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
  badge_status: string;
  payment_amount: unknown;
  payment_status: string | null;
  duration_days: number | null;
  rn: bigint;
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
    //
    // badge_status classifies the CURRENT badge as 'approved' | 'expired' | 'revoked'
    // from the users.* columns, because the request tables never learn about
    // revocation. What the writers leave behind:
    //   live      business_verification_status IN ('approved','verified')
    //             ('verified' is a legacy value nothing writes but readers honour)
    //             / individual_verified = true
    //   expired   verificationCleanup.ts flips the flag ('expired' / false) but KEEPS
    //             the expiry, so the expiry is in the past
    //   revoked   admin/verification/revoke clears the flag AND sets the expiry NULL;
    //             the Express reject path clears the flag but LEAVES a future expiry
    // So: not live + expiry in the past => expired (time ran out); not live + expiry
    // NULL or still in the future => revoked (staff took it away before it ran out).
    // A NULL expiry falls through the `<=` test to the ELSE branch, which is what we
    // want. now() is a timestamptz; AT TIME ZONE 'UTC' makes it a naive UTC timestamp
    // comparable to the naive-UTC columns regardless of the session TimeZone.
    // Both request tables share a shape once aliased; UNION ALL then filter once.
    const unioned = Prisma.sql`
      SELECT 'business' AS kind, r.id AS request_id, r.user_id,
             u.full_name, u.phone, u.email, u.shop_slug, u.custom_shop_slug,
             r.business_name AS label,
             r.reviewed_at AS verified_at,
             u.business_verification_expires_at AS expires_at,
             CASE
               WHEN u.business_verification_status IN ('approved', 'verified') THEN 'approved'
               WHEN u.business_verification_expires_at <= (now() AT TIME ZONE 'UTC') THEN 'expired'
               ELSE 'revoked'
             END AS badge_status,
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
             CASE
               WHEN u.individual_verified THEN 'approved'
               WHEN u.individual_verification_expires_at <= (now() AT TIME ZONE 'UTC') THEN 'expired'
               ELSE 'revoked'
             END,
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

    // The month filter uses the same NPT bucket expression as the aggregate below,
    // so a row always lands in the month the dropdown says it does.
    const filters = Prisma.sql`
      WHERE v.user_id <> ALL(${excluded}::int[])
        AND (${type} = '' OR v.kind = ${type})
        AND (${month} = '' OR ${nptMonthSql('v.verified_at')} = ${month})
        AND (
          ${search} = ''
          OR v.full_name ILIKE ${pattern}
          OR v.phone ILIKE ${pattern}
          OR v.email ILIKE ${pattern}
          OR v.label ILIKE ${pattern}
        )
    `;

    const [rows, countRows, monthRows] = await Promise.all([
      prisma.$queryRaw<VerificationRow[]>`
        SELECT v.*
        FROM (${ranked}) v
        ${filters}
        ORDER BY v.verified_at DESC, v.kind, v.request_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      // Separate count so a page past the end still reports the true total.
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total
        FROM (${ranked}) v
        ${filters}
      `,
      prisma.$queryRaw<
        { month: string; business: bigint; individual: bigint; revenue: unknown }[]
      >`
        SELECT ${nptMonthSql('v.verified_at')} AS month,
               COUNT(*) FILTER (WHERE v.kind = 'business') AS business,
               COUNT(*) FILTER (WHERE v.kind = 'individual') AS individual,
               COALESCE(SUM(v.payment_amount) FILTER (WHERE v.payment_status = 'paid'), 0) AS revenue
        FROM (${unioned}) v
        WHERE v.user_id <> ALL(${excluded}::int[])
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
          // Only the newest grant of a kind describes the live badge.
          const newest = Number(r.rn) === 1;
          const revoked = newest && r.badge_status === 'revoked';
          return {
            id: `${r.kind}-${r.request_id}`,
            type: r.kind,
            userId: r.user_id,
            userName: r.full_name || 'Unknown',
            userPhone: r.phone || '',
            userEmail: r.email || '',
            shopSlug: r.custom_shop_slug || r.shop_slug || null,
            label: r.label || '',
            verifiedAt: r.verified_at?.toISOString() ?? null,
            superseded: !newest,
            revoked,
            // A revoked badge has no meaningful expiry (the revoke route nulls it;
            // a leftover future date from the reject path would read as "Active").
            expiresAt: newest && !revoked ? (r.expires_at?.toISOString() ?? null) : null,
            expired: newest && !revoked && !!r.expires_at && r.expires_at.getTime() <= now,
            amount: r.payment_amount === null ? 0 : Number(r.payment_amount),
            paymentStatus: r.payment_status || 'unknown',
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
