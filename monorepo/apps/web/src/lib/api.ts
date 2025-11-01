// @ts-nocheck
import { createApiClient } from '@thulobazaar/api-client';
import { getSession } from 'next-auth/react';

/**
 * API Client instance for the Next.js web app
 * This uses the shared @thulobazaar/api-client package
 */
export const apiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',

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
    window.location.href = '/en/auth/login';
  },
});
