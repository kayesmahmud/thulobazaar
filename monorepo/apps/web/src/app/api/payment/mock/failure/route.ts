import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/payment/mock/failure
 * Mock payment failure callback
 *
 * Query params:
 * - txnId: transaction ID
 * - reason: failure reason (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txnId = searchParams.get('txnId');
    const reason = searchParams.get('reason') || 'User cancelled payment';

    if (!txnId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction ID is required',
        },
        { status: 400 }
      );
    }

    // Get existing payment to preserve metadata
    const existingPayment = await prisma.payment_transactions.findUnique({
      where: { transaction_id: txnId },
      select: { metadata: true },
    });

    // Update payment status to failed
    await prisma.payment_transactions.update({
      where: { transaction_id: txnId },
      data: {
        status: 'failed',
        metadata: {
          ...(existingPayment?.metadata && typeof existingPayment.metadata === 'object' ? existingPayment.metadata : {}),
          failureReason: reason,
        },
      },
    });

    console.log(`❌ Mock payment failed: ${txnId}. Reason: ${reason}`);

    return NextResponse.json(
      {
        success: false,
        message: '❌ Payment failed',
        transactionId: txnId,
        reason,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mock payment failure callback error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process payment failure',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
