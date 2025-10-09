/**
 * MOCK PAYMENT ROUTES - FOR TESTING ONLY
 * =======================================
 * API endpoints for simulating payment gateway
 * Replace with real eSewa/Khalti routes in production
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const mockPaymentService = require('../services/mockPaymentService');
const { authenticateToken } = require('../middleware/auth');

// =====================================================
// GET /api/mock-payment
// Show available mock payment endpoints
// =====================================================
router.get('/', (req, res) => {
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
          metadata: 'object (optional) - { adId, promotionType, durationDays }'
        },
        example: {
          amount: 1000,
          paymentType: 'ad_promotion',
          relatedId: 123,
          metadata: {
            adId: 123,
            promotionType: 'featured',
            durationDays: 7
          }
        }
      },
      success: {
        method: 'GET',
        path: '/api/mock-payment/success',
        auth: 'Not required',
        description: 'Simulate successful payment callback',
        query: {
          txnId: 'string (required) - transaction ID',
          amount: 'number (required) - payment amount'
        },
        example: '/api/mock-payment/success?txnId=MOCK_123_xyz&amount=1000'
      },
      failure: {
        method: 'GET',
        path: '/api/mock-payment/failure',
        auth: 'Not required',
        description: 'Simulate failed payment callback',
        query: {
          txnId: 'string (required) - transaction ID',
          reason: 'string (optional) - failure reason'
        },
        example: '/api/mock-payment/failure?txnId=MOCK_123_xyz&reason=User+cancelled'
      },
      verify: {
        method: 'POST',
        path: '/api/mock-payment/verify',
        auth: 'Required (JWT)',
        description: 'Verify payment status',
        body: {
          transactionId: 'string (required)',
          amount: 'number (optional)'
        }
      },
      status: {
        method: 'GET',
        path: '/api/mock-payment/status/:transactionId',
        auth: 'Required (JWT)',
        description: 'Get payment transaction details',
        example: '/api/mock-payment/status/MOCK_123_xyz'
      }
    },
    pricing: {
      featured: {
        3: { individual: 500, business: 350 },
        7: { individual: 1000, business: 700 },
        15: { individual: 1800, business: 1080 }
      },
      urgent: {
        3: { individual: 300, business: 210 },
        7: { individual: 600, business: 420 },
        15: { individual: 1000, business: 600 }
      },
      sticky: {
        3: { individual: 150, business: 105 },
        7: { individual: 300, business: 210 },
        15: { individual: 500, business: 300 }
      }
    },
    testingGuide: 'See TESTING_MOCK_PAYMENT.md for complete testing instructions'
  });
});

// =====================================================
// POST /api/mock-payment/initiate
// Initiate a mock payment transaction
// =====================================================
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentType, relatedId, metadata } = req.body;
    const userId = req.user.userId;

    console.log('📥 Mock payment initiate request:', {
      userId,
      amount,
      paymentType,
      relatedId,
      metadata
    });

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Amount must be greater than 0.'
      });
    }

    if (!paymentType) {
      return res.status(400).json({
        success: false,
        error: 'Payment type is required'
      });
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
      metadata
    });

    // Save to payment_transactions table
    const result = await pool.query(
      `INSERT INTO payment_transactions (
        user_id, payment_type, payment_gateway, amount,
        transaction_id, reference_id, related_id,
        status, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id, transaction_id, created_at`,
      [
        userId,
        paymentType,
        'mock',
        amount,
        paymentResult.transactionId,
        paymentResult.transactionId,
        relatedId || null,
        'pending',
        JSON.stringify(metadata || {})
      ]
    );

    console.log('✅ Payment transaction created:', result.rows[0]);

    res.json({
      success: true,
      paymentTransactionId: result.rows[0].id,
      transactionId: paymentResult.transactionId,
      paymentUrl: paymentResult.paymentUrl,
      amount: parseFloat(amount),
      productName,
      gateway: 'mock',
      message: '🎭 MOCK PAYMENT: Payment initiated. Use /success or /failure endpoint to complete.'
    });

  } catch (error) {
    console.error('❌ Mock payment initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// GET /api/mock-payment/success
// Simulate successful payment callback
// =====================================================
router.get('/success', async (req, res) => {
  try {
    const { txnId, amount } = req.query;

    console.log('✅ Mock payment success callback:', { txnId, amount });

    if (!txnId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Verify payment with mock service
    const verificationResult = await mockPaymentService.verifyPayment(
      txnId,
      parseFloat(amount)
    );

    if (!verificationResult.success) {
      console.log('❌ Payment verification failed');
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        transactionId: txnId
      });
    }

    // Update payment transaction status to verified
    const updateResult = await pool.query(
      `UPDATE payment_transactions
       SET status = 'verified',
           verified_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $1
       RETURNING id, user_id, payment_type, related_id, metadata`,
      [txnId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    const payment = updateResult.rows[0];

    console.log('✅ Payment verified and updated:', payment);

    // Handle different payment types
    let activationResult = null;

    // If it's an ad promotion payment, activate the promotion
    if (payment.payment_type === 'ad_promotion' && payment.metadata) {
      const metadata = payment.metadata;

      console.log('🚀 Activating ad promotion:', metadata);

      // Import promotion service here to avoid circular dependency
      const promotionService = require('../services/promotionService');

      try {
        activationResult = await promotionService.activatePromotion(
          metadata.adId,
          payment.user_id,
          metadata.promotionType,
          metadata.durationDays,
          parseFloat(amount),
          txnId
        );

        console.log('✅ Promotion activated:', activationResult);
      } catch (error) {
        console.error('❌ Promotion activation error:', error);
        // Don't fail the payment, just log the error
      }
    }

    // Redirect to frontend success page
    const adId = payment.metadata?.adId || payment.related_id;
    const redirectUrl = `http://localhost:5173/en/payment-success?txnId=${txnId}&amount=${amount}&adId=${adId}`;

    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Mock payment success callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// GET /api/mock-payment/failure
// Simulate failed payment callback
// =====================================================
router.get('/failure', async (req, res) => {
  try {
    const { txnId, reason } = req.query;

    console.log('❌ Mock payment failure callback:', { txnId, reason });

    if (!txnId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Update payment transaction status to failed
    await pool.query(
      `UPDATE payment_transactions
       SET status = 'failed',
           metadata = jsonb_set(
             COALESCE(metadata, '{}'::jsonb),
             '{failureReason}',
             $2::jsonb
           )
       WHERE transaction_id = $1`,
      [txnId, JSON.stringify(reason || 'User cancelled payment')]
    );

    console.log('✅ Payment marked as failed');

    res.json({
      success: false,
      message: '❌ Payment failed',
      transactionId: txnId,
      reason: reason || 'User cancelled payment'
    });

  } catch (error) {
    console.error('❌ Mock payment failure callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// POST /api/mock-payment/verify
// Verify payment status
// =====================================================
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const userId = req.user.userId;

    console.log('🔍 Verifying payment:', { transactionId, amount, userId });

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    // Verify with mock service
    const verificationResult = await mockPaymentService.verifyPayment(
      transactionId,
      amount
    );

    // Check in database
    const dbResult = await pool.query(
      `SELECT status, amount, verified_at
       FROM payment_transactions
       WHERE transaction_id = $1 AND user_id = $2`,
      [transactionId, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    const dbPayment = dbResult.rows[0];

    res.json({
      success: verificationResult.success,
      transactionId,
      amount: parseFloat(dbPayment.amount),
      status: dbPayment.status,
      verifiedAt: dbPayment.verified_at,
      gateway: 'mock'
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// GET /api/mock-payment/status/:transactionId
// Get payment transaction status
// =====================================================
router.get('/status/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.userId;

    console.log('📊 Getting payment status:', { transactionId, userId });

    const result = await pool.query(
      `SELECT
        id, transaction_id, payment_type, amount,
        status, created_at, verified_at, metadata
       FROM payment_transactions
       WHERE transaction_id = $1 AND user_id = $2`,
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    const payment = result.rows[0];

    res.json({
      success: true,
      payment: {
        id: payment.id,
        transactionId: payment.transaction_id,
        paymentType: payment.payment_type,
        amount: parseFloat(payment.amount),
        status: payment.status,
        createdAt: payment.created_at,
        verifiedAt: payment.verified_at,
        metadata: payment.metadata
      }
    });

  } catch (error) {
    console.error('❌ Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
