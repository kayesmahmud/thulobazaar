// @ts-nocheck
import { createApiClient } from '@thulobazaar/api-client';
import { getSession } from 'next-auth/react';

/**
 * API Client instance for the Next.js web app
 * This uses the shared @thulobazaar/api-client package
 *
 * Note: baseURL is empty string to use the same origin (Next.js API routes)
 * The api-client prepends /api to all routes, so /api/categories will hit
 * the Next.js API route at /api/categories/route.ts
 */
export const apiClient = createApiClient({
  baseURL: '',  // Use same origin - Next.js API routes

  // Get auth token from NextAuth session (client-side only)
  getAuthToken: async () => {
    if (typeof window === 'undefined') return null;

    try {
      const session = await getSession();
      return session?.user?.backendToken || null;
    } catch (error) {
      console.error('Failed to get session token:', error);
      return null;
    }
  },

  // Handle unauthorized access
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;
    window.location.href = '/en/auth/signin';
  },
});
