import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * POST /api/payment/mock/verify
 * Verify mock payment status
 * Requires: Authentication
 *
 * Body:
 * - transactionId: string (required)
 * - amount: number (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { transactionId, amount } = body;

    if (!transactionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction ID is required',
        },
        { status: 400 }
      );
    }

    console.log(`🔍 Verifying payment: ${transactionId} for user ${userId}`);

    // Check payment in database
    const payment = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
      select: {
        id: true,
        status: true,
        amount: true,
        verified_at: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment transaction not found',
        },
        { status: 404 }
      );
    }

    // For mock payment, verification always succeeds if payment exists
    const isVerified = payment.status === 'verified';

    return NextResponse.json(
      {
        success: isVerified,
        transactionId,
        amount: parseFloat(payment.amount.toString()),
        status: payment.status,
        verifiedAt: payment.verified_at,
        gateway: 'mock',
        message: isVerified ? 'Payment verified successfully' : 'Payment not verified',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to verify payment',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
