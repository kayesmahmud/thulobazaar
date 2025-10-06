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



        // Only load regular user data in AuthContext
        // Editor/Admin data should only be used in editor/admin pages
        if (userToken && userData) {
          // For regular users, verify token with profile API
          const profile = await ApiService.getProfile();
          setUser(profile);
        } else {
          // No stored auth data found
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
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

      // Store token
      localStorage.setItem('authToken', result.token);

      // Fetch full profile to ensure all data is up-to-date
      const profile = await ApiService.getProfile();
      
      // Store complete user data
      localStorage.setItem('userData', JSON.stringify(profile));
      setUser(profile);

      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      // Don't set loading to true during registration - prevents page shake
      // Loading state is only for initial auth check on app startup
      const result = await ApiService.register(userData);

      // Store token
      localStorage.setItem('authToken', result.token);

      // Fetch full profile to ensure all data is up-to-date
      const profile = await ApiService.getProfile();

      // Store complete user data
      localStorage.setItem('userData', JSON.stringify(profile));
      setUser(profile);

      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('editorToken');
    localStorage.removeItem('editorData');
    setUser(null);
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