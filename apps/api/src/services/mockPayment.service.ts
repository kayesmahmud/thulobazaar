/**
 * MOCK PAYMENT SERVICE - FOR TESTING ONLY
 * ========================================
 * This simulates a payment gateway for testing ad promotions
 * Replace with real eSewa/Khalti integration in production
 */

export interface PaymentInitParams {
  amount: number;
  productName: string;
  userId: number;
  metadata?: Record<string, any>;
}

export interface PaymentInitResult {
  success: boolean;
  transactionId: string;
  paymentUrl: string;
  amount: number;
  metadata?: Record<string, any>;
  gateway: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: string;
  gateway: string;
  error?: string;
  verifiedAt?: Date;
}

class MockPaymentService {
  /**
   * Simulate payment initiation
   * In real payment gateway: This would redirect to eSewa/Khalti
   */
  initiatePayment(params: PaymentInitParams): PaymentInitResult {
    const { amount, productName, userId, metadata } = params;

    // Generate fake transaction ID (mimics real payment gateway)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const transactionId = `MOCK_${timestamp}_${randomStr}`;

    console.log('🎭 MOCK PAYMENT: Initiating payment', {
      transactionId,
      amount,
      productName,
      userId,
      metadata,
    });

    return {
      success: true,
      transactionId,
      // Mock payment URL (in real gateway, this would be eSewa/Khalti URL)
      paymentUrl: `/mock-payment?txnId=${transactionId}&amount=${amount}&product=${encodeURIComponent(productName)}`,
      amount,
      metadata,
      gateway: 'mock',
    };
  }

  /**
   * Simulate payment verification
   * In real payment gateway: This would call eSewa/Khalti API to verify
   */
  async verifyPayment(transactionId: string, amount?: number): Promise<PaymentVerifyResult> {
    console.log('🎭 MOCK PAYMENT: Verifying payment', { transactionId, amount });

    // Simulate network delay (like real API call)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock verification logic
    // You can test failure by making transactionId start with "FAIL_"
    const isSuccess = !transactionId.startsWith('FAIL_');

    if (!isSuccess) {
      console.log('🎭 MOCK PAYMENT: Payment verification FAILED', { transactionId });
      return {
        success: false,
        transactionId,
        amount: amount || 0,
        status: 'failed',
        gateway: 'mock',
        error: 'Payment failed (simulated)',
      };
    }

    console.log('🎭 MOCK PAYMENT: Payment verification SUCCESS', { transactionId, amount });

    return {
      success: true,
      transactionId,
      amount: amount || 0,
      status: 'verified',
      gateway: 'mock',
      verifiedAt: new Date(),
    };
  }

  /**
   * Get payment status
   * In real payment gateway: This would query eSewa/Khalti for status
   */
  async getPaymentStatus(transactionId: string): Promise<{ transactionId: string; status: string; gateway: string; checkedAt: Date }> {
    console.log('🎭 MOCK PAYMENT: Getting payment status', { transactionId });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock status check
    const isFailed = transactionId.startsWith('FAIL_');

    return {
      transactionId,
      status: isFailed ? 'failed' : 'verified',
      gateway: 'mock',
      checkedAt: new Date(),
    };
  }

  /**
   * Generate mock payment reference
   * Useful for testing with specific reference numbers
   */
  generateReference(prefix: string = 'MOCK'): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `${prefix}_${timestamp}_${randomStr}`;
  }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();
export default mockPaymentService;
