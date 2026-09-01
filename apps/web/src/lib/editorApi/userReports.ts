/**
 * User Reports API Functions (chat/message reports)
 * Endpoints live on the Express backend (API_BASE), mirroring reported-ads.
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse } from './types';

export interface ReportedUsersParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Get reported users for editor dashboard
 */
export async function getReportedUsers<T = unknown>(
  token?: string,
  params?: ReportedUsersParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/reported-users${queryString}`, { token });
}

/**
 * Dismiss a user report (no violation found)
 */
export async function dismissUserReport(
  reportId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reported-users/${reportId}/dismiss`, {
    method: 'POST',
    body: { reason },
    token,
  });
}

/**
 * Resolve a user report, optionally suspending the reported user
 */
export async function resolveUserReport(
  reportId: number,
  reason: string,
  suspend: boolean,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reported-users/${reportId}/resolve`, {
    method: 'POST',
    body: { reason, suspend },
    token,
  });
}
