// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://localhost:5000/api'  // Development
  : 'https://api.thulobazaar.com/api'; // Production

// App Colors (matching web)
export const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#dc2626',
  background: '#f9fafb',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'thulobazaar_auth_token',
  USER_DATA: 'thulobazaar_user_data',
  AD_DRAFTS: 'thulobazaar_ad_drafts',
  SEARCH_HISTORY: 'thulobazaar_search_history',
  FAVORITE_ADS: 'thulobazaar_favorites',
};

// App Info
export const APP_INFO = {
  name: 'ThuluBazaar',
  version: '1.0.0',
  description: "Nepal's Leading Classifieds Marketplace",
};
