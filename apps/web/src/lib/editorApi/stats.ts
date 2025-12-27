/**
 * Stats & Dashboard API Functions
 */

import { apiRequest } from './client';
import type {
  ApiResponse,
  DashboardStats,
  MyWorkToday,
  NotificationsCount,
  SystemAlert,
  AvgResponseTime,
  AvgResponseTimeTrend,
  Trends,
  SupportChatCount,
} from './types';

/**
 * Get editor dashboard statistics
 */
export async function getEditorStats(token?: string): Promise<ApiResponse<DashboardStats>> {
  return apiRequest<ApiResponse<DashboardStats>>('/api/editor/stats', { token });
}

/**
 * Get editor's work statistics for today
 */
export async function getMyWorkToday(token?: string): Promise<ApiResponse<MyWorkToday>> {
  return apiRequest<ApiResponse<MyWorkToday>>('/api/editor/my-work-today', { token });
}

/**
 * Get notifications count with breakdown
 */
export async function getNotificationsCount(token?: string): Promise<ApiResponse<NotificationsCount>> {
  return apiRequest<ApiResponse<NotificationsCount>>('/api/editor/notifications/count', { token });
}

/**
 * Get system alerts (most urgent alert)
 */
export async function getSystemAlerts(token?: string): Promise<ApiResponse<SystemAlert | null>> {
  return apiRequest<ApiResponse<SystemAlert | null>>('/api/editor/system-alerts', { token });
}

/**
 * Get average response time
 */
export async function getAvgResponseTime(token?: string): Promise<ApiResponse<AvgResponseTime>> {
  return apiRequest<ApiResponse<AvgResponseTime>>('/api/editor/avg-response-time', { token });
}

/**
 * Get average response time trend (improvement percentage)
 */
export async function getAvgResponseTimeTrend(token?: string): Promise<ApiResponse<AvgResponseTimeTrend>> {
  return apiRequest<ApiResponse<AvgResponseTimeTrend>>('/api/editor/avg-response-time/trend', { token });
}

/**
 * Get trends (percentage changes for pending items)
 */
export async function getTrends(token?: string): Promise<ApiResponse<Trends>> {
  return apiRequest<ApiResponse<Trends>>('/api/editor/trends', { token });
}

/**
 * Get support chat count (unresolved messages)
 */
export async function getSupportChatCount(token?: string): Promise<ApiResponse<SupportChatCount>> {
  return apiRequest<ApiResponse<SupportChatCount>>('/api/editor/support-chat/count', { token });
}
