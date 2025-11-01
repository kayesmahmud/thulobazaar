import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireAuth } from '@/lib/jwt';

/**
 * POST /api/payment/mock/initiate
 * Initiate mock payment (for testing only)
 *
 * Body:
 * - amount: number (required)
 * - paymentType: string (required) - 'ad_promotion' | 'individual_verification' | 'business_verification'
 * - relatedId: number (optional)
 * - metadata: object (optional) - { adId, promotionType, durationDays }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireAuth(request);

    const body = await request.json();
    const { amount, paymentType, relatedId, metadata } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid amount. Amount must be greater than 0.',
        },
        { status: 400 }
      );
    }

    if (!paymentType) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment type is required',
        },
        { status: 400 }
      );
    }

    // Generate mock transaction ID
    const transactionId = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate product name
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

    // Save to database
    const paymentTransaction = await prisma.payment_transactions.create({
      data: {
        user_id: userId,
        payment_type: paymentType,
        payment_gateway: 'mock',
        amount: amount,
        transaction_id: transactionId,
        reference_id: transactionId,
        related_id: relatedId || null,
        status: 'pending',
        metadata: metadata || {},
      },
    });

    // Generate mock payment URL
    const paymentUrl = `http://localhost:3333/api/payment/mock/success?txnId=${transactionId}&amount=${amount}`;

    console.log(`✅ Mock payment initiated: ${transactionId} for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        paymentTransactionId: paymentTransaction.id,
        transactionId,
        paymentUrl,
        amount: parseFloat(amount.toString()),
        productName,
        gateway: 'mock',
        message: '🎭 MOCK PAYMENT: Payment initiated. Visit paymentUrl to complete.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Mock payment initiation error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initiate payment',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
