import { test, expect } from '@playwright/test';

/**
 * CRITICAL PATH TESTS
 *
 * These tests MUST pass before deploying to production.
 * They test the core user journeys that generate revenue/value.
 */

test.describe('Critical Paths - Must Pass Before Deploy', () => {
  // ============================================
  // HEALTH & AVAILABILITY
  // ============================================
  test('health check endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.status).toBe('healthy');
  });

  test('deep health check (with database)', async ({ request }) => {
    const response = await request.get('/api/health?deep=true');
    const health = await response.json();

    expect(health.checks.app.status).toBe('ok');
    // Database check - critical for production
    if (health.checks.database) {
      expect(health.checks.database.status).toBe('ok');
    }
  });

  // ============================================
  // CORE USER JOURNEYS
  // ============================================
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/en');
    expect(response?.status()).toBeLessThan(400);

    // Page has content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('can navigate to login page', async ({ page }) => {
    await page.goto('/en');

    // Find and click login link
    const loginLink = page.getByRole('link', { name: /login|sign in/i });
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login|auth/);
    }
  });

  test('can view ads/listings page', async ({ page }) => {
    await page.goto('/en');

    // Look for ads or browse link
    const browseLink = page.getByRole('link', { name: /browse|ads|listings|shop/i }).first();
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('can view a shop page', async ({ page }) => {
    await page.goto('/en/shops');

    // Wait for shops to load
    await page.waitForLoadState('networkidle');

    // Check page loaded
    await expect(page.locator('body')).not.toBeEmpty();
  });

  // ============================================
  // EDITOR/ADMIN ACCESS
  // ============================================
  test('editor login page loads', async ({ page }) => {
    const response = await page.goto('/en/editor/login');
    expect(response?.status()).toBeLessThan(400);
  });

  // ============================================
  // API ENDPOINTS
  // ============================================
  test('categories API responds', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect(response.ok()).toBeTruthy();
  });

  test('public API endpoints are accessible', async ({ request }) => {
    // Test critical public endpoints
    const endpoints = ['/api/health', '/api/categories'];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBeLessThan(500);
    }
  });

  // ============================================
  // SECURITY CHECKS
  // ============================================
  test('protected routes redirect to login', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/en/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login|auth/);
  });

  test('editor routes are protected', async ({ page }) => {
    // Try to access editor dashboard without auth
    await page.goto('/en/editor/dashboard');

    // Should redirect to editor login
    await expect(page).toHaveURL(/editor\/login/);
  });
});
