/**
 * Dashboard constants and configuration values
 */

/**
 * Number of recent activity items to fetch and display
 */
export const RECENT_ACTIVITY_LIMIT = 10;

/**
 * Maximum number of quick action buttons to display
 */
export const MAX_QUICK_ACTIONS = 4;

/**
 * Time periods for chart filters
 */
export const CHART_TIME_PERIODS = {
  LAST_7_DAYS: '7',
  LAST_30_DAYS: '30',
  LAST_90_DAYS: '90',
} as const;

/**
 * Default chart time period
 */
export const DEFAULT_CHART_PERIOD = CHART_TIME_PERIODS.LAST_7_DAYS;

/**
 * Chart height in pixels
 */
export const CHART_HEIGHT = 250;

/**
 * Chart color palette for superadmin theme
 */
export const SUPERADMIN_CHART_COLORS = {
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  fillOpacity: 'rgba(99, 102, 241, 0.1)',
} as const;

/**
 * Polling interval for dashboard data refresh (in milliseconds)
 * Set to 0 to disable auto-refresh
 */
export const DASHBOARD_REFRESH_INTERVAL = 0; // 5 minutes = 300000

/**
 * Number of stats cards to display per row on different screen sizes
 */
export const STATS_GRID_COLS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
} as const;
