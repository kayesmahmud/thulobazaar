import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { activatePromotion } from '@/lib/promotionService';

/**
 * GET /api/mock-payment/success
 * Handle successful mock payment callback
 * This endpoint receives callbacks from the mock payment gateway
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const txnId = searchParams.get('txnId');
    const amount = searchParams.get('amount');

    console.log('✅ Mock payment success callback:', { txnId, amount });

    if (!txnId) {
      return NextResponse.redirect(
        `http://localhost:3333/en/dashboard?payment=failed&reason=${encodeURIComponent('Missing transaction ID')}`
      );
    }

    // Update payment transaction status to verified
    const payment = await prisma.payment_transactions.findFirst({
      where: { transaction_id: txnId },
      select: {
        id: true,
        user_id: true,
        payment_type: true,
        related_id: true,
        metadata: true,
        status: true,
      },
    });

    if (!payment) {
      console.error('❌ Payment transaction not found:', txnId);
      return NextResponse.redirect(
        `http://localhost:3333/en/dashboard?payment=failed&reason=${encodeURIComponent('Transaction not found')}`
      );
    }

    // Update status to verified
    await prisma.payment_transactions.update({
      where: { id: payment.id },
      data: {
        status: 'verified',
        verified_at: new Date(),
      },
    });

    console.log('✅ Payment verified and updated:', payment);

    // If it's an ad promotion payment, activate the promotion
    if (payment.payment_type === 'ad_promotion' && payment.metadata) {
      const metadata = payment.metadata as any;

      console.log('🚀 Activating ad promotion:', metadata);

      try {
        await activatePromotion(
          metadata.adId,
          payment.user_id,
          metadata.promotionType,
          metadata.durationDays,
          parseFloat(amount || '0'),
          txnId
        );

        console.log('✅ Promotion activated successfully');
      } catch (error: any) {
        console.error('❌ Promotion activation error:', error);
        // Don't fail the payment, just log the error
      }
    }

    // Get ad slug for redirect
    const adId = (payment.metadata as any)?.adId || payment.related_id;
    let redirectUrl = `http://localhost:3333/en/dashboard?payment=success&txnId=${txnId}`;

    if (adId) {
      const ad = await prisma.ads.findUnique({
        where: { id: adId },
        select: { slug: true },
      });

      if (ad?.slug) {
        redirectUrl = `http://localhost:3333/en/ad/${ad.slug}?promoted=true&txnId=${txnId}`;
      }
    }

    console.log('✅ Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ Mock payment success callback error:', error);
    return NextResponse.redirect(
      `http://localhost:3333/en/dashboard?payment=error&reason=${encodeURIComponent(error.message || 'Unknown error')}`
    );
  }
}
