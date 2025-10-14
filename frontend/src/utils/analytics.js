/**
 * Google Analytics 4 Integration
 *
 * Handles Google Analytics tracking for:
 * - Page views
 * - User events
 * - Core Web Vitals (performance metrics)
 * - Custom events
 */

import { GA_MEASUREMENT_ID, isDevelopment, ENABLE_ANALYTICS } from '../config/env.js';

/**
 * Initialize Google Analytics 4
 * Loads the gtag script and configures GA
 */
export function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || !ENABLE_ANALYTICS) {
    if (isDevelopment) {
      console.log('ℹ️ Google Analytics not configured or disabled');
    }
    return;
  }

  try {
    // Create script tag for gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Configure GA
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: true,
      anonymize_ip: true, // GDPR compliance
    });

    if (isDevelopment) {
      console.log('✅ Google Analytics initialized:', GA_MEASUREMENT_ID);
    }
  } catch (error) {
    console.error('❌ Failed to initialize Google Analytics:', error);
  }
}

/**
 * Send page view to Google Analytics
 */
export function trackPageView(path) {
  if (!window.gtag) return;

  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });

    if (isDevelopment) {
      console.log('📊 GA Page View:', path);
    }
  } catch (error) {
    console.error('❌ Failed to track page view:', error);
  }
}

/**
 * Send custom event to Google Analytics
 */
export function trackEvent(eventName, eventParams = {}) {
  if (!window.gtag) return;

  try {
    window.gtag('event', eventName, eventParams);

    if (isDevelopment) {
      console.log('📊 GA Event:', eventName, eventParams);
    }
  } catch (error) {
    console.error('❌ Failed to track event:', error);
  }
}

/**
 * Send Web Vital metric to Google Analytics
 * Format compatible with Google's Web Vitals recommendations
 */
export function sendWebVital(name, value, rating) {
  if (!window.gtag) return;

  try {
    window.gtag('event', name, {
      value: Math.round(value), // Round to integer
      metric_id: name,
      metric_value: Math.round(value),
      metric_rating: rating, // 'good', 'needs-improvement', or 'poor'
      event_category: 'Web Vitals',
    });

    if (isDevelopment) {
      console.log(`📊 GA Web Vital: ${name} = ${Math.round(value)}ms (${rating})`);
    }
  } catch (error) {
    console.error('❌ Failed to send Web Vital:', error);
  }
}

/**
 * Track user interaction
 */
export function trackUserInteraction(action, category, label, value) {
  trackEvent('user_interaction', {
    action,
    category,
    label,
    value,
  });
}

/**
 * Track ad view
 */
export function trackAdView(adId, adTitle) {
  trackEvent('view_item', {
    item_id: adId,
    item_name: adTitle,
    item_category: 'Ad',
  });
}

/**
 * Track search
 */
export function trackSearch(searchTerm, category, location) {
  trackEvent('search', {
    search_term: searchTerm,
    category,
    location,
  });
}

/**
 * Track ad post attempt
 */
export function trackAdPost(success, category, error = null) {
  trackEvent('post_ad', {
    success,
    category,
    error: error?.message || null,
  });
}

/**
 * Track user login
 */
export function trackLogin(method = 'email') {
  trackEvent('login', {
    method,
  });
}

/**
 * Track user signup
 */
export function trackSignup(method = 'email') {
  trackEvent('sign_up', {
    method,
  });
}

/**
 * Set user properties (for logged-in users)
 * Only stores non-PII data
 */
export function setUserProperties(userId, properties = {}) {
  if (!window.gtag) return;

  try {
    window.gtag('set', 'user_properties', {
      user_id: userId,
      ...properties,
    });

    if (isDevelopment) {
      console.log('📊 GA User Properties:', userId, properties);
    }
  } catch (error) {
    console.error('❌ Failed to set user properties:', error);
  }
}

// Export default
export default {
  init: initGoogleAnalytics,
  trackPageView,
  trackEvent,
  sendWebVital,
  trackUserInteraction,
  trackAdView,
  trackSearch,
  trackAdPost,
  trackLogin,
  trackSignup,
  setUserProperties,
};
