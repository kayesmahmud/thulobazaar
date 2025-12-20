/**
 * Payment Routes
 * Handle payment initiation, callbacks, and verification for Khalti and eSewa
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@thulobazaar/database';
import { authenticateToken } from '../middleware/auth';
import {
  initiatePayment,
  verifyPayment,
  getAvailableGateways,
  decodeEsewaCallback,
} from '../lib/payment';
import type { PaymentGateway, PaymentType } from '../lib/payment/types';

const router = Router();

/**
 * GET /api/payments/gateways
 * Get available payment gateways
 */
router.get('/gateways', (_req: Request, res: Response) => {
  const gateways = getAvailableGateways();
  res.json({ success: true, data: gateways });
});

/**
 * POST /api/payments/initiate
 * Initiate a payment with Khalti or eSewa
 */
router.post('/initiate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const {
      gateway,
      amount,
      paymentType,
      relatedId,
      orderName,
      metadata,
      returnUrl: customReturnUrl,
    } = req.body as {
      gateway: PaymentGateway;
      amount: number;
      paymentType: PaymentType;
      relatedId?: number;
      orderName?: string;
      metadata?: Record<string, unknown>;
      returnUrl?: string;
    };

    // Validate required fields
    if (!gateway || !['khalti', 'esewa'].includes(gateway)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment gateway. Use "khalti" or "esewa"',
      });
    }

    if (!amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount is NPR 10',
      });
    }

    if (!paymentType || !['ad_promotion', 'individual_verification', 'business_verification'].includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type',
      });
    }

    // Generate unique order ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const orderId = `TB_${paymentType.toUpperCase().slice(0, 3)}_${timestamp}_${random}`;

    // Get base URL for callbacks
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';

    // Build return URL
    let returnUrl = customReturnUrl || `${baseUrl}/api/payments/callback`;
    if (!customReturnUrl) {
      returnUrl += `?gateway=${gateway}&orderId=${orderId}&paymentType=${paymentType}`;
      if (relatedId) {
        returnUrl += `&relatedId=${relatedId}`;
      }
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
          orderName: orderName || `ThuluBazaar ${paymentType.replace('_', ' ')}`,
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
      orderName: orderName || `ThuluBazaar ${paymentType.replace('_', ' ')}`,
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

      return res.status(400).json({
        success: false,
        message: result.error || 'Payment initiation failed',
      });
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

    res.json({
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
  } catch (error) {
    console.error('Payment initiation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: `Failed to initiate payment: ${errorMessage}`,
    });
  }
});

/**
 * GET /api/payments/callback
 * Handle payment gateway callbacks (redirects from Khalti/eSewa)
 */
