import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';

/**
 * GET /api/editor/financial/monthly
 * Month-by-month purchase history, all time.
 *
 * Revenue counts ONLY status='verified' transactions — `pending` rows are
 * abandoned checkouts (user opened the gateway and never paid), so summing
 * them would overstate revenue by an order of magnitude.
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

    // [0] fallback: Prisma cannot infer the element type of an empty array, and
    // no real user_id is 0.
    const excluded = await getExcludedUserIds();
    const excludedArr = excluded.length > 0 ? excluded : [0];

    const rows = await prisma.$queryRaw<MonthRow[]>`
      SELECT to_char(created_at, 'YYYY-MM') AS month,
             COUNT(*) FILTER (WHERE payment_type = 'ad_promotion') AS promotions,
             COUNT(*) FILTER (WHERE payment_type = 'business_verification') AS business_verifications,
             COUNT(*) FILTER (WHERE payment_type = 'individual_verification') AS individual_verifications,
             COUNT(DISTINCT user_id) AS buyers,
             COALESCE(SUM(amount), 0) AS revenue
      FROM payment_transactions
      WHERE status = 'verified'
        AND user_id <> ALL(${excludedArr}::int[])
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
