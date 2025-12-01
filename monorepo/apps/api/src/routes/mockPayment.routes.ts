/**
 * MOCK PAYMENT ROUTES - FOR TESTING ONLY
 * =======================================
 * API endpoints for simulating payment gateway
 * Replace with real eSewa/Khalti routes in production
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { catchAsync, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { mockPaymentService } from '../services/mockPayment.service.js';
import { promotionService } from '../services/promotion.service.js';

const router = Router();

/**
 * GET /api/mock-payment
 * Show available mock payment endpoints
 */
router.get(
  '/',
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: '🎭 MOCK PAYMENT GATEWAY - FOR TESTING ONLY',
      warning: '⚠️  This is a test payment system. Replace with real eSewa/Khalti in production.',
      endpoints: {
        initiate: {
          method: 'POST',
          path: '/api/mock-payment/initiate',
          auth: 'Required (JWT)',
          description: 'Initiate a new payment transaction',
          body: {
            amount: 'number (required)',
            paymentType: 'string (required) - ad_promotion, individual_verification, business_verification',
            relatedId: 'number (optional) - related entity ID',
            metadata: 'object (optional) - { adId, promotionType, durationDays }',
          },
        },
        success: {
          method: 'GET',
          path: '/api/mock-payment/success',
          auth: 'Not required',
          description: 'Simulate successful payment callback',
          query: {
            txnId: 'string (required) - transaction ID',
            amount: 'number (required) - payment amount',
          },
        },
        failure: {
          method: 'GET',
          path: '/api/mock-payment/failure',
          auth: 'Not required',
          description: 'Simulate failed payment callback',
          query: {
            txnId: 'string (required) - transaction ID',
            reason: 'string (optional) - failure reason',
          },
        },
        verify: {
          method: 'POST',
          path: '/api/mock-payment/verify',
          auth: 'Required (JWT)',
          description: 'Verify payment status',
          body: {
            transactionId: 'string (required)',
            amount: 'number (optional)',
          },
        },
        status: {
          method: 'GET',
          path: '/api/mock-payment/status/:transactionId',
          auth: 'Required (JWT)',
          description: 'Get payment transaction details',
        },
      },
    });
  }
);

/**
 * POST /api/mock-payment/initiate
 * Initiate a mock payment transaction
 */
router.post(
  '/initiate',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { amount, paymentType, relatedId, metadata } = req.body;
    const userId = req.user!.userId;

    console.log('📥 Mock payment initiate request:', {
      userId,
      amount,
      paymentType,
      relatedId,
      metadata,
    });

    // Validate required fields
    if (!amount || amount <= 0) {
      throw new ValidationError('Invalid amount. Amount must be greater than 0.');
    }

    if (!paymentType) {
      throw new ValidationError('Payment type is required');
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
    const transaction = await prisma.payment_transactions.create({
      data: {
        user_id: userId,
        payment_type: paymentType,
        payment_gateway: 'mock',
        amount: amount,
        transaction_id: paymentResult.transactionId,
        reference_id: paymentResult.transactionId,
        related_id: relatedId ? parseInt(relatedId) : null,
        status: 'pending',
        metadata: metadata || {},
      },
    });

    console.log('✅ Payment transaction created:', transaction.id);

    res.json({
      success: true,
      paymentTransactionId: transaction.id,
      transactionId: paymentResult.transactionId,
      paymentUrl: paymentResult.paymentUrl,
      amount: parseFloat(String(amount)),
      productName,
      gateway: 'mock',
      message: '🎭 MOCK PAYMENT: Payment initiated. Use /success or /failure endpoint to complete.',
    });
  })
);

/**
 * GET /api/mock-payment/success
 * Simulate successful payment callback
 */
