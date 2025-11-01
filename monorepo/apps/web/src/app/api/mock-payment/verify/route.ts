import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { mockPaymentService } from '@/lib/mockPaymentService';

/**
 * POST /api/mock-payment/verify
 * Verify payment status
 * Requires: Authentication
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const { transactionId, amount } = body;

    console.log('🔍 Verifying payment:', { transactionId, amount, userId });

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction ID is required',
        },
        { status: 400 }
      );
    }

    // Verify with mock service
    const verificationResult = await mockPaymentService.verifyPayment(
      transactionId,
      amount
    );

    // Check in database
    const dbPayment = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
      select: {
        status: true,
        amount: true,
        verified_at: true,
      },
    });

    if (!dbPayment) {
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
        success: verificationResult.success,
        transactionId,
        amount: parseFloat(dbPayment.amount.toString()),
        status: dbPayment.status,
        verifiedAt: dbPayment.verified_at,
        gateway: 'mock',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}
