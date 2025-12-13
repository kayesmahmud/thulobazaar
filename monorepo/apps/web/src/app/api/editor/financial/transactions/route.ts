import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireEditor } from '@/lib/auth';

/**
 * GET /api/editor/financial/transactions
 * Get paginated list of transactions
 * Requires: Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate - require super admin
    await requireEditor(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (gateway) where.payment_gateway = gateway;
    if (type) where.payment_type = type;

    // Get total count
    const total = await prisma.payment_transactions.count({ where });

    // Get transactions
    const transactions = await prisma.payment_transactions.findMany({
      where,
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
      skip,
      take: limit,
    });

    // Transform data
    const data = transactions.map(t => ({
      id: t.id,
      userId: t.user_id,
      userName: t.users?.full_name || 'Unknown',
      userEmail: t.users?.email || '',
      paymentType: t.payment_type,
      paymentGateway: t.payment_gateway,
      amount: Number(t.amount),
      transactionId: t.transaction_id,
      referenceId: t.reference_id,
      relatedId: t.related_id,
      status: t.status,
      metadata: t.metadata,
      createdAt: t.created_at?.toISOString(),
      verifiedAt: t.verified_at?.toISOString(),
      failureReason: t.failure_reason,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Financial transactions error:', error);

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
      { success: false, message: 'Failed to fetch transactions', error: error.message },
      { status: 500 }
    );
  }
}
