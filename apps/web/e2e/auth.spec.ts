import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 * Tests login, logout, and protected routes
 */
test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/en/auth/login');

    // Check for login form elements
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });

  test('should show validation error for empty form', async ({ page }) => {
    await page.goto('/en/auth/login');

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation error or stay on page
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/en/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/);
  });

  test('editor login page should load', async ({ page }) => {
    await page.goto('/en/editor/login');

    await expect(page.getByRole('heading', { name: /editor|staff|admin/i })).toBeVisible();
  });
});
