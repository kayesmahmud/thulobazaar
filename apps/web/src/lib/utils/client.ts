/**
 * Client-safe utils exports
 * Use this file in client components ('use client')
 *
 * Server components should use '@/lib/utils' for full functionality
 */

// Date utilities (browser-safe)
export {
  getRelativeTime,
  formatDate,
  formatDateTime,
  isToday,
  isWithinDays,
} from './date';

// Console filter (browser-safe)
export {
  initConsoleFilter,
  removeConsoleFilter,
} from './console';
