import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth/jwt';

/**
 * GET /api/editor/financial/customers
 * Every customer who has ever paid, searchable and paginated.
 *
 * Replaces the "Top 10" ceiling on the stats endpoint — the owner needs the
 * full list to answer "who bought what", including customers whose purchase
 * has since expired.
 */

interface CustomerRow {
  id: number;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  purchases: bigint;
  total_spent: unknown;
  first_purchase: Date | null;
  last_purchase: Date | null;
  bought: string | null;
  active_promotions: bigint;
  total_count: bigint;
}

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25)
    );
    const search = (searchParams.get('search') || '').trim();
    const pattern = `%${search}%`;
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRaw<CustomerRow[]>`
      SELECT u.id,
             u.full_name,
             u.email,
             u.phone,
             COUNT(t.id) AS purchases,
             COALESCE(SUM(t.amount), 0) AS total_spent,
             MIN(t.created_at) AS first_purchase,
             MAX(t.created_at) AS last_purchase,
             string_agg(DISTINCT t.payment_type, ',') AS bought,
             (SELECT COUNT(*) FROM ad_promotions p
               WHERE p.user_id = u.id AND p.is_active = true AND p.expires_at > NOW()
             ) AS active_promotions,
             COUNT(*) OVER () AS total_count
      FROM payment_transactions t
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'verified'
        AND (
          ${search} = ''
          OR u.full_name ILIKE ${pattern}
          OR u.phone ILIKE ${pattern}
          OR u.email ILIKE ${pattern}
        )
      GROUP BY u.id, u.full_name, u.email, u.phone
      ORDER BY total_spent DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = rows.length > 0 ? Number(rows[0]!.total_count) : 0;

    const customers = rows.map(r => ({
      id: r.id,
      fullName: r.full_name || 'Unknown',
      email: r.email || '',
      phone: r.phone || '',
      purchases: Number(r.purchases),
      totalSpent: Number(r.total_spent),
      firstPurchase: r.first_purchase?.toISOString() ?? null,
      lastPurchase: r.last_purchase?.toISOString() ?? null,
      bought: r.bought ? r.bought.split(',') : [],
      activePromotions: Number(r.active_promotions),
    }));

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Financial customers error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch customers' }, { status: 500 });
  }
}
