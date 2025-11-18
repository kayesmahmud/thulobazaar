/**
 * Activity log helpers for transforming and formatting activity data
 */

import { getRelativeTime } from './dateUtils';

export type ActivityType = 'success' | 'primary' | 'warning' | 'danger';

export interface Activity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: ActivityType;
}

export interface ActivityLog {
  action_type: string;
  admin_name?: string;
  target_type: string;
  target_id: number;
  created_at: string;
}

/**
 * Map of action types to their corresponding icons and activity types
 */
export const ACTIVITY_ICON_MAP: Record<string, { icon: string; type: ActivityType }> = {
  approve_ad: { icon: '✓', type: 'success' },
  reject_ad: { icon: '❌', type: 'danger' },
  delete_ad: { icon: '🗑️', type: 'warning' },
  restore_ad: { icon: '↩️', type: 'primary' },
  suspend_user: { icon: '🚫', type: 'warning' },
  unsuspend_user: { icon: '✓', type: 'success' },
  verify_user: { icon: '✓', type: 'success' },
  approve_business: { icon: '👔', type: 'success' },
  approve_individual: { icon: '👤', type: 'success' },
  reject_business: { icon: '❌', type: 'danger' },
  reject_individual: { icon: '❌', type: 'danger' },
  promote_editor: { icon: '⬆️', type: 'success' },
  demote_editor: { icon: '⬇️', type: 'warning' },
};

/**
 * Default icon and type for unknown action types
 */
const DEFAULT_ACTIVITY = { icon: '📋', type: 'primary' as ActivityType };

/**
 * Transforms a raw activity log from the API into the Activity interface
 * @param log - Raw activity log from API
 * @returns Formatted Activity object
 */
export const transformActivityLog = (log: ActivityLog): Activity => {
  // Get icon and type mapping, or use default
  const mapping = ACTIVITY_ICON_MAP[log.action_type] || DEFAULT_ACTIVITY;

  // Format title: "approve_ad" -> "Approve Ad"
  const title = log.action_type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

  // Format description: "Admin John approve_ad ad #123"
  const description = `${log.admin_name || 'Admin'} ${log.action_type.replace(
    /_/g,
    ' '
  )} ${log.target_type} #${log.target_id}`;

  // Calculate relative time
  const time = getRelativeTime(new Date(log.created_at));

  return {
    icon: mapping.icon,
    title,
    description,
    time,
    type: mapping.type,
  };
};

/**
 * Transforms an array of activity logs
 * @param logs - Array of raw activity logs from API
 * @returns Array of formatted Activity objects
 */
export const transformActivityLogs = (logs: ActivityLog[] | undefined | null): Activity[] => {
  // Handle undefined/null/empty cases
  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return [];
  }
  return logs.map(transformActivityLog);
};

/**
 * Formats an action type for display
 * @param actionType - Raw action type string (e.g., "approve_ad")
 * @returns Formatted string (e.g., "Approve Ad")
 */
export const formatActionType = (actionType: string): string => {
  return actionType.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase());
};

/**
 * Gets the icon for a specific action type
 * @param actionType - Raw action type string
 * @returns Icon emoji
 */
export const getActivityIcon = (actionType: string): string => {
  return ACTIVITY_ICON_MAP[actionType]?.icon || DEFAULT_ACTIVITY.icon;
};

/**
 * Gets the type (color) for a specific action type
 * @param actionType - Raw action type string
 * @returns Activity type
 */
export const getActivityType = (actionType: string): ActivityType => {
  return ACTIVITY_ICON_MAP[actionType]?.type || DEFAULT_ACTIVITY.type;
};
