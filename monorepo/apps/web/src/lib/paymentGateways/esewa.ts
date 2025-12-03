/**
 * eSewa Payment Gateway Service
 * https://developer.esewa.com.np/pages/Epay
 */

import crypto from 'crypto';
import type {
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentVerifyParams,
  PaymentVerifyResponse,
  EsewaConfig,
} from './types';

// eSewa API URLs
const ESEWA_SANDBOX_URL = 'https://rc-epay.esewa.com.np';
const ESEWA_PRODUCTION_URL = 'https://epay.esewa.com.np';

const ESEWA_SANDBOX_VERIFY_URL = 'https://rc.esewa.com.np';
const ESEWA_PRODUCTION_VERIFY_URL = 'https://esewa.com.np';

/**
 * Get eSewa configuration from environment
 */
export function getEsewaConfig(): EsewaConfig {
  const isTest = process.env.ESEWA_ENV !== 'production';

  return {
    merchantCode: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
    secretKey: process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q',
    apiUrl: isTest ? ESEWA_SANDBOX_URL : ESEWA_PRODUCTION_URL,
    isTest,
  };
}

/**
 * Generate HMAC-SHA256 signature for eSewa
 * Signature format: total_amount=X,transaction_uuid=Y,product_code=Z
 */
export function generateEsewaSignature(
  totalAmount: number,
  transactionUuid: string,
  productCode: string,
  secretKey: string
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Verify eSewa signature from callback
 */
export function verifyEsewaSignature(
  data: {
    total_amount: number;
    transaction_uuid: string;
    product_code: string;
    signature: string;
  },
  secretKey: string
): boolean {
  const expectedSignature = generateEsewaSignature(
    data.total_amount,
    data.transaction_uuid,
    data.product_code,
    secretKey
  );
  return expectedSignature === data.signature;
}

/**
 * Build eSewa form data for payment initiation
 * eSewa uses form POST, not API call
 */
export function buildEsewaFormData(params: PaymentInitiateParams): {
  url: string;
  formData: Record<string, string>;
} {
  const config = getEsewaConfig();
  const totalAmount = params.amount;

  const signature = generateEsewaSignature(
    totalAmount,
    params.orderId,
    config.merchantCode,
    config.secretKey
  );

  const formData = {
    amount: totalAmount.toString(),
    tax_amount: '0',
    total_amount: totalAmount.toString(),
    transaction_uuid: params.orderId,
    product_code: config.merchantCode,
    product_service_charge: '0',
    product_delivery_charge: '0',
    success_url: params.returnUrl,
    failure_url: params.returnUrl.replace('/success', '/failure'),
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: signature,
  };

  return {
    url: `${config.apiUrl}/api/epay/main/v2/form`,
    formData,
  };
}

/**
 * Initiate eSewa payment
 * Returns form data that should be submitted via HTML form
 */
export async function initiateEsewaPayment(
  params: PaymentInitiateParams
): Promise<PaymentInitiateResponse> {
  const config = getEsewaConfig();

  if (!config.secretKey) {
    return {
      success: false,
      gateway: 'esewa',
      transactionId: '',
      paymentUrl: '',
      error: 'eSewa secret key not configured',
    };
  }

  try {
    const { url, formData } = buildEsewaFormData(params);

    // Build a URL with form data as query params for redirect
    // eSewa requires form POST, so we'll create a special handler page
    const paymentUrl = `/api/payments/esewa/redirect?${new URLSearchParams(formData).toString()}&formUrl=${encodeURIComponent(url)}`;

    return {
      success: true,
      gateway: 'esewa',
      transactionId: params.orderId,
      paymentUrl,
    };
  } catch (error) {
    console.error('eSewa initiate exception:', error);
    return {
      success: false,
      gateway: 'esewa',
      transactionId: params.orderId,
      paymentUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify eSewa payment using status check API
 */
export async function verifyEsewaPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResponse> {
  const config = getEsewaConfig();
  const verifyUrl = config.isTest ? ESEWA_SANDBOX_VERIFY_URL : ESEWA_PRODUCTION_VERIFY_URL;

  try {
    const queryParams = new URLSearchParams({
      product_code: config.merchantCode,
      total_amount: (params.amount || 0).toString(),
      transaction_uuid: params.transactionId,
    });

    const response = await fetch(
      `${verifyUrl}/api/epay/transaction/status/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('eSewa verify error:', data);
      return {
        success: false,
        status: 'failed',
        transactionId: params.transactionId,
        amount: 0,
        gateway: 'esewa',
        error: data.message || 'Verification failed',
      };
    }

    // Map eSewa status to our status
    const statusMap: Record<string, PaymentVerifyResponse['status']> = {
      COMPLETE: 'completed',
      PENDING: 'pending',
      FULL_REFUND: 'refunded',
      PARTIAL_REFUND: 'refunded',
      AMBIGUOUS: 'pending',
      NOT_FOUND: 'expired',
      CANCELED: 'canceled',
    };

    const status = statusMap[data.status] || 'failed';

    return {
      success: status === 'completed',
      status,
      transactionId: params.transactionId,
      amount: parseFloat(data.total_amount) || 0,
      gateway: 'esewa',
      gatewayTransactionId: data.ref_id,
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('eSewa verify exception:', error);
    return {
      success: false,
      status: 'failed',
      transactionId: params.transactionId,
      amount: 0,
      gateway: 'esewa',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Decode eSewa callback response (base64 encoded JSON)
 */
export function decodeEsewaCallback(encodedData: string): Record<string, unknown> | null {
  try {
    const decoded = Buffer.from(encodedData, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode eSewa callback:', error);
    return null;
  }
}

/**
 * Test credentials for sandbox
 * - eSewa ID: 9806800001-9806800005
 * - Password: Nepal@123
 * - MPIN: 1122 (app only)
 * - OTP: 123456
 */
export const ESEWA_TEST_INFO = {
  testIds: ['9806800001', '9806800002', '9806800003', '9806800004', '9806800005'],
  password: 'Nepal@123',
  mpin: '1122',
  otp: '123456',
  merchantCode: 'EPAYTEST',
  secretKey: '8gBm/:&EnhH.1/q',
};