router.get('/callback', async (req: Request, res: Response) => {
  // Get common params
  const gateway = req.query.gateway as PaymentGateway;
  const orderId = req.query.orderId as string;
  const paymentType = req.query.paymentType as PaymentType;
  const relatedId = req.query.relatedId as string | undefined;

  // Khalti params
  const pidx = req.query.pidx as string | undefined;
  const khaltiStatus = req.query.status as string | undefined;
  const khaltiTxnId = req.query.transaction_id as string | undefined;
  const khaltiAmount = req.query.amount as string | undefined;

  // eSewa params (base64 encoded data)
  const esewaData = req.query.data as string | undefined;

  // Redirect base URL (for mobile, use deep link; for web, use frontend URL)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3333';

  try {
    if (!orderId) {
      console.error('Payment callback: Missing orderId');
      return res.redirect(`${frontendUrl}/en/payment/failure?error=missing_order`);
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
      },
    });

    if (!transaction) {
      console.error(`Payment callback: Transaction not found: ${orderId}`);
      return res.redirect(`${frontendUrl}/en/payment/failure?error=transaction_not_found`);
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
        return res.redirect(`${frontendUrl}/en/payment/failure?error=canceled&orderId=${orderId}`);
      }

      // Verify with Khalti lookup API
      verifyResult = await verifyPayment({
        gateway: 'khalti',
        transactionId: orderId,
        pidx: pidx || undefined,
        amount: khaltiAmount ? parseInt(khaltiAmount, 10) / 100 : transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
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
      return res.redirect(`${frontendUrl}/en/payment/failure?error=invalid_gateway`);
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
      await handlePaymentSuccess(transaction, paymentType, relatedId ? parseInt(relatedId, 10) : null);

      // Redirect to success page
      return res.redirect(
        `${frontendUrl}/en/payment/success?orderId=${orderId}&gateway=${gateway}&type=${paymentType}${relatedId ? `&relatedId=${relatedId}` : ''}`
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

      return res.redirect(
        `${frontendUrl}/en/payment/failure?orderId=${orderId}&status=${verifyResult.status}&error=${encodeURIComponent(verifyResult.error || '')}`
      );
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    return res.redirect(`${frontendUrl}/en/payment/failure?error=internal_error`);
  }
});

/**
 * POST /api/payments/verify
 * Manually verify a payment (for mobile apps)
 */
router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId, pidx, esewaData } = req.body as {
      transactionId: string;
      pidx?: string;
      esewaData?: string;
    };

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required',
      });
    }

    // Find transaction
    const transaction = await prisma.payment_transactions.findFirst({
      where: { transaction_id: transactionId },
      select: {
        id: true,
        user_id: true,
        payment_type: true,
        payment_gateway: true,
        amount: true,
        metadata: true,
        transaction_id: true,
        related_id: true,
        status: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Already verified
    if (transaction.status === 'verified') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        data: { status: 'verified', transactionId },
      });
    }

    const gateway = transaction.payment_gateway as PaymentGateway;
    let verifyResult;
    let parsedEsewaData: Record<string, unknown> | null = null;

    if (gateway === 'khalti') {
      // Get pidx from request or metadata
      const transactionPidx = pidx || JSON.parse(transaction.metadata as string || '{}').pidx;

      verifyResult = await verifyPayment({
        gateway: 'khalti',
        transactionId,
        pidx: transactionPidx,
        amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
      });
    } else if (gateway === 'esewa') {
      if (esewaData) {
        parsedEsewaData = decodeEsewaCallback(esewaData);
      }

      if (parsedEsewaData?.status === 'COMPLETE') {
        verifyResult = {
          success: true,
          status: 'completed' as const,
          transactionId,
          amount: parseFloat(String(parsedEsewaData.total_amount)) || 0,
          gateway: 'esewa' as const,
          gatewayTransactionId: String(parsedEsewaData.transaction_code),
        };
      } else {
        verifyResult = await verifyPayment({
          gateway: 'esewa',
          transactionId,
          amount: transaction.amount ? parseFloat(transaction.amount.toString()) : 0,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Unknown gateway: ${gateway}`,
      });
    }

    // Update transaction based on result
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
          }),
        },
      });

      // Handle post-payment actions
      await handlePaymentSuccess(
        transaction,
        transaction.payment_type as PaymentType,
        transaction.related_id
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          status: 'verified',
          transactionId,
          amount: verifyResult.amount,
          gateway,
        },
      });
    } else {
      await prisma.payment_transactions.update({
        where: { id: transaction.id },
        data: {
          status: verifyResult.status === 'pending' ? 'pending' : 'failed',
          failure_reason: verifyResult.error || `Payment ${verifyResult.status}`,
        },
      });

      res.json({
        success: false,
        message: verifyResult.error || `Payment ${verifyResult.status}`,
        data: { status: verifyResult.status, transactionId },
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
    });
  }
});

/**
 * GET /api/payments/status/:transactionId
 * Get payment status
 */
router.get('/status/:transactionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user!.userId;

    const transaction = await prisma.payment_transactions.findFirst({
      where: {
        transaction_id: transactionId,
        user_id: userId,
      },
      select: {
        id: true,
        transaction_id: true,
        payment_type: true,
        payment_gateway: true,
        amount: true,
        status: true,
        payment_url: true,
        reference_id: true,
        created_at: true,
        verified_at: true,
        failure_reason: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.transaction_id,
        paymentType: transaction.payment_type,
        gateway: transaction.payment_gateway,
        amount: transaction.amount,
        status: transaction.status,
        paymentUrl: transaction.payment_url,
        referenceId: transaction.reference_id,
        createdAt: transaction.created_at,
        verifiedAt: transaction.verified_at,
        failureReason: transaction.failure_reason,
      },
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
    });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '10', status, type } = req.query as {
      page?: string;
      limit?: string;
      status?: string;
      type?: string;
    };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { user_id: userId };
    if (status) where.status = status;
    if (type) where.payment_type = type;

    const [transactions, total] = await Promise.all([
      prisma.payment_transactions.findMany({
        where,
        select: {
          id: true,
          transaction_id: true,
          payment_type: true,
          payment_gateway: true,
          amount: true,
          status: true,
          reference_id: true,
          created_at: true,
          verified_at: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.payment_transactions.count({ where }),
    ]);

    res.json({
      success: true,
      data: transactions.map(t => ({
        transactionId: t.transaction_id,
        paymentType: t.payment_type,
        gateway: t.payment_gateway,
        amount: t.amount,
        status: t.status,
        referenceId: t.reference_id,
        createdAt: t.created_at,
        verifiedAt: t.verified_at,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
    });
  }
});

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
        if (!relatedId) {
          console.error('Individual verification payment missing relatedId (verificationRequestId)');
          return;
        }

        await prisma.individual_verification_requests.update({
          where: { id: relatedId },
          data: {
            status: 'pending',
            payment_status: 'paid',
            payment_reference: transaction.transaction_id || '',
          },
        });

        console.log(`✅ Individual verification ${relatedId} activated after payment for user ${transaction.user_id}`);
        break;
      }

      case 'business_verification': {
        if (!relatedId) {
          console.error('Business verification payment missing relatedId (verificationRequestId)');
          return;
        }

        await prisma.business_verification_requests.update({
          where: { id: relatedId },
          data: {
            status: 'pending',
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

export default router;
