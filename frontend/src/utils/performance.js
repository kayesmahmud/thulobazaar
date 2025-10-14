/**
 * Performance Monitoring Utility
 *
 * Tracks Core Web Vitals and custom performance metrics
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay)
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * - Custom timings
 */

import logger from './logger';
import { ENABLE_DEBUG_LOGS, isDevelopment } from '../config/env';

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.marks = new Map();
    this.isSupported = 'performance' in window && 'PerformanceObserver' in window;

    if (this.isSupported) {
      this.initializeObservers();
    }
  }

  /**
   * Initialize Performance Observers for Web Vitals
   */
  initializeObservers() {
    try {
      // Observe Largest Contentful Paint (LCP)
      if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Observe First Input Delay (FID)
      if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      }

      // Observe Cumulative Layout Shift (CLS)
      if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // Only count layout shifts without recent user input
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('CLS', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // Observe Navigation Timing
      if (PerformanceObserver.supportedEntryTypes?.includes('navigation')) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('TTFB', entry.responseStart - entry.requestStart);
            this.recordMetric('DOM Interactive', entry.domInteractive);
            this.recordMetric('DOM Complete', entry.domComplete);
            this.recordMetric('Load Complete', entry.loadEventEnd);
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
      }

      // Observe Paint Timing
      if (PerformanceObserver.supportedEntryTypes?.includes('paint')) {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric(entry.name, entry.startTime);
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
      }

    } catch (error) {
      logger.warn('Failed to initialize performance observers', { error: error.message });
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name, value) {
    this.metrics[name] = {
      value,
      timestamp: Date.now()
    };

    // Log metric
    logger.performance(name, Math.round(value), 'ms');

    // Send to analytics service
    this.sendToAnalytics(name, value);
  }

  /**
   * Send metric to analytics service
   */
  sendToAnalytics(name, value) {
    // Send Web Vitals to Google Analytics
    try {
      const analytics = require('./analytics');

      // Determine rating for Web Vitals
      const thresholds = {
        LCP: { good: 2500, needsImprovement: 4000 },
        FID: { good: 100, needsImprovement: 300 },
        CLS: { good: 0.1, needsImprovement: 0.25 },
        'first-contentful-paint': { good: 1800, needsImprovement: 3000 },
        TTFB: { good: 800, needsImprovement: 1800 }
      };

      let rating = 'good';
      if (thresholds[name]) {
        const { good, needsImprovement } = thresholds[name];
        if (value > needsImprovement) {
          rating = 'poor';
        } else if (value > good) {
          rating = 'needs-improvement';
        }
      }

      // Send to Google Analytics
      analytics.sendWebVital(name, value, rating);
    } catch (error) {
      // Silently fail if analytics is not available
      if (isDevelopment) {
        console.log('Analytics not available for metric:', name);
      }
    }
  }

  /**
   * Start a custom timing mark
   */
  mark(name) {
    if (!this.isSupported) return;

    try {
      performance.mark(`${name}-start`);
      this.marks.set(name, Date.now());
    } catch (error) {
      logger.warn(`Failed to create mark: ${name}`, { error: error.message });
    }
  }

  /**
   * End a custom timing mark and measure duration
   */
  measure(name) {
    if (!this.isSupported || !this.marks.has(name)) return;

    try {
      const startTime = this.marks.get(name);
      const duration = Date.now() - startTime;

      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      this.recordMetric(name, duration);
      this.marks.delete(name);

      return duration;
    } catch (error) {
      logger.warn(`Failed to measure: ${name}`, { error: error.message });
      return null;
    }
  }

  /**
   * Measure function execution time
   */
  async measureFunction(name, fn) {
    this.mark(name);
    try {
      const result = await fn();
      this.measure(name);
      return result;
    } catch (error) {
      this.measure(name);
      throw error;
    }
  }

  /**
   * Measure React component render time
   */
  measureRender(componentName) {
    if (!this.isSupported) return { start: () => {}, end: () => {} };

    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;

    return {
      start: () => {
        try {
          performance.mark(startMark);
        } catch (e) {
          // Ignore
        }
      },
      end: () => {
        try {
          performance.mark(endMark);
          performance.measure(`${componentName}-render`, startMark, endMark);
          const measure = performance.getEntriesByName(`${componentName}-render`)[0];
          if (measure) {
            this.recordMetric(`${componentName} Render`, measure.duration);
          }
        } catch (e) {
          // Ignore
        }
      }
    };
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Get a specific metric
   */
  getMetric(name) {
    return this.metrics[name];
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {};
    this.marks.clear();
    if (this.isSupported) {
      try {
        performance.clearMarks();
        performance.clearMeasures();
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Get Core Web Vitals summary
   */
  getWebVitalsSummary() {
    return {
      LCP: this.getMetric('LCP'),
      FID: this.getMetric('FID'),
      CLS: this.getMetric('CLS'),
      FCP: this.getMetric('first-contentful-paint'),
      TTFB: this.getMetric('TTFB')
    };
  }

  /**
   * Check if metrics meet thresholds
   */
  checkThresholds() {
    const thresholds = {
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FCP: { good: 1800, needsImprovement: 3000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };

    const results = {};
    Object.keys(thresholds).forEach((metric) => {
      const value = this.metrics[metric]?.value;
      if (value !== undefined) {
        const { good, needsImprovement } = thresholds[metric];
        results[metric] = {
          value,
          rating: value <= good ? 'good' : value <= needsImprovement ? 'needs-improvement' : 'poor'
        };
      }
    });

    return results;
  }

  /**
   * Log performance report
   */
  logReport() {
    const vitals = this.getWebVitalsSummary();
    const thresholds = this.checkThresholds();

    console.group('📊 Performance Report');
    console.table(thresholds);
    console.log('All Metrics:', this.metrics);
    console.groupEnd();

    // Log warnings for poor metrics
    Object.entries(thresholds).forEach(([metric, data]) => {
      if (data.rating === 'poor') {
        logger.warn(`Poor performance: ${metric}`, data);
      }
    });
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Add to window for debugging
if (isDevelopment) {
  window.performanceMonitor = performanceMonitor;

  // Log report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logReport();
    }, 3000);
  });
}

export default performanceMonitor;
