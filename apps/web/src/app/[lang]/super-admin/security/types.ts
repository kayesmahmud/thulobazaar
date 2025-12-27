export type TimeRange = '1h' | '24h' | '7d' | '30d';
export type ActiveTab = 'overview' | 'logs' | 'sessions' | 'events';

export interface FailedLogin {
  email: string;
  ipAddress: string | null;
  timestamp: string;
  reason: string;
}

export interface TopIpAddress {
  ip_address: string;
  unique_users: number;
  request_count: number;
}

export interface ActionTypeStat {
  action_type: string;
  count: number;
}

export interface ActivityLog {
  id: number;
  adminName: string;
  adminEmail: string;
  actionType: string;
  targetType: string;
  targetId: number;
  ipAddress: string | null;
  timestamp: string;
}

export interface ActiveSession {
  userId: number;
  fullName: string;
  email: string;
  avatar: string | null;
  role: string;
  lastActivity: string;
}

export interface SecurityEvent {
  id: number;
  actionType: string;
  adminName: string;
  ipAddress: string | null;
  timestamp: string;
}

export interface SecurityOverview {
  failedLogins: {
    last_24h: number;
    unique_users: number;
  };
  successfulLogins: number;
  twoFactorAuth: {
    enabled: number;
    total: number;
  };
  suspensions: {
    last_24h: number;
    total: number;
  };
}

export interface ActivityPagination {
  page: number;
  totalPages: number;
  total: number;
}

export interface AuditData {
  securityOverview: SecurityOverview;
  failedLoginAttempts: FailedLogin[];
  topIpAddresses: TopIpAddress[];
  actionTypeStats: ActionTypeStat[];
  activityLogs: ActivityLog[];
  activeSessions: ActiveSession[];
  securityEvents: SecurityEvent[];
  activityPagination: ActivityPagination;
}

export const TAB_CONFIG = [
  { id: 'overview' as const, label: 'Overview', icon: '📊' },
  { id: 'logs' as const, label: 'Activity Logs', icon: '📋' },
  { id: 'sessions' as const, label: 'Active Sessions', icon: '👥' },
  { id: 'events' as const, label: 'Security Events', icon: '🔐' },
];

export const TIME_RANGE_OPTIONS = [
  { value: '1h' as const, label: 'Last Hour' },
  { value: '24h' as const, label: 'Last 24 Hours' },
  { value: '7d' as const, label: 'Last 7 Days' },
  { value: '30d' as const, label: 'Last 30 Days' },
];

export function getActionTypeColor(actionType: string): string {
  if (actionType.includes('failed') || actionType.includes('error')) return 'text-red-600 bg-red-50';
  if (actionType.includes('delete') || actionType.includes('suspend')) return 'text-orange-600 bg-orange-50';
  if (actionType.includes('create') || actionType.includes('approve')) return 'text-green-600 bg-green-50';
  if (actionType.includes('update') || actionType.includes('edit')) return 'text-blue-600 bg-blue-50';
  return 'text-gray-600 bg-gray-50';
}

export function getEventIcon(actionType: string): string {
  if (actionType.includes('2fa')) return '🔐';
  if (actionType.includes('suspend')) return '⛔';
  if (actionType.includes('delete')) return '🗑️';
  if (actionType.includes('create')) return '✨';
  return '📝';
}
