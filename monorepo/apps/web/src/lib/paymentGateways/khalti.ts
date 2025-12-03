/**
 * Khalti Payment Gateway Service
 * https://docs.khalti.com/khalti-epayment/
 */

import type {
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentVerifyParams,
  PaymentVerifyResponse,
  KhaltiConfig,
} from './types';

// Khalti API URLs
const KHALTI_SANDBOX_URL = 'https://dev.khalti.com/api/v2';
const KHALTI_PRODUCTION_URL = 'https://khalti.com/api/v2';

/**
 * Get Khalti configuration from environment
 */
export function getKhaltiConfig(): KhaltiConfig {
  const isTest = process.env.KHALTI_ENV !== 'production';

  return {
    secretKey: process.env.KHALTI_SECRET_KEY || '',
    publicKey: process.env.KHALTI_PUBLIC_KEY || '',
    apiUrl: isTest ? KHALTI_SANDBOX_URL : KHALTI_PRODUCTION_URL,
    isTest,
  };
}

/**
 * Initiate Khalti payment
 * Creates a payment request and returns the payment URL
 */
export async function initiateKhaltiPayment(
  params: PaymentInitiateParams
): Promise<PaymentInitiateResponse> {
  const config = getKhaltiConfig();

  if (!config.secretKey) {
    return {
      success: false,
      gateway: 'khalti',
      transactionId: '',
      paymentUrl: '',
      error: 'Khalti secret key not configured',
    };
  }

  try {
    // Khalti requires amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = Math.round(params.amount * 100);

    // Minimum amount is 1000 paisa (Rs. 10)
    if (amountInPaisa < 1000) {
      return {
        success: false,
        gateway: 'khalti',
        transactionId: params.orderId,
        paymentUrl: '',
        error: 'Minimum amount is Rs. 10',
      };
    }

    const payload = {
      return_url: params.returnUrl,
      website_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3333',
      amount: amountInPaisa,
      purchase_order_id: params.orderId,
      purchase_order_name: params.orderName,
      customer_info: {
        name: params.metadata?.userName || 'Customer',
        email: params.metadata?.userEmail || '',
        phone: params.metadata?.userPhone || '',
      },
    };

    const response = await fetch(`${config.apiUrl}/epayment/initiate/`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti initiate error:', data);
      return {
        success: false,
        gateway: 'khalti',
        transactionId: params.orderId,
        paymentUrl: '',
        error: data.detail || data.error_key || 'Failed to initiate payment',
      };
    }

    return {
      success: true,
      gateway: 'khalti',
      transactionId: params.orderId,
      paymentUrl: data.payment_url,
      pidx: data.pidx,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('Khalti initiate exception:', error);
    return {
      success: false,
      gateway: 'khalti',
      transactionId: params.orderId,
      paymentUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Khalti payment using lookup API
 */
export async function verifyKhaltiPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResponse> {
  const config = getKhaltiConfig();

  if (!config.secretKey) {
    return {
      success: false,
      status: 'failed',
      transactionId: params.transactionId,
      amount: 0,
      gateway: 'khalti',
      error: 'Khalti secret key not configured',
    };
  }

  if (!params.pidx) {
    return {
      success: false,
      status: 'failed',
      transactionId: params.transactionId,
      amount: 0,
      gateway: 'khalti',
      error: 'pidx is required for verification',
    };
  }

  try {
    const response = await fetch(`${config.apiUrl}/epayment/lookup/`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx: params.pidx }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Khalti verify error:', data);
      return {
        success: false,
        status: 'failed',
        transactionId: params.transactionId,
        amount: 0,
        gateway: 'khalti',
        error: data.detail || 'Verification failed',
      };
    }

    // Map Khalti status to our status
    const statusMap: Record<string, PaymentVerifyResponse['status']> = {
      Completed: 'completed',
      Pending: 'pending',
      Refunded: 'refunded',
      Expired: 'expired',
      'User canceled': 'canceled',
      Initiated: 'pending',
    };

    const status = statusMap[data.status] || 'failed';
    const amountInNPR = data.total_amount / 100; // Convert paisa to NPR

    return {
      success: status === 'completed',
      status,
      transactionId: params.transactionId,
      amount: amountInNPR,
      gateway: 'khalti',
      gatewayTransactionId: data.transaction_id,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Khalti verify exception:', error);
    return {
      success: false,
      status: 'failed',
      transactionId: params.transactionId,
      amount: 0,
      gateway: 'khalti',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test credentials for sandbox
 * - Khalti ID: 9800000000-9800000005
 * - MPIN: 1111
 * - OTP: 987654
 */
export const KHALTI_TEST_INFO = {
  testIds: ['9800000000', '9800000001', '9800000002', '9800000003', '9800000004', '9800000005'],
  mpin: '1111',
  otp: '987654',
};
