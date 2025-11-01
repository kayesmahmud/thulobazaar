import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * GET /api/mock-payment/status/:transactionId
 * Get payment transaction status
 * Requires: Authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const userId = await requireAuth(request);
    const { transactionId } = await params;

    console.log('📊 Getting payment status:', { transactionId, userId });

    const payment = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
      select: {
        id: true,
        transaction_id: true,
        payment_type: true,
        amount: true,
        status: true,
        created_at: true,
        verified_at: true,
        metadata: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment transaction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        payment: {
          id: payment.id,
          transactionId: payment.transaction_id,
          paymentType: payment.payment_type,
          amount: parseFloat(payment.amount.toString()),
          status: payment.status,
          createdAt: payment.created_at,
          verifiedAt: payment.verified_at,
          metadata: payment.metadata,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Get payment status error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get payment status',
      },
      { status: 500 }
    );
  }
}