router.get(
  '/success',
  catchAsync(async (req: Request, res: Response) => {
    const { txnId, amount } = req.query;

    console.log('✅ Mock payment success callback:', { txnId, amount });

    if (!txnId) {
      throw new ValidationError('Transaction ID is required');
    }

    // Verify payment with mock service
    const verificationResult = await mockPaymentService.verifyPayment(
      txnId as string,
      parseFloat(amount as string)
    );

    if (!verificationResult.success) {
      console.log('❌ Payment verification failed');
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        transactionId: txnId,
      });
    }

    // Update payment transaction status to verified
    const payment = await prisma.payment_transactions.findFirst({
      where: { transaction_id: txnId as string },
    });

    if (!payment) {
      throw new NotFoundError('Payment transaction not found');
    }

    await prisma.payment_transactions.update({
      where: { id: payment.id },
      data: {
        status: 'verified',
        verified_at: new Date(),
      },
    });

    console.log('✅ Payment verified and updated:', payment);

    // Handle ad promotion payment
    let activationResult = null;
    const metadata = payment.metadata as Record<string, any> | null;

    if (payment.payment_type === 'ad_promotion' && metadata) {
      console.log('🚀 Activating ad promotion:', metadata);

      try {
        activationResult = await promotionService.activatePromotion(
          metadata.adId,
          payment.user_id,
          metadata.promotionType,
          metadata.durationDays,
          parseFloat(String(amount)),
          txnId as string
        );

        console.log('✅ Promotion activated:', activationResult);
      } catch (error) {
        console.error('❌ Promotion activation error:', error);
        // Don't fail the payment, just log the error
      }
    }

    // Get ad slug for redirect
    const adId = metadata?.adId || payment.related_id;
    let adSlug: string | null = null;

    if (adId) {
      const ad = await prisma.ads.findUnique({
        where: { id: adId },
        select: { slug: true },
      });
      if (ad) {
        adSlug = ad.slug;
      }
    }

    // Redirect to the ad detail page on the new monorepo site
    const redirectUrl = adSlug
      ? `http://localhost:3333/en/ad/${adSlug}?promoted=true&txnId=${txnId}`
      : `http://localhost:3333/en/dashboard?promoted=true&txnId=${txnId}`;

    res.redirect(redirectUrl);
  })
);

/**
 * GET /api/mock-payment/failure
 * Simulate failed payment callback
 */
router.get(
  '/failure',
  catchAsync(async (req: Request, res: Response) => {
    const { txnId, reason } = req.query;

    console.log('❌ Mock payment failure callback:', { txnId, reason });

    if (!txnId) {
      throw new ValidationError('Transaction ID is required');
    }

    // Update payment transaction status to failed
    const payment = await prisma.payment_transactions.findFirst({
      where: { transaction_id: txnId as string },
    });

    if (payment) {
      const currentMetadata = (payment.metadata as Record<string, any>) || {};
      await prisma.payment_transactions.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          metadata: {
            ...currentMetadata,
            failureReason: reason || 'User cancelled payment',
          },
        },
      });
    }

    console.log('✅ Payment marked as failed');

    res.json({
      success: false,
      message: '❌ Payment failed',
      transactionId: txnId,
      reason: reason || 'User cancelled payment',
    });
  })
);

/**
 * POST /api/mock-payment/verify
 * Verify payment status
 */
router.post(
  '/verify',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { transactionId, amount } = req.body;
    const userId = req.user!.userId;

    console.log('🔍 Verifying payment:', { transactionId, amount, userId });

    if (!transactionId) {
      throw new ValidationError('Transaction ID is required');
    }

    // Verify with mock service
    const verificationResult = await mockPaymentService.verifyPayment(transactionId, amount);

    // Check in database
    const payment = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment transaction not found');
    }

    res.json({
      success: verificationResult.success,
      transactionId,
      amount: parseFloat(String(payment.amount)),
      status: payment.status,
      verifiedAt: payment.verified_at,
      gateway: 'mock',
    });
  })
);

/**
 * GET /api/mock-payment/status/:transactionId
 * Get payment transaction status
 */
router.get(
  '/status/:transactionId',
  authenticateToken,
  catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const userId = req.user!.userId;

    console.log('📊 Getting payment status:', { transactionId, userId });

    const payment = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment transaction not found');
    }

    res.json({
      success: true,
      payment: {
        id: payment.id,
        transactionId: payment.transaction_id,
        paymentType: payment.payment_type,
        amount: parseFloat(String(payment.amount)),
        status: payment.status,
        createdAt: payment.created_at,
        verifiedAt: payment.verified_at,
        metadata: payment.metadata,
      },
    });
  })
);

export default router;
