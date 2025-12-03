/**
 * Payment Gateway Types
 * Shared types for Khalti and eSewa integration
 */

export type PaymentGateway = 'khalti' | 'esewa';

export type PaymentType = 'ad_promotion' | 'individual_verification' | 'business_verification';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'refunded' | 'canceled';

export interface PaymentInitiateParams {
  gateway: PaymentGateway;
  amount: number; // In NPR (will be converted to paisa for Khalti)
  paymentType: PaymentType;
  orderId: string; // Unique order/transaction ID
  orderName: string; // Product/service name
  userId: number;
  returnUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitiateResponse {
  success: boolean;
  gateway: PaymentGateway;
  transactionId: string;
  paymentUrl: string;
  pidx?: string; // Khalti specific
  expiresAt?: string;
  error?: string;
}

export interface PaymentVerifyParams {
  gateway: PaymentGateway;
  transactionId: string;
  pidx?: string; // Khalti specific
  amount?: number;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: PaymentStatus;
  transactionId: string;
  amount: number;
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  verifiedAt?: string;
  error?: string;
}

export interface KhaltiConfig {
  secretKey: string;
  publicKey: string;
  apiUrl: string;
  isTest: boolean;
}

export interface EsewaConfig {
  merchantCode: string;
  secretKey: string;
  apiUrl: string;
  isTest: boolean;
}

export interface PaymentCallbackData {
  // Khalti callback params
  pidx?: string;
  status?: string;
  transaction_id?: string;
  tidx?: string;
  amount?: string;
  mobile?: string;
  purchase_order_id?: string;
  purchase_order_name?: string;

  // eSewa callback params (base64 decoded)
  transaction_code?: string;
  total_amount?: string | number;
  transaction_uuid?: string;
  product_code?: string;
  signature?: string;
  signed_field_names?: string;
}
