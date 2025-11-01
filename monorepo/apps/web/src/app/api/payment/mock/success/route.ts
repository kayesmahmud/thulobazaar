import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';

/**
 * GET /api/payment/mock/success
 * Mock payment success callback
 *
 * Query params:
 * - txnId: transaction ID
 * - amount: payment amount
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const txnId = searchParams.get('txnId');
    const amount = searchParams.get('amount');

    if (!txnId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Transaction ID is required',
        },
        { status: 400 }
      );
    }

    // Update payment status
    const payment = await prisma.payment_transactions.update({
      where: { transaction_id: txnId },
      data: {
        status: 'verified',
        verified_at: new Date(),
      },
      select: {
        id: true,
        user_id: true,
        payment_type: true,
        related_id: true,
        metadata: true,
      },
    });

    console.log(`✅ Mock payment verified: ${txnId}`);

    // If ad promotion, activate it
    if (payment.payment_type === 'ad_promotion' && payment.metadata) {
      const metadata = payment.metadata as any;
      const adId = metadata.adId;
      const promotionType = metadata.promotionType;
      const durationDays = metadata.durationDays;

      if (adId && promotionType && durationDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

        const updateData: any = {};
        if (promotionType === 'featured') {
          updateData.is_featured = true;
          updateData.featured_until = expiresAt;
        } else if (promotionType === 'urgent') {
          updateData.is_urgent = true;
          updateData.urgent_until = expiresAt;
        } else if (promotionType === 'sticky') {
          updateData.is_sticky = true;
          updateData.sticky_until = expiresAt;
        } else if (promotionType === 'bump_up') {
          updateData.is_bumped = true;
          updateData.bump_expires_at = expiresAt;
        }

        await prisma.ads.update({
          where: { id: parseInt(adId) },
          data: updateData,
        });

        await prisma.ad_promotions.create({
          data: {
            ad_id: parseInt(adId),
            user_id: payment.user_id,
            promotion_type: promotionType,
            duration_days: parseInt(durationDays),
            price_paid: parseFloat(amount || '0'),
            account_type: 'individual',
            payment_reference: txnId,
            payment_method: 'mock',
            expires_at: expiresAt,
          },
        });

        console.log(`✅ Ad ${adId} promoted with ${promotionType}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment successful!',
        transactionId: txnId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Mock payment success callback error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process payment',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
