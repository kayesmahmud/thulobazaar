import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

/**
 * GET /api/editor/financial/stats
 * Get financial statistics for super admin dashboard
 * Requires: Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate - require super admin
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Calculate date range
    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date();
          break;
        case 'yesterday':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'thisweek':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          break;
        case 'thismonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
          break;
        case '7days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '90days':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'all':
          startDate = new Date('2020-01-01');
          break;
        case '30days':
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
      }
    }

    // Get all transactions in date range
    const transactions = await prisma.payment_transactions.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Calculate summary
    const verifiedTransactions = transactions.filter(t => t.status === 'verified');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const failedTransactions = transactions.filter(t => t.status === 'failed');

    const totalRevenue = verifiedTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const pendingAmount = pendingTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const failedAmount = failedTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Revenue by gateway
    const gatewayMap = new Map<string, { revenue: number; transactions: number }>();
    for (const t of verifiedTransactions) {
      const current = gatewayMap.get(t.payment_gateway) || { revenue: 0, transactions: 0 };
      current.revenue += Number(t.amount);
      current.transactions += 1;
      gatewayMap.set(t.payment_gateway, current);
    }
    const revenueByGateway = Array.from(gatewayMap.entries()).map(([gateway, data]) => ({
      gateway,
      revenue: data.revenue,
      transactions: data.transactions,
    }));

    // Revenue by type
    const typeMap = new Map<string, { revenue: number; transactions: number }>();
    for (const t of verifiedTransactions) {
      const current = typeMap.get(t.payment_type) || { revenue: 0, transactions: 0 };
      current.revenue += Number(t.amount);
      current.transactions += 1;
      typeMap.set(t.payment_type, current);
    }
    const revenueByType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      revenue: data.revenue,
      transactions: data.transactions,
    }));

    // Promotion stats (from ad_promotions)
    const promotions = await prisma.ad_promotions.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const promotionMap = new Map<string, { total: number; revenue: number; active: number }>();
    const now = new Date();
    for (const p of promotions) {
      const current = promotionMap.get(p.promotion_type) || { total: 0, revenue: 0, active: 0 };
      current.total += 1;
      current.revenue += Number(p.price_paid || 0);
      if (p.expires_at && new Date(p.expires_at) > now) {
        current.active += 1;
      }
      promotionMap.set(p.promotion_type, current);
    }
    const promotionStats = Array.from(promotionMap.entries()).map(([type, data]) => ({
      promotionType: type,
      totalPromotions: data.total,
      totalRevenue: data.revenue,
      activePromotions: data.active,
    }));

    // Daily revenue (last 30 days)
    const dailyMap = new Map<string, { revenue: number; transactions: number }>();
    for (const t of verifiedTransactions) {
      if (!t.created_at) continue;
      const dateKey = t.created_at.toISOString().split('T')[0] ?? '';
      if (!dateKey) continue;
      const current = dailyMap.get(dateKey) || { revenue: 0, transactions: 0 };
      current.revenue += Number(t.amount);
      current.transactions += 1;
      dailyMap.set(dateKey, current);
    }
    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        transactions: data.transactions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Top customers
    const customerMap = new Map<number, { user: any; totalSpent: number; transactions: number }>();
    for (const t of verifiedTransactions) {
      if (!t.users) continue;
      const current = customerMap.get(t.user_id) || {
        user: t.users,
        totalSpent: 0,
        transactions: 0,
      };
      current.totalSpent += Number(t.amount);
      current.transactions += 1;
      customerMap.set(t.user_id, current);
    }
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        id: c.user.id,
        fullName: c.user.full_name,
        email: c.user.email || '',
        totalSpent: c.totalSpent,
        transactions: c.transactions,
      }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTransactions: verifiedTransactions.length,
          failedTransactions: {
            count: failedTransactions.length,
            amount: failedAmount,
          },
          pendingTransactions: {
            count: pendingTransactions.length,
            amount: pendingAmount,
          },
        },
        revenueByGateway,
        revenueByType,
        promotionStats,
        dailyRevenue,
        topCustomers,
      },
    });
  } catch (error: any) {
    console.error('Financial stats error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch financial stats', error: error.message },
      { status: 500 }
    );
  }
}
