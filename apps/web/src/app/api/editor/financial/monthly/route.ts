import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';
import { getExcludedUserIds } from '@/lib/financial/exclusions';
import { nptMonthSql } from '@/lib/financial/time';

/**
 * GET /api/editor/financial/monthly
 * Month-by-month purchase history, all time.
 *
 * Reads the append-only `purchase_history` ledger, payment events only: one per
 * payment_transactions row that reached status='verified', written by a DB
 * trigger and never cascaded away with the ad or the account. Pending rows are
 * abandoned checkouts and never enter the ledger, so nothing here overstates.
 * Grants (comped/unpaid promotions, free badges) are entitlements, not money,
 * and are deliberately left out.
 *
 * Months are Nepal calendar months (see lib/financial/time.ts) of occurred_at,
 * the confirmation instant — matching the Promotions/Verifications histories.
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
      SELECT ${nptMonthSql('h.occurred_at')} AS month,
             COUNT(*) FILTER (WHERE h.kind = 'ad_promotion') AS promotions,
             COUNT(*) FILTER (WHERE h.kind = 'business_verification') AS business_verifications,
             COUNT(*) FILTER (WHERE h.kind = 'individual_verification') AS individual_verifications,
             COUNT(DISTINCT h.user_id) AS buyers,
             COALESCE(SUM(h.amount), 0) AS revenue
      FROM purchase_history h
      WHERE h.event = 'payment'
        AND h.user_id <> ALL(${excluded}::int[])
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
