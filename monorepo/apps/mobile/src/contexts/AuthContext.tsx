import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../lib/api';
import { STORAGE_KEYS } from '../constants/config';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  individualVerified: boolean;
  businessVerificationStatus?: string | null;
  businessName?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { fullName: string; email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        const response = await apiClient.getMe();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Token invalid, clear it
          await apiClient.clearAuthToken();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data?.token) {
        await apiClient.setAuthToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const loginWithOtp = useCallback(async (phone: string, otp: string) => {
    try {
      const response = await apiClient.verifyOtp(phone, otp);

      if (response.success && response.data?.token) {
        await apiClient.setAuthToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'OTP verification failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const register = useCallback(async (data: { fullName: string; email: string; password: string }) => {
    try {
      const response = await apiClient.register(data);

      if (response.success && response.data?.token) {
        await apiClient.setAuthToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.clearAuthToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await apiClient.getMe();
    if (response.success && response.data) {
      setUser(response.data);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
