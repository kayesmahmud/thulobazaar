import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { verifyPayment, decodeEsewaCallback } from '@/lib/paymentGateways';
import type { PaymentGateway, PaymentType } from '@/lib/paymentGateways/types';

/**
 * GET /api/payments/callback
 * Handle payment gateway callbacks (redirects from Khalti/eSewa)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Get common params
  const gateway = searchParams.get('gateway') as PaymentGateway;
  const orderId = searchParams.get('orderId');
  const paymentType = searchParams.get('paymentType') as PaymentType;
  const relatedId = searchParams.get('relatedId');

  // Get gateway-specific params
  // Khalti params
  const pidx = searchParams.get('pidx');
  const khaltiStatus = searchParams.get('status');
  const khaltiTxnId = searchParams.get('transaction_id');
  // NOTE: the callback's `amount` query param is intentionally ignored (🔒 PAY-1) —
  // amounts are taken from the stored transaction and the gateway lookup response.

  // eSewa params (base64 encoded data)
  const esewaData = searchParams.get('data');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';

  try {
    if (!orderId) {
      console.error('Payment callback: Missing orderId');
      return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=missing_order`);
    }

    // Find transaction
    const transaction = await prisma.payment_transactions.findFirst({
      where: { transaction_id: orderId },
      select: {
        id: true,
        user_id: true,
        payment_type: true,
        amount: true,
        metadata: true,
        transaction_id: true,
        related_id: true, // 🔒 PAY-1: success actions bind to the STORED target, not query params
        status: true,
      },
    });

    if (!transaction) {
      console.error(`Payment callback: Transaction not found: ${orderId}`);
      return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=transaction_not_found`);
    }

    // 🔒 Idempotency: a replayed callback for an already-verified transaction must
    // not re-run the success handlers (e.g. re-create a promotion).
    if (transaction.status === 'verified') {
      return NextResponse.redirect(
        `${baseUrl}/en/payment/success?orderId=${orderId}&gateway=${gateway}&type=${transaction.payment_type}`
      );
    }

    const storedAmount = transaction.amount ? parseFloat(transaction.amount.toString()) : 0;
    const storedMetadata = JSON.parse((transaction.metadata as string) || '{}');

    let verifyResult;
    let parsedEsewaData: Record<string, unknown> | null = null;

    // Handle based on gateway
    if (gateway === 'khalti') {
      // Check Khalti status from callback
      if (khaltiStatus === 'User canceled') {
        await prisma.payment_transactions.update({
          where: { id: transaction.id },
          data: { status: 'canceled', failure_reason: 'User canceled payment' },
        });
        return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=canceled&orderId=${orderId}`);
      }

      // Verify with Khalti lookup API.
      // 🔒 PAY-1: prefer the pidx stored at initiation over the callback's, so the
      // callback can't substitute the pidx of a different (cheaper) payment; the
      // client-reported `amount` query param is never used.
      verifyResult = await verifyPayment({
        gateway: 'khalti',
        transactionId: orderId,
        pidx: (storedMetadata.pidx as string) || pidx || undefined,
        amount: storedAmount,
      });
    } else if (gateway === 'esewa') {
      // 🔒 PAY-1: the base64 callback payload is CLIENT-CONTROLLED and unsigned in
      // practice — a forged {"status":"COMPLETE"} must never mark a transaction
      // paid. Decode for logging only; ALWAYS confirm via eSewa's server-to-server
      // status-check API, queried with OUR stored orderId + amount.
      if (esewaData) {
        parsedEsewaData = decodeEsewaCallback(esewaData);
      }

      verifyResult = await verifyPayment({
        gateway: 'esewa',
        transactionId: orderId,
        amount: storedAmount,
      });
    } else {
      console.error(`Payment callback: Unknown gateway: ${gateway}`);
      return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=invalid_gateway`);
    }

    // 🔒 PAY-4: reconcile the amount the GATEWAY says was paid against the amount
    // stored at initiation (fail closed on missing/mismatched amounts).
    if (verifyResult.success && verifyResult.status === 'completed') {
      const gatewayAmount = Number(verifyResult.amount);
      if (!Number.isFinite(gatewayAmount) || Math.abs(gatewayAmount - storedAmount) > 1) {
        console.error(
          `🚫 Payment amount mismatch on ${orderId}: gateway says NPR ${verifyResult.amount}, expected NPR ${storedAmount}`
        );
        await prisma.payment_transactions.update({
          where: { id: transaction.id },
          data: {
            status: 'failed',
            failure_reason: `Amount mismatch: gateway reported ${verifyResult.amount}, expected ${storedAmount}`,
          },
        });
        return NextResponse.redirect(
          `${baseUrl}/en/payment/failure?orderId=${orderId}&status=failed&error=amount_mismatch`
        );
      }
    }

    // Update transaction based on verification result
    if (verifyResult.success && verifyResult.status === 'completed') {
      await prisma.payment_transactions.update({
        where: { id: transaction.id },
        data: {
          status: 'verified',
          verified_at: new Date(),
          reference_id: verifyResult.gatewayTransactionId || null,
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata as string || '{}'),
            verifiedAt: new Date().toISOString(),
            gatewayResponse: verifyResult,
            khaltiTxnId,
            esewaData: parsedEsewaData,
          }),
        },
      });

      console.log(`✅ Payment verified: ${orderId} via ${gateway}`);

      // 🔒 PAY-1: activate what was PAID FOR (stored payment_type/related_id),
      // never what the callback query string claims.
      await handlePaymentSuccess(transaction, transaction.payment_type as PaymentType, transaction.related_id);

      // Redirect to success page
      return NextResponse.redirect(
        `${baseUrl}/en/payment/success?orderId=${orderId}&gateway=${gateway}&type=${paymentType}${relatedId ? `&relatedId=${relatedId}` : ''}`
      );
    } else {
      // Payment not successful
      await prisma.payment_transactions.update({
        where: { id: transaction.id },
        data: {
          status: verifyResult.status === 'pending' ? 'pending' : 'failed',
          failure_reason: verifyResult.error || `Payment ${verifyResult.status}`,
        },
      });

      console.log(`❌ Payment failed/pending: ${orderId}, status: ${verifyResult.status}`);

      return NextResponse.redirect(
        `${baseUrl}/en/payment/failure?orderId=${orderId}&status=${verifyResult.status}&error=${encodeURIComponent(verifyResult.error || '')}`
      );
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=internal_error`);
  }
}

/**
 * Handle successful payment actions based on payment type
 */
