import { test as base, Page, expect } from '@playwright/test';

/**
 * E2E Auth Fixtures
 *
 * Provides authenticated page fixtures for testing protected routes.
 * Uses phone-based authentication (simpler than email).
 *
 * Test User (configure in .env.test or environment):
 * - TEST_USER_PHONE: Phone number for test user (default: 9800000001)
 * - TEST_USER_PASSWORD: Password for test user (default: testpassword123)
 *
 * Usage:
 * ```typescript
 * import { test, expect } from '../fixtures/auth';
 *
 * test('my authenticated test', async ({ authenticatedPage }) => {
 *   // authenticatedPage is already logged in
 *   await authenticatedPage.goto('/en/dashboard');
 * });
 * ```
 */

// Test credentials from environment or defaults
const TEST_USER_PHONE = process.env.TEST_USER_PHONE || '9800000001';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Types for our fixtures
type AuthFixtures = {
  // Authenticated page fixture - already logged in
  authenticatedPage: Page;

  // Auth token for API requests
  authToken: string;

  // Login function that can be called manually
  login: (page: Page, phone?: string, password?: string) => Promise<void>;

  // Logout function
  logout: (page: Page) => Promise<void>;
};

/**
 * Login helper function
 */
async function performLogin(
  page: Page,
  phone: string = TEST_USER_PHONE,
  password: string = TEST_USER_PASSWORD
): Promise<void> {
  // Navigate to login page
  await page.goto('/en/auth/signin');

  // Wait for the page to load and session check to complete
  await page.waitForLoadState('networkidle');

  // Check if already logged in (will show redirect message)
  const alreadyLoggedIn = await page.locator('text=You\'re already logged in').isVisible().catch(() => false);
  if (alreadyLoggedIn) {
    // Already authenticated, wait for redirect
    await page.waitForURL(/\/(en|np)(\/|$)/);
    return;
  }

  // Wait for form to be ready
  await page.waitForSelector('[id="email"], [id="phone"]', { timeout: 10000 });

  // Switch to Phone tab (login form has tabs)
  const phoneTab = page.locator('button', { hasText: 'Phone' });
  if (await phoneTab.isVisible()) {
    await phoneTab.click();
  }

  // Wait for phone form to be visible
  await page.waitForSelector('#phone', { timeout: 5000 });

  // Fill in credentials
  await page.fill('#phone', phone);
  await page.fill('#phone-password', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for successful login (redirect to homepage or dashboard)
  await page.waitForURL(/\/(en|np)(\/|$)/, { timeout: 15000 });

  // Verify we're logged in by checking session
  await page.waitForLoadState('networkidle');
}

/**
 * Logout helper function
 */
async function performLogout(page: Page): Promise<void> {
  // Navigate to homepage first
  await page.goto('/en');

  // Look for logout button in header/menu
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');

  // If there's a user menu, open it first
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Account")');
  if (await userMenu.isVisible().catch(() => false)) {
    await userMenu.click();
    await page.waitForTimeout(500);
  }

  // Click logout if visible
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/\/(en|np)(\/|$)/);
  }
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Authenticated page - logs in before each test
  authenticatedPage: async ({ page }, use) => {
    // Perform login
    await performLogin(page);

    // Provide the authenticated page to the test
    await use(page);

    // Cleanup: logout after test (optional, helps keep tests isolated)
    try {
      await performLogout(page);
    } catch {
      // Ignore logout errors in cleanup
    }
  },

  // Auth token fixture for API requests
  authToken: async ({ page }, use) => {
    // First login to get the token
    await performLogin(page);

    // Get token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || '';
    });

    await use(token);
  },

  // Manual login function
  login: async ({}, use) => {
    await use(performLogin);
  },

  // Manual logout function
  logout: async ({}, use) => {
    await use(performLogout);
  },
});

// Re-export expect from @playwright/test
export { expect };

/**
 * Helper to create an authenticated API request context
 */
export async function createAuthenticatedRequest(page: Page) {
  // Login first
  await performLogin(page);

  // Get the token
  const token = await page.evaluate(() => {
    return localStorage.getItem('token') || '';
  });

  return {
    token,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
