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
  const khaltiAmount = searchParams.get('amount');

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
    });

    if (!transaction) {
      console.error(`Payment callback: Transaction not found: ${orderId}`);
      return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=transaction_not_found`);
    }

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

      // Verify with Khalti lookup API
      verifyResult = await verifyPayment({
        gateway: 'khalti',
        transactionId: orderId,
        pidx: pidx || undefined,
        amount: khaltiAmount ? parseInt(khaltiAmount) / 100 : transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
      });
    } else if (gateway === 'esewa') {
      // Decode eSewa response
      if (esewaData) {
        parsedEsewaData = decodeEsewaCallback(esewaData);
      }

      if (parsedEsewaData?.status === 'COMPLETE') {
        verifyResult = {
          success: true,
          status: 'completed' as const,
          transactionId: orderId,
          amount: parseFloat(String(parsedEsewaData.total_amount)) || 0,
          gateway: 'esewa' as const,
          gatewayTransactionId: String(parsedEsewaData.transaction_code),
        };
      } else {
        // Verify with eSewa status API
        verifyResult = await verifyPayment({
          gateway: 'esewa',
          transactionId: orderId,
          amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
        });
      }
    } else {
      console.error(`Payment callback: Unknown gateway: ${gateway}`);
      return NextResponse.redirect(`${baseUrl}/en/payment/failure?error=invalid_gateway`);
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

      // Handle post-payment actions based on payment type
      await handlePaymentSuccess(transaction, paymentType, relatedId ? parseInt(relatedId) : null);

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
  transaction: { id: number; user_id: number; payment_type: string; amount: unknown; metadata: unknown },
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
        expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));

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
            duration_days: parseInt(durationDays),
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
        } else if (promotionType === 'sticky' || promotionType === 'bump_up') {
          updateData.is_sticky = true;
          updateData.sticky_until = expiresAt;
          updateData.is_bumped = true;
          updateData.bump_expires_at = expiresAt;
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
