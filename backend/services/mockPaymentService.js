/**
 * MOCK PAYMENT SERVICE - FOR TESTING ONLY
 * ========================================
 * This simulates a payment gateway for testing ad promotions
 * Replace with real eSewa/Khalti integration in production
 *
 * Purpose: Test promotion system without real money
 * Status: Development/Testing only
 */

class MockPaymentService {
  /**
   * Simulate payment initiation
   * In real payment gateway: This would redirect to eSewa/Khalti
   *
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Payment amount in NPR
   * @param {string} params.productName - Product description
   * @param {number} params.userId - User ID
   * @param {Object} params.metadata - Additional data
   * @returns {Object} Payment initiation result
   */
  initiatePayment({ amount, productName, userId, metadata }) {
    // Generate fake transaction ID (mimics real payment gateway)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const transactionId = `MOCK_${timestamp}_${randomStr}`;

    console.log('🎭 MOCK PAYMENT: Initiating payment', {
      transactionId,
      amount,
      productName,
      userId,
      metadata
    });

    return {
      success: true,
      transactionId,
      // Mock payment URL (in real gateway, this would be eSewa/Khalti URL)
      paymentUrl: `/mock-payment?txnId=${transactionId}&amount=${amount}&product=${encodeURIComponent(productName)}`,
      amount,
      metadata,
      gateway: 'mock'
    };
  }

  /**
   * Simulate payment verification
   * In real payment gateway: This would call eSewa/Khalti API to verify
   *
   * @param {string} transactionId - Transaction ID to verify
   * @param {number} amount - Expected payment amount
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(transactionId, amount) {
    console.log('🎭 MOCK PAYMENT: Verifying payment', { transactionId, amount });

    // Simulate network delay (like real API call)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock verification logic
    // You can test failure by making transactionId start with "FAIL_"
    const isSuccess = !transactionId.startsWith('FAIL_');

    if (!isSuccess) {
      console.log('🎭 MOCK PAYMENT: Payment verification FAILED', { transactionId });
      return {
        success: false,
        transactionId,
        amount,
        status: 'failed',
        gateway: 'mock',
        error: 'Payment failed (simulated)'
      };
    }

    console.log('🎭 MOCK PAYMENT: Payment verification SUCCESS', { transactionId, amount });

    return {
      success: true,
      transactionId,
      amount: parseFloat(amount),
      status: 'verified',
      gateway: 'mock',
      verifiedAt: new Date()
    };
  }

  /**
   * Get payment status
   * In real payment gateway: This would query eSewa/Khalti for status
   *
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    console.log('🎭 MOCK PAYMENT: Getting payment status', { transactionId });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock status check
    const isFailed = transactionId.startsWith('FAIL_');

    return {
      transactionId,
      status: isFailed ? 'failed' : 'verified',
      gateway: 'mock',
      checkedAt: new Date()
    };
  }

  /**
   * Generate mock payment reference
   * Useful for testing with specific reference numbers
   *
   * @param {string} prefix - Optional prefix
   * @returns {string} Reference ID
   */
  generateReference(prefix = 'MOCK') {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    return `${prefix}_${timestamp}_${randomStr}`;
  }
}

// Export singleton instance
module.exports = new MockPaymentService();
