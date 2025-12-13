/**
 * Console filter to suppress NextAuth session logs in development
 * This prevents the browser console from being flooded with session objects
 */

// Store original console methods
const originalLog = console.log;
const originalInfo = console.info;
const originalDebug = console.debug;
const originalError = console.error;
const originalWarn = console.warn;

/**
 * Check if an argument is a NextAuth session object
 */
function isSessionObject(arg: any): boolean {
  if (!arg || typeof arg !== 'object') return false;

  // Check for NextAuth session structure: { user: {...}, expires: "..." }
  if ('user' in arg && 'expires' in arg && typeof arg.expires === 'string') {
    return true;
  }

  return false;
}

/**
 * Filter function that suppresses session-related logs
 */
function createFilteredLogger(originalMethod: any) {
  return function (...args: any[]) {
    // Skip if any argument is a session object
    if (args.some(arg => isSessionObject(arg))) {
      return;
    }

    // Skip if the log message contains session-related keywords
    const firstArg = args[0];
    if (typeof firstArg === 'string') {
      const lowerCaseMsg = firstArg.toLowerCase();
      if (
        lowerCaseMsg.includes('[nextauth]') ||
        lowerCaseMsg.includes('[next-auth]') ||
        lowerCaseMsg.includes('client_fetch_error') ||
        (lowerCaseMsg.includes('session') && lowerCaseMsg.includes('expires'))
      ) {
        return;
      }
    }

    // Call original method for non-session logs
    originalMethod.apply(console, args);
  };
}

/**
 * Apply console filters in development mode only
 */
export function initConsoleFilter() {
  if (process.env.NODE_ENV === 'development') {
    console.log = createFilteredLogger(originalLog);
    console.info = createFilteredLogger(originalInfo);
    console.debug = createFilteredLogger(originalDebug);
    console.error = createFilteredLogger(originalError);
    console.warn = createFilteredLogger(originalWarn);

    // Log once that filter is active
    originalLog('🔇 [Console Filter] NextAuth logs suppressed in development');
  }
}

/**
 * Restore original console methods
 */
export function removeConsoleFilter() {
  console.log = originalLog;
  console.info = originalInfo;
  console.debug = originalDebug;
  console.error = originalError;
  console.warn = originalWarn;
}
