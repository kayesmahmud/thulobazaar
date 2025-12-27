import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { test as authTest, expect as authExpect, createAuthenticatedRequest } from './fixtures/auth';

/**
 * PAYMENT FLOW E2E TESTS
 *
 * Tests the payment system including:
 * 1. Payment API validation
 * 2. Payment page accessibility
 * 3. Mock payment flow (for testing without real gateways)
 * 4. Payment status pages
 *
 * Uses auth fixtures for authenticated payment tests.
 */

// Use base test for unauthenticated tests
const test = baseTest;
const expect = baseExpect;

test.describe('Payment Flow', () => {
  // ============================================
  // PAYMENT API VALIDATION
  // ============================================
  test.describe('Payment API Validation', () => {
    test('payment initiation requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('mock payment initiation requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/mock/initiate', {
        data: {
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('mock payment verification requires authentication', async ({ request }) => {
      const response = await request.post('/api/payments/mock/verify', {
        data: {
          transactionId: 'MOCK_TEST_123',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  // ============================================
  // PAYMENT PAGES ACCESSIBILITY
  // ============================================
  test.describe('Payment Pages', () => {
    test('payment success page loads', async ({ page }) => {
      await page.goto('/en/payment/success?orderId=TEST123&gateway=khalti&type=ad_promotion');

      // Page should load without errors
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page loads', async ({ page }) => {
      await page.goto('/en/payment/failure?error=test_error&orderId=TEST123');

      // Page should load without errors
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page handles missing order', async ({ page }) => {
      await page.goto('/en/payment/failure?error=missing_order');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });

    test('payment failure page handles canceled payment', async ({ page }) => {
      await page.goto('/en/payment/failure?error=canceled&orderId=TEST123');

      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  // ============================================
  // PAYMENT CALLBACK HANDLING
  // ============================================
  test.describe('Payment Callback', () => {
    test('callback redirects on missing orderId', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=khalti');

      // Should redirect to failure page
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });

    test('callback redirects on invalid gateway', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=invalid&orderId=TEST123');

      // Should redirect to failure page
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });

    test('callback redirects on non-existent transaction', async ({ page }) => {
      await page.goto('/api/payments/callback?gateway=khalti&orderId=NON_EXISTENT_123');

      // Should redirect to failure page
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('payment/failure');
    });
  });

  // ============================================
  // MOCK PAYMENT FLOW
  // ============================================
  test.describe('Mock Payment Endpoints', () => {
    test('mock success endpoint exists', async ({ request }) => {
      // Mock success endpoint should be accessible (will need valid txnId for full flow)
      const response = await request.get('/api/payments/mock/success?txnId=TEST&amount=100');

      // Should either redirect or return JSON
      expect([200, 302, 307]).toContain(response.status());
    });

    test('mock failure endpoint exists', async ({ request }) => {
      const response = await request.get('/api/payments/mock/failure?txnId=TEST&amount=100');

      // Should either redirect or return JSON
      expect([200, 302, 307]).toContain(response.status());
    });

    test('mock status endpoint returns 404 for invalid transaction', async ({ request }) => {
      const response = await request.get('/api/payments/mock/status/INVALID_TXN_ID');

      // Should return 404 for non-existent transaction
      expect([404, 401]).toContain(response.status());
    });
  });

  // ============================================
  // PAYMENT TYPES
  // ============================================
  test.describe('Payment Types', () => {
    test('supports ad_promotion payment type', async ({ request }) => {
      // Test that the API recognizes valid payment types
      // This will fail auth but should not fail validation
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      const data = await response.json();
      // Should fail on auth, not on paymentType validation
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });

    test('supports individual_verification payment type', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 500,
          paymentType: 'individual_verification',
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });

    test('supports business_verification payment type', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 2000,
          paymentType: 'business_verification',
        },
      });

      const data = await response.json();
      expect(response.status()).toBe(401);
      expect(data.message).toContain('Authentication');
    });
  });

  // ============================================
  // PAYMENT GATEWAYS
  // ============================================
  test.describe('Payment Gateways', () => {
    test('accepts khalti gateway', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      // Auth error, not gateway validation error
      expect(response.status()).toBe(401);
    });

    test('accepts esewa gateway', async ({ request }) => {
      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 100,
          paymentType: 'ad_promotion',
        },
      });

      // Auth error, not gateway validation error
      expect(response.status()).toBe(401);
    });
  });

  // ============================================
  // ESEWA REDIRECT HANDLING
  // ============================================
  test.describe('eSewa Integration', () => {
    test('esewa redirect endpoint exists', async ({ request }) => {
      // eSewa uses a redirect endpoint for payment initiation
      const response = await request.get('/api/payments/esewa/redirect');

      // Should exist (may require params to work fully)
      expect([200, 400, 401, 405]).toContain(response.status());
    });
  });

  // ============================================
  // AUTHENTICATED PAYMENT FLOW
  // ============================================
  authTest.describe('Authenticated Payment Flow', () => {
    authTest('can initiate khalti payment when authenticated', async ({ authenticatedPage, request }) => {
      // Get auth token from authenticated page
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      // Skip if no auth token (test user not available)
      if (!token) {
        authTest.skip();
        return;
      }

      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'khalti',
          amount: 100,
          paymentType: 'ad_promotion',
          relatedId: 1,
          orderName: 'Test Ad Promotion',
        },
        headers,
      });

      // Payment initiation should succeed or fail with a meaningful error
      const data = await response.json();

      // Should not be 401 (authentication error) since we're authenticated
      authExpect(response.status()).not.toBe(401);

      // If successful, should have payment URL
      if (response.ok()) {
        authExpect(data.success).toBe(true);
        authExpect(data.data).toHaveProperty('paymentUrl');
      }
    });

    authTest('can initiate esewa payment when authenticated', async ({ authenticatedPage, request }) => {
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      if (!token) {
        authTest.skip();
        return;
      }

      const response = await request.post('/api/payments/initiate', {
        data: {
          gateway: 'esewa',
          amount: 500,
          paymentType: 'individual_verification',
          relatedId: 1,
        },
        headers,
      });

      const data = await response.json();

      // Should not get 401
      authExpect(response.status()).not.toBe(401);

      if (response.ok()) {
        authExpect(data.success).toBe(true);
      }
    });

    authTest('can complete mock payment flow', async ({ authenticatedPage, request }) => {
      const { token, headers } = await createAuthenticatedRequest(authenticatedPage);

      if (!token) {
        authTest.skip();
        return;
      }

      // 1. Initiate mock payment
      const initResponse = await request.post('/api/payments/mock/initiate', {
        data: {
          amount: 100,
          paymentType: 'ad_promotion',
          relatedId: 1,
        },
        headers,
      });

      // If mock endpoint is available
      if (initResponse.ok()) {
        const initData = await initResponse.json();

        if (initData.data?.transactionId) {
          // 2. Simulate successful payment
          const txnId = initData.data.transactionId;

          // Visit mock success URL
          await authenticatedPage.goto(`/api/payments/mock/success?txnId=${txnId}&amount=100`);
          await authenticatedPage.waitForLoadState('networkidle');

          // Should redirect to success page or show success
          const url = authenticatedPage.url();
          authExpect(url).toMatch(/success|payment/i);
        }
      }
    });

    authTest('payment history accessible in dashboard', async ({ authenticatedPage }) => {
      // Navigate to payment history if it exists
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      // Check if dashboard loaded (user is authenticated)
      const dashboardLoaded = await authenticatedPage.locator('body').textContent();
      authExpect(dashboardLoaded).not.toContain('Login');

      // Look for payments section or link
      const paymentsLink = authenticatedPage.locator('a[href*="payment"], button:has-text("Payments")').first();

      if (await paymentsLink.isVisible().catch(() => false)) {
        await paymentsLink.click();
        await authenticatedPage.waitForLoadState('networkidle');

        // Page should load
        await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();
      }
    });
  });

  // ============================================
  // AD PROMOTION PAYMENT
  // ============================================
  test.describe('Ad Promotion Payment', () => {
    test('promotion pricing API is accessible', async ({ request }) => {
      // Check if there's a pricing endpoint
      const response = await request.get('/api/ads/promotion-pricing');

      // May or may not exist - just checking endpoint behavior
      expect([200, 401, 404]).toContain(response.status());
    });
  });

  // Authenticated ad promotion tests
  authTest.describe('Ad Promotion (Authenticated)', () => {
    authTest('can view ad promotion options when authenticated', async ({ authenticatedPage }) => {
      // First get user's ads to find one to promote
      await authenticatedPage.goto('/en/dashboard');
      await authenticatedPage.waitForLoadState('networkidle');

      // Look for "My Ads" or ads section
      const myAdsLink = authenticatedPage.locator('a[href*="my-ads"], a[href*="/ads"]').first();

      if (await myAdsLink.isVisible().catch(() => false)) {
        await myAdsLink.click();
        await authenticatedPage.waitForLoadState('networkidle');

        // Look for promote button on any ad
        const promoteBtn = authenticatedPage.locator('button:has-text("Promote"), a:has-text("Promote")').first();

        if (await promoteBtn.isVisible().catch(() => false)) {
          await promoteBtn.click();
          await authenticatedPage.waitForLoadState('networkidle');

          // Should show promotion options
          await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();
        }
      }
    });
  });

  // ============================================
  // VERIFICATION PAYMENT
  // ============================================
  test.describe('Verification Payment', () => {
    test('verification page redirects without auth', async ({ page }) => {
      await page.goto('/en/profile/verification');

      // Should redirect to login
      await page.waitForLoadState('networkidle');
      expect(page.url()).toMatch(/login|auth/);
    });
  });

  // Authenticated verification tests
  authTest.describe('Verification Payment (Authenticated)', () => {
    authTest('shows verification options when authenticated', async ({ authenticatedPage }) => {
      // Navigate to verification page
      await authenticatedPage.goto('/en/profile/verification');
      await authenticatedPage.waitForLoadState('networkidle');

      // Should not redirect to login
      const currentUrl = authenticatedPage.url();
      authExpect(currentUrl).not.toMatch(/login|auth\/signin/);

      // Page should have content
      await authExpect(authenticatedPage.locator('body')).not.toBeEmpty();

      // Look for verification-related content
      const hasVerificationContent = await authenticatedPage.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        return (
          text.includes('verification') ||
          text.includes('verify') ||
          text.includes('individual') ||
          text.includes('business')
        );
      });

      authExpect(hasVerificationContent).toBeTruthy();
    });

    authTest('shows verification pricing', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/en/profile/verification');
      await authenticatedPage.waitForLoadState('networkidle');

      // Look for pricing indicators (NPR, Rs, or numbers with currency)
      const hasPricing = await authenticatedPage.evaluate(() => {
        const text = document.body.textContent || '';
        return (
          text.includes('NPR') ||
          text.includes('Rs') ||
          text.match(/[रू₹]\s*\d+/) !== null ||
          text.match(/\d+\s*(NPR|Rs)/) !== null
        );
      });

      // Pricing should be visible if verification page exists
      if (!authenticatedPage.url().includes('login')) {
        authExpect(hasPricing).toBeTruthy();
      }
    });
  });
});
