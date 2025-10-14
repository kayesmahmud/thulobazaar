/**
 * Logger Utility
 *
 * Centralized logging system with environment-aware output
 *
 * Features:
 * - Environment-aware (respects ENABLE_DEBUG_LOGS)
 * - Multiple log levels (debug, info, warn, error)
 * - Structured logging with metadata
 * - Error tracking integration ready
 * - Performance tracking
 */

import { ENABLE_DEBUG_LOGS, isDevelopment, isProduction } from '../config/env';

// Log levels
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

// Color codes for console output
const LogColors = {
  debug: '#6366f1',    // Indigo
  info: '#3b82f6',     // Blue
  warn: '#f59e0b',     // Amber
  error: '#ef4444',    // Red
  success: '#10b981'   // Green
};

class Logger {
  constructor() {
    this.enabled = ENABLE_DEBUG_LOGS;
    this.history = [];
    this.maxHistorySize = 100;
  }

  /**
   * Format log message with metadata
   */
  formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Add to history (limited size)
   */
  addToHistory(logEntry) {
    this.history.push(logEntry);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Output to console with styling
   */
  outputToConsole(level, message, meta) {
    if (!this.enabled && level !== LogLevel.ERROR) return;

    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    const color = LogColors[level];
    const timestamp = new Date().toLocaleTimeString();

    console[level === 'debug' ? 'log' : level](
      `%c${emoji} [${timestamp}] ${level.toUpperCase()}`,
      `color: ${color}; font-weight: bold;`,
      message,
      meta && Object.keys(meta).length > 0 ? meta : ''
    );
  }

  /**
   * Send to external service (Sentry, LogRocket, etc.)
   */
  sendToService(logEntry) {
    // Send errors and warnings to Sentry
    if (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.WARN) {
      try {
        // Dynamically import to avoid errors if Sentry is not configured
        const sentry = require('./sentry');

        if (logEntry.level === LogLevel.ERROR) {
          // For errors, use captureException if we have an error object
          if (logEntry.meta.error) {
            sentry.captureException(new Error(logEntry.message), logEntry.meta);
          } else {
            sentry.captureMessage(logEntry.message, 'error', logEntry.meta);
          }
        } else {
          // For warnings, just capture the message
          sentry.captureMessage(logEntry.message, 'warning', logEntry.meta);
        }
      } catch (error) {
        // Silently fail if Sentry is not available
        if (isDevelopment) {
          console.log('Sentry not available for log entry:', logEntry);
        }
      }
    }
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    const logEntry = this.formatMessage(LogLevel.DEBUG, message, meta);
    this.addToHistory(logEntry);
    this.outputToConsole(LogLevel.DEBUG, message, meta);
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    const logEntry = this.formatMessage(LogLevel.INFO, message, meta);
    this.addToHistory(logEntry);
    this.outputToConsole(LogLevel.INFO, message, meta);
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    const logEntry = this.formatMessage(LogLevel.WARN, message, meta);
    this.addToHistory(logEntry);
    this.outputToConsole(LogLevel.WARN, message, meta);
    this.sendToService(logEntry);
  }

  /**
   * Error level logging
   */
  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : meta;

    const logEntry = this.formatMessage(LogLevel.ERROR, message, errorMeta);
    this.addToHistory(logEntry);
    this.outputToConsole(LogLevel.ERROR, message, errorMeta);
    this.sendToService(logEntry);
  }

  /**
   * Log API call
   */
  apiCall(method, url, status, duration, error = null) {
    const level = error || status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `${method} ${url} - ${status} (${duration}ms)`;

    this[level === LogLevel.ERROR ? 'error' : 'info'](message, {
      type: 'api_call',
      method,
      url,
      status,
      duration,
      error: error?.message
    });
  }

  /**
   * Log user action
   */
  userAction(action, details = {}) {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      action,
      ...details
    });
  }

  /**
   * Log performance metric
   */
  performance(metric, value, unit = 'ms') {
    this.info(`Performance: ${metric}`, {
      type: 'performance',
      metric,
      value,
      unit
    });
  }

  /**
   * Get log history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.history = [];
  }

  /**
   * Export logs (for debugging)
   */
  exportLogs() {
    const logs = JSON.stringify(this.history, null, 2);
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const logger = new Logger();

// Add to window for debugging
if (isDevelopment) {
  window.logger = logger;
}

export default logger;
