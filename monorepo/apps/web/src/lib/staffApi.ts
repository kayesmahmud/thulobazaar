// @ts-nocheck
import { createApiClient } from '@thulobazaar/api-client';
import { getSession } from 'next-auth/react';

/**
 * API Client for Staff (Editors and Super Admins)
 * Uses NextAuth session with staff roles
 */
export const staffApiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',

  // Get auth token from NextAuth session for staff
  getAuthToken: async () => {
    if (typeof window === 'undefined') return null;

    try {
      const session = await getSession();

      // For staff (editor/super_admin), return the backend token
      if (session?.user?.backendToken) {
        return session.user.backendToken;
      }

      return null;
    } catch (error) {
      console.error('Failed to get staff session token:', error);
      return null;
    }
  },

  // Handle unauthorized access - redirect to appropriate login
  onUnauthorized: () => {
    if (typeof window === 'undefined') return;

    // Try to determine if super admin or editor based on current URL
    const isSuperAdmin = window.location.pathname.includes('/super-admin');
    const redirectUrl = isSuperAdmin ? '/en/super-admin/login' : '/en/editor/login';

    window.location.href = redirectUrl;
  },
});
