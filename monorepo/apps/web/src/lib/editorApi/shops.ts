/**
 * Shops API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse, ReportedShop, ReportedShopsParams } from './types';

/**
 * Get reported shops for editor dashboard
 * Generic T allows callers to specify their own detailed type
 */
export async function getReportedShops<T = unknown>(
  token?: string,
  params?: ReportedShopsParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/reported-shops${queryString}`, {
    token,
    useRelativeUrl: true,
  });
}

/**
 * Dismiss a shop report (mark as false/invalid)
 */
export async function dismissShopReport(
  reportId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reported-shops/${reportId}/dismiss`, {
    method: 'POST',
    body: { reason },
    token,
    useRelativeUrl: true,
  });
}

/**
 * Suspend a shop based on a report
 */
export async function suspendShopFromReport(
  shopId: number,
  reportId: number,
  reason: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reported-shops/${reportId}/suspend`, {
    method: 'POST',
    body: { shopId, reason },
    token,
    useRelativeUrl: true,
  });
}

/**
 * Restore/unsuspend a shop that was previously suspended
 */
export async function unsuspendShopFromReport(
  shopId: number,
  reportId: number,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reported-shops/${reportId}/unsuspend`, {
    method: 'POST',
    body: { shopId },
    token,
    useRelativeUrl: true,
  });
}
