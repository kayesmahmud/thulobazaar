/**
 * MOCK PAYMENT SERVICE - FOR TESTING ONLY
 * ========================================
 * This simulates a payment gateway for testing ad promotions
 * Replace with real eSewa/Khalti integration in production
 */

export class MockPaymentService {
  /**
   * Generate fake transaction ID (mimics real payment gateway)
   */
  generateTransactionId(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `MOCK_${timestamp}_${randomStr}`;
  }

  /**
   * Simulate payment initiation
   * In real payment gateway: This would redirect to eSewa/Khalti
   */
  initiatePayment(params: {
    amount: number;
    productName: string;
    userId: number;
    metadata?: any;
  }) {
    const transactionId = this.generateTransactionId();

    console.log('🎭 MOCK PAYMENT: Initiating payment', {
      transactionId,
      amount: params.amount,
      productName: params.productName,
      userId: params.userId,
      metadata: params.metadata,
    });

    return {
      success: true,
      transactionId,
      // Mock payment URL (in real gateway, this would be eSewa/Khalti URL)
      paymentUrl: `/mock-payment?txnId=${transactionId}&amount=${params.amount}&product=${encodeURIComponent(params.productName)}`,
      amount: params.amount,
      metadata: params.metadata,
      gateway: 'mock',
    };
  }

  /**
   * Simulate payment verification
   * In real payment gateway: This would call eSewa/Khalti API to verify
   */
  async verifyPayment(transactionId: string, amount: number) {
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
        amount,
        status: 'failed' as const,
        gateway: 'mock',
        error: 'Payment failed (simulated)',
      };
    }

    console.log('🎭 MOCK PAYMENT: Payment verification SUCCESS', {
      transactionId,
      amount,
    });

    return {
      success: true,
      transactionId,
      amount: parseFloat(amount.toString()),
      status: 'verified' as const,
      gateway: 'mock',
      verifiedAt: new Date(),
    };
  }

  /**
   * Get payment status
   * In real payment gateway: This would query eSewa/Khalti for status
   */
  async getPaymentStatus(transactionId: string) {
    console.log('🎭 MOCK PAYMENT: Getting payment status', { transactionId });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock status check
    const isFailed = transactionId.startsWith('FAIL_');

    return {
      transactionId,
      status: isFailed ? ('failed' as const) : ('verified' as const),
      gateway: 'mock',
      checkedAt: new Date(),
    };
  }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();
