/**
 * Sentry Error Tracking Initialization
 *
 * Configures Sentry for error tracking, performance monitoring, and session replay
 *
 * Features:
 * - Automatic error capture
 * - Performance monitoring with traces
 * - Session replay for debugging
 * - User context tracking
 * - Breadcrumb tracking
 */

import * as Sentry from '@sentry/react';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
  SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
  SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
  APP_NAME,
  isDevelopment,
  isProduction
} from '../config/env.js';

/**
 * Initialize Sentry
 * Only initializes if DSN is configured
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    if (isDevelopment) {
      console.log('ℹ️ Sentry DSN not configured - error tracking disabled');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,

      // Performance Monitoring
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration({
          // Set sampling rate for performance/tracing
          // 1.0 = 100% of transactions, 0.1 = 10%
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/[^/]*\.thulobazaar\.com\.np/
          ],
        }),

        // Session replay for visual debugging
        Sentry.replayIntegration({
          maskAllText: true,  // Mask all text for privacy
          blockAllMedia: true, // Block images/videos for privacy
        }),
      ],

      // Set tracesSampleRate to capture % of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,

      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^/]*\.thulobazaar\.com\.np/
      ],

      // Capture Replay for 10% of all sessions,
      // plus 100% of sessions with an error
      replaysSessionSampleRate: SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      replaysOnErrorSampleRate: SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,

      // Release tracking
      release: `${APP_NAME}@${import.meta.env.VITE_APP_VERSION || 'dev'}`,

      // Additional configuration
      beforeSend(event, hint) {
        // Filter out errors in development if needed
        if (isDevelopment) {
          console.log('🔍 Sentry Event:', event);
        }

        // Don't send errors for certain patterns
        if (event.exception) {
          const exceptionValue = event.exception.values?.[0]?.value;

          // Filter out common non-critical errors
          if (
            exceptionValue?.includes('ResizeObserver') ||
            exceptionValue?.includes('Non-Error promise rejection')
          ) {
            return null; // Don't send to Sentry
          }
        }

        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors
        'NetworkError',
        'Failed to fetch',

        // Common non-critical errors
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],
    });

    if (isDevelopment) {
      console.log('✅ Sentry initialized successfully');
      console.log(`   Environment: ${SENTRY_ENVIRONMENT}`);
      console.log(`   Traces Sample Rate: ${SENTRY_TRACES_SAMPLE_RATE * 100}%`);
      console.log(`   Session Replay Rate: ${SENTRY_REPLAYS_SESSION_SAMPLE_RATE * 100}%`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Set user context for Sentry
 * Call this after user logs in
 */
export function setSentryUser(user) {
  if (!SENTRY_DSN) return;

  try {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.full_name || user.email,
    });
  } catch (error) {
    console.error('❌ Failed to set Sentry user:', error);
  }
}

/**
 * Clear user context from Sentry
 * Call this after user logs out
 */
export function clearSentryUser() {
  if (!SENTRY_DSN) return;

  try {
    Sentry.setUser(null);
  } catch (error) {
    console.error('❌ Failed to clear Sentry user:', error);
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error, context = {}) {
  if (!SENTRY_DSN) {
    if (isDevelopment) {
      console.error('Manual exception capture:', error, context);
    }
    return;
  }

  try {
    Sentry.captureException(error, {
      extra: context
    });
  } catch (err) {
    console.error('❌ Failed to capture exception:', err);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!SENTRY_DSN) {
    if (isDevelopment) {
      console.log(`Manual message capture (${level}):`, message, context);
    }
    return;
  }

  try {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  } catch (error) {
    console.error('❌ Failed to capture message:', error);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category = 'custom', data = {}) {
  if (!SENTRY_DSN) return;

  try {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  } catch (error) {
    console.error('❌ Failed to add breadcrumb:', error);
  }
}

// Export Sentry for direct access if needed
export { Sentry };

// Export default
export default {
  init: initSentry,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  captureException,
  captureMessage,
  addBreadcrumb,
  Sentry
};
