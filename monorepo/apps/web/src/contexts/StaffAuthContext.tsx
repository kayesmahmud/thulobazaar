// @ts-nocheck
'use client';

import { createContext, useContext, ReactNode, useEffect, useRef, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { User } from '@thulobazaar/types';

interface StaffAuthContextType {
  staff: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(undefined);

interface StaffAuthProviderProps {
  children: ReactNode;
}

export function StaffAuthProvider({ children }: StaffAuthProviderProps) {
  const { data: session, status, update } = useSession();
  const wasAuthenticated = useRef(false);

  // Convert NextAuth session to User type with backendToken
  // Memoized to prevent unnecessary re-renders
  const user: any = useMemo(() => {
    if (!session?.user) return null;

    // Use session timestamps if available, otherwise use null (not new Date() which is impure)
    const sessionTimestamp = session.user.createdAt || null;

    return {
      id: parseInt(session.user.id),
      email: session.user.email!,
      fullName: session.user.name || '',
      phone: session.user.phone || null,
      role: session.user.role as any,
      isActive: true,
      isVerified: false,
      createdAt: sessionTimestamp,
      updatedAt: sessionTimestamp,
      avatar: session.user.image || null, // Avatar from session.user.image
      accountType: session.user.accountType as any || 'individual',
      shopSlug: session.user.shopSlug || null,
      sellerSlug: session.user.sellerSlug || null,
      businessName: session.user.businessName || null,
      businessVerificationStatus: session.user.businessVerificationStatus as any || null,
      individualVerified: session.user.individualVerified || false,
      lastLogin: session.user.lastLogin || null, // Previous login time from session
      backendToken: session.user.backendToken || null, // Add backend token
    };
  }, [session?.user]);

  // Only show staff if they have editor or super_admin role
  const isStaff = user && ['editor', 'super_admin'].includes(user.role);
  const isLoading = status === 'loading';

  // Monitor session expiration and force logout
  useEffect(() => {
    if (status === 'authenticated' && session && isStaff) {
      wasAuthenticated.current = true;
    }

    // If was authenticated but now session is null (expired), force logout
    if (wasAuthenticated.current && status === 'unauthenticated' && !session) {
      console.log('🔐 [StaffAuth] Session expired, logging out...');
      // Redirect based on role - super_admin goes to super-admin login, editors to editor login
      const redirectUrl = user?.role === 'super_admin' ? '/en/super-admin/login' : '/en/editor/login';
      signOut({ redirect: true, callbackUrl: redirectUrl });
      wasAuthenticated.current = false;
    }
  }, [session, status, isStaff, user]);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode: twoFactorCode || '',
        redirect: false,
      });

      if (result?.error) {
        return {
          success: false,
          error: result.error || 'Login failed. Please check your credentials.'
        };
      }

      if (result?.ok) {
        // Refresh the session to get user data
        await update();

        // Wait a moment for session to update
        await new Promise(resolve => setTimeout(resolve, 100));

        return { success: true };
      }

      return {
        success: false,
        error: 'Login failed. Please check your credentials.'
      };
    } catch (error) {
      console.error('Staff login error:', error);
      return {
        success: false,
        error: 'An error occurred during login. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Staff logout error:', error);
    }
  };

  const refreshStaff = async () => {
    try {
      await update();
    } catch (error) {
      console.error('Failed to refresh staff:', error);
    }
  };

  const staff = isStaff ? user : null;

  const value: StaffAuthContextType = {
    staff,
    isLoading,
    isAuthenticated: !!staff,
    isAdmin: staff?.role === 'super_admin', // Kept for backwards compatibility
    isEditor: staff?.role === 'editor',
    isSuperAdmin: staff?.role === 'super_admin',
    login,
    logout,
    refreshStaff,
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
