import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { initiatePayment } from '@/lib/paymentGateways';
import type { PaymentGateway, PaymentType } from '@/lib/paymentGateways/types';

/**
 * POST /api/payments/initiate
 * Initiate a payment with Khalti or eSewa
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();
    const {
      gateway,
      amount,
      paymentType,
      relatedId,
      orderName,
      metadata,
    } = body as {
      gateway: PaymentGateway;
      amount: number;
      paymentType: PaymentType;
      relatedId?: number;
      orderName?: string;
      metadata?: Record<string, unknown>;
    };

    // Validate required fields
    if (!gateway || !['khalti', 'esewa'].includes(gateway)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment gateway. Use "khalti" or "esewa"' },
        { status: 400 }
      );
    }

    if (!amount || amount < 10) {
      return NextResponse.json(
        { success: false, message: 'Minimum amount is NPR 10' },
        { status: 400 }
      );
    }

    if (!paymentType || !['ad_promotion', 'individual_verification', 'business_verification'].includes(paymentType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment type' },
        { status: 400 }
      );
    }

    // Generate unique order ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const orderId = `TB_${paymentType.toUpperCase().slice(0, 3)}_${timestamp}_${random}`;

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333';

    // Build return URL based on payment type
    let returnUrl = `${baseUrl}/api/payments/callback`;
    returnUrl += `?gateway=${gateway}&orderId=${orderId}&paymentType=${paymentType}`;
    if (relatedId) {
      returnUrl += `&relatedId=${relatedId}`;
    }

    // Get user info for payment
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { full_name: true, email: true, phone: true },
    });

    // Create payment transaction record
    const transaction = await prisma.payment_transactions.create({
      data: {
        user_id: userId,
        payment_type: paymentType,
        payment_gateway: gateway,
        amount: amount,
        transaction_id: orderId,
        related_id: relatedId || null,
        status: 'pending',
        metadata: JSON.stringify({
          ...metadata,
          orderName: orderName || `ThulobBazaar ${paymentType.replace('_', ' ')}`,
          initiatedAt: new Date().toISOString(),
        }),
      },
    });

    // Initiate payment with gateway
    const result = await initiatePayment({
      gateway,
      amount,
      paymentType,
      orderId,
      orderName: orderName || `ThulobBazaar ${paymentType.replace('_', ' ')}`,
      userId,
      returnUrl,
      metadata: {
        ...metadata,
        userName: user?.full_name || 'Customer',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        transactionDbId: transaction.id,
      },
    });

    if (!result.success) {
      // Update transaction as failed
      await prisma.payment_transactions.update({
        where: { id: transaction.id },
        data: {
          status: 'failed',
          failure_reason: result.error,
        },
      });

      return NextResponse.json(
        { success: false, message: result.error || 'Payment initiation failed' },
        { status: 400 }
      );
    }

    // Update transaction with gateway response
    await prisma.payment_transactions.update({
      where: { id: transaction.id },
      data: {
        payment_url: result.paymentUrl,
        metadata: JSON.stringify({
          ...JSON.parse(transaction.metadata as string || '{}'),
          pidx: result.pidx,
          expiresAt: result.expiresAt,
        }),
      },
    });

    console.log(`✅ Payment initiated: ${orderId} via ${gateway}, amount: NPR ${amount}`);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: orderId,
        paymentUrl: result.paymentUrl,
        gateway,
        amount,
        pidx: result.pidx,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error: unknown) {
    console.error('Payment initiation error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return actual error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Payment initiation failed with:', errorMessage);

    return NextResponse.json(
      { success: false, message: `Failed to initiate payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
