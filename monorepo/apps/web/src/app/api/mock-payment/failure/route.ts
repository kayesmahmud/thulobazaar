import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/mock-payment/failure
 * Handle failed mock payment callback
 * This endpoint receives callbacks from the mock payment gateway when payment fails
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txnId = searchParams.get('txnId');
    const reason = searchParams.get('reason');

    console.log('❌ Mock payment failure callback:', { txnId, reason });

    if (!txnId) {
      return NextResponse.redirect(
        `http://localhost:3333/en/dashboard?payment=failed&reason=${encodeURIComponent('Missing transaction ID')}`
      );
    }

    // Update payment transaction status to failed
    await prisma.payment_transactions.updateMany({
      where: { transaction_id: txnId },
      data: {
        status: 'failed',
        metadata: {
          ...(await prisma.payment_transactions
            .findFirst({
              where: { transaction_id: txnId },
              select: { metadata: true },
            })
            .then((p) => (p?.metadata as any) || {})),
          failureReason: reason || 'User cancelled payment',
        },
      },
    });

    console.log('✅ Payment marked as failed');

    // Redirect to dashboard with failure message
    const redirectUrl = `http://localhost:3333/en/dashboard?payment=failed&txnId=${txnId}&reason=${encodeURIComponent(reason || 'Payment cancelled')}`;

    console.log('✅ Redirecting to:', redirectUrl);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ Mock payment failure callback error:', error);

    // Redirect to dashboard with error
    return NextResponse.redirect(
      'http://localhost:3333/en/dashboard?payment=error'
    );
  }
}