async function handlePaymentSuccess(
  transaction: { id: number; user_id: number; payment_type: string; amount: unknown; metadata: unknown; transaction_id: string | null },
  paymentType: PaymentType,
  relatedId: number | null
) {
  try {
    const metadata = JSON.parse(transaction.metadata as string || '{}');

    switch (paymentType) {
      case 'ad_promotion': {
        if (!relatedId) {
          console.error('Ad promotion payment missing relatedId (adId)');
          return;
        }

        const { promotionType, durationDays } = metadata;
        if (!promotionType || !durationDays) {
          console.error('Ad promotion payment missing metadata');
          return;
        }

        // Calculate expiry date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays, 10));

        // Get user account type for pricing record
        const user = await prisma.users.findUnique({
          where: { id: transaction.user_id },
          select: { account_type: true, business_verification_status: true, individual_verified: true },
        });

        let accountType = 'individual';
        if (user?.business_verification_status === 'approved') {
          accountType = 'business';
        } else if (user?.individual_verified) {
          accountType = 'individual_verified';
        }

        // Deactivate existing promotions
        await prisma.ad_promotions.updateMany({
          where: { ad_id: relatedId, is_active: true },
          data: { is_active: false },
        });

        // Create promotion record
        await prisma.ad_promotions.create({
          data: {
            ad_id: relatedId,
            user_id: transaction.user_id,
            promotion_type: promotionType,
            duration_days: parseInt(durationDays, 10),
            price_paid: transaction.amount as number,
            account_type: accountType,
            payment_reference: transaction.id.toString(),
            payment_method: 'online',
            starts_at: new Date(),
            expires_at: expiresAt,
            is_active: true,
          },
        });

        // Update ad with promotion flags
        const updateData: Record<string, unknown> = {
          promoted_at: new Date(),
        };

        if (promotionType === 'featured') {
          updateData.is_featured = true;
          updateData.featured_until = expiresAt;
        } else if (promotionType === 'urgent') {
          updateData.is_urgent = true;
          updateData.urgent_until = expiresAt;
        } else if (promotionType === 'sticky') {
          updateData.is_sticky = true;
          updateData.sticky_until = expiresAt;
        }

        await prisma.ads.update({
          where: { id: relatedId },
          data: updateData,
        });

        console.log(`✅ Ad ${relatedId} promoted as ${promotionType} until ${expiresAt.toISOString()}`);
        break;
      }

      case 'individual_verification': {
        // Update verification request status from 'pending_payment' to 'pending'
        if (!relatedId) {
          console.error('Individual verification payment missing relatedId (verificationRequestId)');
          return;
        }

        // Update the verification request
        await prisma.individual_verification_requests.update({
          where: { id: relatedId },
          data: {
            status: 'pending', // Now ready for review
            payment_status: 'paid',
            payment_amount: Number(transaction.amount),
            payment_reference: transaction.transaction_id || '',
          },
        });

        console.log(`✅ Individual verification ${relatedId} activated after payment for user ${transaction.user_id}`);
        break;
      }

      case 'business_verification': {
        // Update business verification request status from 'pending_payment' to 'pending'
        if (!relatedId) {
          console.error('Business verification payment missing relatedId (verificationRequestId)');
          return;
        }

        // Update the verification request
        await prisma.business_verification_requests.update({
          where: { id: relatedId },
          data: {
            status: 'pending', // Now ready for review
            payment_status: 'paid',
            payment_amount: Number(transaction.amount),
            payment_reference: transaction.transaction_id || '',
          },
        });

        console.log(`✅ Business verification ${relatedId} activated after payment for user ${transaction.user_id}`);
        break;
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
