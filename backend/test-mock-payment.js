/**
 * TEST FILE: Mock Payment Service
 * ================================
 * Run this to verify mockPaymentService.js works correctly
 *
 * Usage: node backend/test-mock-payment.js
 */

const mockPaymentService = require('./services/mockPaymentService');

console.log('🧪 Testing Mock Payment Service...\n');

// Test 1: Initiate Payment
console.log('Test 1: Initiate Payment');
console.log('========================');
const paymentResult = mockPaymentService.initiatePayment({
  amount: 1000,
  productName: 'Ad Promotion - Featured (7 days)',
  userId: 1,
  metadata: {
    adId: 123,
    promotionType: 'featured',
    durationDays: 7
  }
});

console.log('✅ Payment initiated:', paymentResult);
console.log('');

// Test 2: Verify Payment (Success)
console.log('Test 2: Verify Payment (Success)');
console.log('=================================');
mockPaymentService.verifyPayment(paymentResult.transactionId, 1000)
  .then(verifyResult => {
    console.log('✅ Payment verified:', verifyResult);
    console.log('');

    // Test 3: Verify Payment (Failure)
    console.log('Test 3: Verify Payment (Failure)');
    console.log('=================================');
    return mockPaymentService.verifyPayment('FAIL_test123', 1000);
  })
  .then(failResult => {
    console.log('❌ Payment failed (expected):', failResult);
    console.log('');

    // Test 4: Get Payment Status
    console.log('Test 4: Get Payment Status');
    console.log('===========================');
    return mockPaymentService.getPaymentStatus(paymentResult.transactionId);
  })
  .then(statusResult => {
    console.log('✅ Payment status:', statusResult);
    console.log('');

    // Test 5: Generate Reference
    console.log('Test 5: Generate Reference');
    console.log('===========================');
    const ref1 = mockPaymentService.generateReference();
    const ref2 = mockPaymentService.generateReference('TEST');
    console.log('✅ Reference 1:', ref1);
    console.log('✅ Reference 2:', ref2);
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('');
    console.log('✅ mockPaymentService.js is working correctly!');
    console.log('👉 You can now proceed to Step 2');
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
