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
        const userToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        const editorToken = localStorage.getItem('editorToken');
        const editorData = localStorage.getItem('editorData');

        console.log('🔍 AuthContext init check:', {
          hasUserToken: !!userToken,
          hasUserData: !!userData,
          hasEditorToken: !!editorToken,
          hasEditorData: !!editorData
        });

        // Only load regular user data in AuthContext
        // Editor/Admin data should only be used in editor/admin pages
        if (userToken && userData) {
          // For regular users, verify token with profile API
          console.log('🔄 Verifying regular user token with profile API...');
          const profile = await ApiService.getProfile();
          setUser(profile);
          console.log('✅ User authenticated from localStorage:', profile);
        } else {
          console.log('ℹ️ No stored auth data found');
        }
      } catch (error) {
        console.log('❌ Authentication check failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('editorToken');
        localStorage.removeItem('editorData');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // Don't set loading to true during login - prevents page shake
      // Loading state is only for initial auth check on app startup
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
      // Don't set loading to true during registration - prevents page shake
      // Loading state is only for initial auth check on app startup
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
    localStorage.removeItem('editorToken');
    localStorage.removeItem('editorData');
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
    isAdmin: !!user && user.role === 'super_admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};