import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';
import { mockPaymentService } from '@/lib/mockPaymentService';

/**
 * POST /api/mock-payment/initiate
 * Initiate a mock payment transaction
 * Requires: Authentication
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const { amount, paymentType, relatedId, metadata } = body;

    console.log('📥 Mock payment initiate request:', {
      userId,
      amount,
      paymentType,
      relatedId,
      metadata,
    });

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount. Amount must be greater than 0.',
        },
        { status: 400 }
      );
    }

    if (!paymentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment type is required',
        },
        { status: 400 }
      );
    }

    // Generate product name based on payment type
    let productName = 'ThuLoBazaar Payment';
    if (metadata && metadata.promotionType) {
      productName = `Ad Promotion - ${metadata.promotionType}`;
      if (metadata.durationDays) {
        productName += ` (${metadata.durationDays} days)`;
      }
    } else if (paymentType === 'individual_verification') {
      productName = 'Individual Verification Fee';
    } else if (paymentType === 'business_verification') {
      productName = 'Business Verification Fee';
    }

    // Initiate mock payment
    const paymentResult = mockPaymentService.initiatePayment({
      amount,
      productName,
      userId,
      metadata,
    });

    // Save to payment_transactions table
    const payment = await prisma.payment_transactions.create({
      data: {
        user_id: userId,
        payment_type: paymentType,
        payment_gateway: 'mock',
        amount: amount,
        transaction_id: paymentResult.transactionId,
        reference_id: paymentResult.transactionId,
        related_id: relatedId || null,
        status: 'pending',
        metadata: metadata || {},
      },
      select: {
        id: true,
        transaction_id: true,
        created_at: true,
      },
    });

    console.log('✅ Payment transaction created:', payment);

    return NextResponse.json(
      {
        success: true,
        paymentTransactionId: payment.id,
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.paymentUrl,
        amount: parseFloat(amount.toString()),
        productName,
        gateway: 'mock',
        message:
          '🎭 MOCK PAYMENT: Payment initiated. Use /success or /failure endpoint to complete.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Mock payment initiation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initiate payment',
      },
      { status: 500 }
    );
  }
}
