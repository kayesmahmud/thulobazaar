/**
 * Payment Gateways Index
 * Unified interface for Khalti and eSewa
 */

export * from './types';
export * from './khalti';
export * from './esewa';

import type {
  PaymentGateway,
  PaymentInitiateParams,
  PaymentInitiateResponse,
  PaymentVerifyParams,
  PaymentVerifyResponse,
} from './types';

import { initiateKhaltiPayment, verifyKhaltiPayment } from './khalti';
import { initiateEsewaPayment, verifyEsewaPayment } from './esewa';

/**
 * Initiate payment with the specified gateway
 */
export async function initiatePayment(
  params: PaymentInitiateParams
): Promise<PaymentInitiateResponse> {
  switch (params.gateway) {
    case 'khalti':
      return initiateKhaltiPayment(params);
    case 'esewa':
      return initiateEsewaPayment(params);
    default:
      return {
        success: false,
        gateway: params.gateway,
        transactionId: params.orderId,
        paymentUrl: '',
        error: `Unknown payment gateway: ${params.gateway}`,
      };
  }
}

/**
 * Verify payment with the specified gateway
 */
export async function verifyPayment(
  params: PaymentVerifyParams
): Promise<PaymentVerifyResponse> {
  switch (params.gateway) {
    case 'khalti':
      return verifyKhaltiPayment(params);
    case 'esewa':
      return verifyEsewaPayment(params);
    default:
      return {
        success: false,
        status: 'failed',
        transactionId: params.transactionId,
        amount: 0,
        gateway: params.gateway,
        error: `Unknown payment gateway: ${params.gateway}`,
      };
  }
}

/**
 * Get available payment gateways
 */
export function getAvailableGateways(): { id: PaymentGateway; name: string; enabled: boolean }[] {
  return [
    {
      id: 'khalti',
      name: 'Khalti',
      enabled: !!process.env.KHALTI_SECRET_KEY,
    },
    {
      id: 'esewa',
      name: 'eSewa',
      enabled: !!process.env.ESEWA_SECRET_KEY || process.env.ESEWA_ENV !== 'production',
    },
  ];
}
