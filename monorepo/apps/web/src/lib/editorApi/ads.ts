/**
 * Ads API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse, Ad, GetAdsParams, ReportedAdsParams, ReportedAdsCount } from './types';

/**
 * Get ads with filters
 */
export async function getAds(
  params?: GetAdsParams,
  token?: string
): Promise<ApiResponse<Ad[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<Ad[]>>(`/api/editor/ads${queryString}`, { token });
}

/**
 * Approve an ad
 */
export async function approveAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/status`, {
    method: 'PUT',
    body: { status: 'approved' },
    token,
  });
}

/**
 * Reject an ad
 */
export async function rejectAd(
  adId: number,
  reason: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/status`, {
    method: 'PUT',
    body: { status: 'rejected', rejection_reason: reason },
    token,
  });
}

/**
 * Delete an ad (soft delete)
 */
export async function deleteAd(
  adId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}`, {
    method: 'DELETE',
    body: { reason },
    token,
  });
}

/**
 * Restore a soft-deleted ad
 */
export async function restoreAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/restore`, {
    method: 'POST',
    token,
  });
}

/**
 * Suspend an ad with reason and optional duration
 */
export async function suspendAd(
  adId: number,
  reason: string,
  duration?: number,
  token?: string
): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/suspend`, {
    method: 'POST',
    body: { reason, duration },
    token,
  });
}

/**
 * Unsuspend an ad
 */
export async function unsuspendAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  return apiRequest<ApiResponse<Ad>>(`/api/editor/ads/${adId}/unsuspend`, {
    method: 'POST',
    token,
  });
}

/**
 * Permanently delete an ad (cannot be undone)
 */
export async function permanentDeleteAd(
  adId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<void>> {
  return apiRequest<ApiResponse<void>>(`/api/editor/ads/${adId}/permanent`, {
    method: 'DELETE',
    body: { reason },
    token,
  });
}

/**
 * Get reported ads
 * Generic T allows callers to specify their own detailed type
 */
export async function getReportedAds<T = unknown>(
  token?: string,
  params?: ReportedAdsParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/reported-ads${queryString}`, { token });
}

/**
 * Get pending reported ads count
 */
export async function getReportedAdsCount(token?: string): Promise<ApiResponse<ReportedAdsCount>> {
  return apiRequest<ApiResponse<ReportedAdsCount>>('/api/editor/reported-ads/count', { token });
}

/**
 * Dismiss a report (mark as false/invalid)
 */
export async function dismissReport(
  reportId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<unknown>> {
  return apiRequest<ApiResponse<unknown>>(`/api/editor/reports/${reportId}/dismiss`, {
    method: 'POST',
    body: { reason },
    token,
  });
}
