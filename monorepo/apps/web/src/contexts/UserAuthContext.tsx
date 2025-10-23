'use client';

import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { User } from '@thulobazaar/types';

interface UserAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

interface UserAuthProviderProps {
  children: ReactNode;
}

export function UserAuthProvider({ children }: UserAuthProviderProps) {
  const { data: session, status, update } = useSession();
  const wasAuthenticated = useRef(false);

  // Convert NextAuth session to User type with backendToken
  const user: any = session?.user ? {
    id: parseInt(session.user.id),
    email: session.user.email!,
    fullName: session.user.name || '',
    phone: session.user.phone || null,
    role: session.user.role as any,
    isActive: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    avatar: session.user.image || null, // Avatar from session.user.image
    accountType: session.user.accountType as any || 'individual',
    shopSlug: session.user.shopSlug || null,
    sellerSlug: session.user.sellerSlug || null,
    businessName: session.user.businessName || null,
    businessVerificationStatus: session.user.businessVerificationStatus as any || null,
    individualVerified: session.user.individualVerified || false,
    backendToken: session.user.backendToken || null, // Add backend token
  } : null;

  // Only show user if they have 'user' role (not editor/super_admin)
  const isRegularUser = user?.role === 'user';
  const isLoading = status === 'loading';

  // Monitor session expiration and force logout
  useEffect(() => {
    if (status === 'authenticated' && session) {
      wasAuthenticated.current = true;
    }

    // If was authenticated but now session is null (expired), force logout
    if (wasAuthenticated.current && status === 'unauthenticated' && !session) {
      console.log('🔐 [UserAuth] Session expired, logging out...');
      signOut({ redirect: true, callbackUrl: '/en/auth/login' });
      wasAuthenticated.current = false;
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return {
          success: false,
          error: result.error || 'Login failed. Please check your credentials.'
        };
      }

      if (result?.ok) {
        // Check if user has correct role after sign in
        await update(); // Refresh the session

        // Wait a moment for session to update
        await new Promise(resolve => setTimeout(resolve, 100));

        return { success: true };
      }

      return {
        success: false,
        error: 'Login failed. Please check your credentials.'
      };
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      await update();
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: UserAuthContextType = {
    user: isRegularUser ? user : null,
    isLoading,
    isAuthenticated: isRegularUser && !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
