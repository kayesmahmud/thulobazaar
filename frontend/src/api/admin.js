/**
 * Admin API
 *
 * Handles all admin and editor operations
 */

import { get, put, del } from './client.js';

/**
 * Get admin stats
 */
export async function getAdminStats() {
  const data = await get('/admin/stats', false, true);
  return data.data;
}

/**
 * Get admin ads
 */
export async function getAdminAds(status = 'all') {
  const params = status !== 'all' ? `?status=${status}` : '';
  const data = await get(`/admin/ads${params}`, false, true);
  return data.data;
}

/**
 * Get admin users
 */
export async function getAdminUsers() {
  const data = await get('/admin/users', false, true);
  return data.data;
}

/**
 * Update ad status
 */
export async function updateAdStatus(adId, status, reason = '') {
  const data = await put(`/admin/ads/${adId}/status`, { status, reason }, false, true);
  return data.data;
}

/**
 * Get editor stats
 */
export async function getEditorStats() {
  const data = await get('/admin/stats', false, true);
  return data.data;
}

/**
 * Get editor ads
 */
export async function getEditorAds(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const data = await get(`/admin/ads${params ? `?${params}` : ''}`, false, true);
  return data;
}

/**
 * Get editor users
 */
export async function getEditorUsers(filters = {}) {
  const data = await get('/admin/users', false, true);
  return data;
}

/**
 * Get activity logs
 * TODO: Implement backend
 */
export async function getActivityLogs(params = {}) {
  return { success: true, data: [] };
}

/**
 * Approve ad
 */
export async function approveAd(adId) {
  const data = await put(`/admin/ads/${adId}/status`, { status: 'active' }, false, true);
  return data;
}

/**
 * Reject ad
 */
export async function rejectAd(adId, reason) {
  const data = await put(`/admin/ads/${adId}/status`, { status: 'rejected', reason }, false, true);
  return data;
}

/**
 * Editor delete ad
 */
export async function editorDeleteAd(adId, reason) {
  const data = await del(`/admin/ads/${adId}`, false, true);
  return data;
}

/**
 * Restore ad
 * TODO: Implement backend
 */
export async function restoreAd(adId) {
  return { success: true };
}

/**
 * Bulk action ads
 * TODO: Implement backend
 */
export async function bulkActionAds(action, adIds, reason) {
  return { success: true };
}

/**
 * Suspend user
 * TODO: Implement backend
 */
export async function suspendUser(userId, reason, duration) {
  return { success: true };
}

/**
 * Unsuspend user
 * TODO: Implement backend
 */
export async function unsuspendUser(userId) {
  return { success: true };
}

/**
 * Verify user
 * TODO: Implement backend
 */
export async function verifyUser(userId) {
  return { success: true };
}

// Default export
export default {
  getAdminStats,
  getAdminAds,
  getAdminUsers,
  updateAdStatus,
  getEditorStats,
  getEditorAds,
  getEditorUsers,
  getActivityLogs,
  approveAd,
  rejectAd,
  editorDeleteAd,
  restoreAd,
  bulkActionAds,
  suspendUser,
  unsuspendUser,
  verifyUser
};
