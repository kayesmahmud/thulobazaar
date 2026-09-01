import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { nptMonthSql } from '@/lib/financial/time';

/**
 * GET /api/editor/financial/monthly
 * Month-by-month purchase history, all time.
 *
 * Revenue counts ONLY status='verified' transactions — `pending` rows are
 * abandoned checkouts (user opened the gateway and never paid), so summing
 * them would overstate revenue by an order of magnitude.
 *
 * Months are Nepal calendar months (see lib/financial/time.ts), matching the
 * month filters and displayed dates in the promotions/verifications views.
 * Months are bucketed by the confirmation instant, COALESCE(verified_at,
 * created_at), matching the Promotions history — not by checkout initiation.
 * The verifications view buckets on reviewed_at by design, so its months can
 * differ from the payment month.
 *
 * Test accounts are excluded, exactly as in the promotions/verifications views
 * this table links out to — otherwise the same month reads two different
 * revenue figures one click apart.
 */

interface MonthRow {
  month: string;
  promotions: bigint;
  business_verifications: bigint;
  individual_verifications: bigint;
  buyers: bigint;
  revenue: unknown;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const excluded = await getExcludedUserIds();

    const rows = await prisma.$queryRaw<MonthRow[]>`
      SELECT ${nptMonthSql('t.paid_at')} AS month,
             COUNT(*) FILTER (WHERE t.payment_type = 'ad_promotion') AS promotions,
             COUNT(*) FILTER (WHERE t.payment_type = 'business_verification') AS business_verifications,
             COUNT(*) FILTER (WHERE t.payment_type = 'individual_verification') AS individual_verifications,
             COUNT(DISTINCT t.user_id) AS buyers,
             COALESCE(SUM(t.amount), 0) AS revenue
      FROM (
        SELECT payment_type, user_id, amount,
               COALESCE(verified_at, created_at) AS paid_at
        FROM payment_transactions
        WHERE status = 'verified'
          AND user_id <> ALL(${excluded}::int[])
      ) t
      GROUP BY 1
      ORDER BY 1 DESC
    `;

    const months = rows.map(r => ({
      month: r.month,
      promotions: Number(r.promotions),
      businessVerifications: Number(r.business_verifications),
      individualVerifications: Number(r.individual_verifications),
      buyers: Number(r.buyers),
      revenue: Number(r.revenue),
    }));

    return NextResponse.json({
      success: true,
      data: {
        months,
        totals: {
          purchases: months.reduce(
            (sum, m) => sum + m.promotions + m.businessVerifications + m.individualVerifications,
            0
          ),
          revenue: months.reduce((sum, m) => sum + m.revenue, 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Financial monthly error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch monthly report' }, { status: 500 });
  }
}
