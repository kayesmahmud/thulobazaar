/**
 * Environment Configuration
 *
 * This file centralizes all environment-specific configuration.
 * Uses Vite's import.meta.env to access environment variables.
 *
 * Environment variables must be prefixed with VITE_ to be exposed to the client.
 * @see https://vitejs.dev/guide/env-and-mode.html
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://localhost:5000/uploads';

// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Thulobazaar';
export const APP_ENV = import.meta.env.MODE || 'development';

// Feature Flags
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
export const ENABLE_DEBUG_LOGS = import.meta.env.DEV || false;

// Error Tracking & Monitoring (Sentry)
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development';
export const SENTRY_TRACES_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0');
export const SENTRY_REPLAYS_SESSION_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1');
export const SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0');

// Analytics (Google Analytics 4)
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Default Configuration
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'ne'];

// Map Configuration
export const DEFAULT_MAP_CENTER = [27.7172, 85.3240]; // Kathmandu
export const DEFAULT_MAP_ZOOM = 13;

// File Upload Limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_AD = 5;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Validation
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;

// Development Helpers
export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';

/**
 * Log configuration (only in development)
 */
if (ENABLE_DEBUG_LOGS) {
  console.log('🔧 Environment Configuration:', {
    APP_ENV,
    API_BASE_URL,
    UPLOADS_BASE_URL,
    ENABLE_ANALYTICS,
    ENABLE_DEBUG_LOGS
  });
}
