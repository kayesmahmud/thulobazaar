import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Homepage
 * Tests the main landing page functionality
 */
test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/en');

    // Check page title or main heading
    await expect(page).toHaveTitle(/ThuluBazaar/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/en');

    // Check for main navigation elements
    const nav = page.locator('header nav, header');
    await expect(nav).toBeVisible();
  });

  test('should navigate to shops page', async ({ page }) => {
    await page.goto('/en');

    // Find and click shops link
    const shopsLink = page.getByRole('link', { name: /shops/i });
    if (await shopsLink.isVisible()) {
      await shopsLink.click();
      await expect(page).toHaveURL(/\/shops/);
    }
  });
});
