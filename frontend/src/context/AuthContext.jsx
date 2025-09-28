import { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        console.log('🔍 AuthContext init check:', {
          hasToken: !!token,
          hasUserData: !!userData
        });

        if (token && userData) {
          console.log('🔄 Verifying token with profile API...');
          // Verify token is still valid by fetching profile
          const profile = await ApiService.getProfile();
          setUser(profile);
          console.log('✅ User authenticated from localStorage:', profile);
        } else {
          console.log('ℹ️ No stored auth data found');
        }
      } catch (error) {
        console.log('❌ Authentication check failed:', error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await ApiService.login(email, password);

      // Store token and user data
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));

      setUser(result.user);
      console.log('✅ User logged in:', result.user);

      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const result = await ApiService.register(userData);

      // Store token and user data
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));

      setUser(result.user);
      console.log('✅ User registered:', result.user);

      return result;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    console.log('✅ User logged out');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: !!user && user.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};