/**
 * Editor API Service
 * Handles all API calls for editor dashboard and management
 */

import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get backend token from session or localStorage
 * Checks both NextAuth session (for users) and localStorage (for editors/admins)
 */
async function getBackendToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // First check localStorage for editor token (staff auth)
  const editorToken = localStorage.getItem('editorToken');
  if (editorToken) {
    return editorToken;
  }

  // Fallback to NextAuth session (for regular users)
  const session = await getSession();
  return session?.user?.backendToken || null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  pendingVerifications: number;
}

interface ActivityLog {
  id: number;
  action_type: string;
  target_type: string;
  target_id: number;
  details: any;
  ip_address: string;
  created_at: string;
  admin_name: string;
  admin_email: string;
}

interface Verification {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  type: 'business' | 'individual';
  // Business fields
  business_name?: string;
  business_license_document?: string;
  business_category?: string;
  business_description?: string;
  // Individual fields
  full_name?: string;
  id_document_type?: string;
  id_document_number?: string;
  id_document_front?: string;
  id_document_back?: string;
  selfie_with_id?: string;
  // Common fields
  email: string;
  // Payment and duration fields
  duration_days?: number;
  payment_amount?: number;
  payment_reference?: string;
  payment_status?: string; // 'free' | 'paid' | 'pending'
}

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name: string;
  location_name: string;
  seller_name: string;
  seller_email: string;
  reviewer_name: string | null;
}

/**
 * Get editor dashboard statistics
 */
export async function getEditorStats(token?: string): Promise<ApiResponse<DashboardStats>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/stats`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch editor stats');
  }

  return response.json();
}

/**
 * Get editor activity logs
 */
export async function getActivityLogs(
  token?: string,
  params?: {
    adminId?: number;
    actionType?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<ActivityLog[]>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const queryParams = new URLSearchParams();

  if (params?.adminId) queryParams.append('adminId', params.adminId.toString());
  if (params?.actionType) queryParams.append('actionType', params.actionType);
  if (params?.targetType) queryParams.append('targetType', params.targetType);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}/api/editor/activity-logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }

  return response.json();
}

/**
 * Get verifications with optional filters
 * Uses Next.js API routes (relative URL) instead of Express backend
 *
 * @param status - 'pending' | 'rejected' | 'approved' | 'all' (default: 'pending')
 * @param type - 'individual' | 'business' | 'all' (default: 'all')
 * @param token - Optional auth token
 */
export async function getVerifications(
  status: 'pending' | 'rejected' | 'approved' | 'all' = 'pending',
  type: 'individual' | 'business' | 'all' = 'all',
  token?: string
): Promise<ApiResponse<Verification[]>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Use relative URL for Next.js API routes with query params
  const params = new URLSearchParams();
  params.set('status', status);
  params.set('type', type);

  const response = await fetch(`/api/admin/verifications?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch verifications');
  }

  return response.json();
}

/**
 * Get all pending verifications (legacy function for backwards compatibility)
 * Uses Next.js API routes (relative URL) instead of Express backend
 */
export async function getPendingVerifications(token?: string): Promise<ApiResponse<Verification[]>> {
  return getVerifications('pending', 'all', token);
}

/**
 * Generic verification action handler
 * Consolidates approve/reject logic for both business and individual verifications
 *
 * @param type - 'business' | 'individual'
 * @param verificationId - The verification request ID
 * @param action - 'approve' | 'reject'
 * @param reason - Required for reject action
 * @param token - Optional auth token
 */
export async function handleVerificationAction(
  type: 'business' | 'individual',
  verificationId: number,
  action: 'approve' | 'reject',
  reason?: string,
  token?: string
): Promise<ApiResponse<any>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(
    `/api/admin/verifications/${type}/${verificationId}/${action}`,
    {
      method: 'POST',
      headers,
      body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to ${action} ${type} verification`);
  }

  return response.json();
}

// Backwards-compatible wrapper functions
export const approveBusinessVerification = (verificationId: number, token?: string) =>
  handleVerificationAction('business', verificationId, 'approve', undefined, token);

export const rejectBusinessVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('business', verificationId, 'reject', reason, token);

export const approveIndividualVerification = (verificationId: number, token?: string) =>
  handleVerificationAction('individual', verificationId, 'approve', undefined, token);

export const rejectIndividualVerification = (verificationId: number, reason: string, token?: string) =>
  handleVerificationAction('individual', verificationId, 'reject', reason, token);

/**
 * Get ads with filters
 */
export async function getAds(
  token?: string,
  params?: {
    status?: string;
    category?: string;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeDeleted?: boolean;
  }
): Promise<ApiResponse<Ad[]>> {
  const queryParams = new URLSearchParams();

  if (params?.status) queryParams.append('status', params.status);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.location) queryParams.append('location', params.location);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params?.includeDeleted !== undefined) {
    queryParams.append('includeDeleted', params.includeDeleted.toString());
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}/api/editor/ads${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch ads');
  }

  return response.json();
}

/**
 * Approve an ad
 */
export async function approveAd(adId: number, token?: string): Promise<ApiResponse<Ad>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/ads/${adId}/approve`, {
    method: 'PUT',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to approve ad');
  }

  return response.json();
}

/**
 * Reject an ad
 */
export async function rejectAd(
  adId: number,
  reason: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/ads/${adId}/reject`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject ad');
  }

  return response.json();
}

/**
 * Delete an ad (soft delete)
 */
export async function deleteAd(
  adId: number,
  reason?: string,
  token?: string
): Promise<ApiResponse<Ad>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/ads/${adId}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete ad');
  }

  return response.json();
}

// Legacy wrapper functions - use handleVerificationAction directly for new code
export const reviewBusinessVerification = (
  verificationId: number,
  action: 'approve' | 'reject',
  reason?: string,
  token?: string
) => handleVerificationAction('business', verificationId, action, reason, token);

export const reviewIndividualVerification = (
  verificationId: number,
  action: 'approve' | 'reject',
  reason?: string,
  token?: string
) => handleVerificationAction('individual', verificationId, action, reason, token);

interface MyWorkToday {
  adsApprovedToday: number;
  adsRejectedToday: number;
  adsEditedToday: number;
  businessVerificationsToday: number;
  individualVerificationsToday: number;
  supportTicketsAssigned: number;
}

/**
 * Get editor's work statistics for today
 */
export async function getMyWorkToday(token?: string): Promise<ApiResponse<MyWorkToday>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/my-work-today`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch my work today stats');
  }

  return response.json();
}

interface EditorProfile {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  avatar: string | null;
}

/**
 * Get editor's profile with last login info
 */
export async function getEditorProfile(token?: string): Promise<ApiResponse<EditorProfile>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  console.log('📞 [getEditorProfile] Token provided:', token ? 'Yes' : 'No');
  console.log('📞 [getEditorProfile] Auth Token:', authToken);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ [getEditorProfile] Authorization header set');
  } else {
    console.warn('⚠️ [getEditorProfile] No auth token - request will fail!');
  }

  const response = await fetch(`${API_BASE}/api/editor/profile`, {
    headers,
  });

  console.log('📡 [getEditorProfile] Response status:', response.status);

  if (!response.ok) {
    throw new Error('Failed to fetch editor profile');
  }

  return response.json();
}

interface ReportedAdsCount {
  count: number;
}

/**
 * Get pending reported ads count
 */
export async function getReportedAdsCount(token?: string): Promise<ApiResponse<ReportedAdsCount>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/reported-ads/count`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reported ads count');
  }

  return response.json();
}

/**
 * Get reported ads
 */
export async function getReportedAds(
  token?: string,
  params?: {
    status?: string;
    page?: number;
    limit?: number;
  }
): Promise<ApiResponse<any[]>> {
  const authToken = token || await getBackendToken();

  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}/api/editor/reported-ads${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch reported ads');
  }

  return response.json();
}

interface CreateEditorData {
  fullName: string;
  email: string;
  password: string;
  avatar?: File | null;
}

interface Editor {
  id: number;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Create new editor (Super Admin only)
 */
export async function createEditor(
  data: CreateEditorData,
  token?: string
): Promise<ApiResponse<Editor>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('email', data.email);
  formData.append('password', data.password);

  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  const headers: HeadersInit = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/editors`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create editor');
  }

  return response.json();
}

interface UpdateEditorData {
  fullName: string;
  email: string;
  password?: string;
  avatar?: File | null;
}

/**
 * Update editor (Super Admin only)
 * Supports avatar file uploads via FormData
 */
export async function updateEditor(
  id: number,
  data: UpdateEditorData,
  token?: string
): Promise<ApiResponse<Editor>> {
  // Get token from session if not provided
  const authToken = token || await getBackendToken();

  // Use FormData to support file uploads
  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('email', data.email);

  if (data.password && data.password.trim().length > 0) {
    formData.append('password', data.password);
  }

  if (data.avatar) {
    formData.append('avatar', data.avatar);
    console.log('📷 Avatar file attached:', data.avatar.name);
  }

  const headers: HeadersInit = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Note: Don't set Content-Type header - browser will set it automatically with boundary for FormData

  const response = await fetch(`${API_BASE}/api/editor/editors/${id}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update editor');
  }

  return response.json();
}

/**
 * Get user reports count (problematic users)
 */
export async function getUserReportsCount(
  token?: string
): Promise<ApiResponse<{ count: number }>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/user-reports/count`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user reports count');
  }

  return response.json();
}

/**
 * Get notifications count with breakdown
 */
export async function getNotificationsCount(
  token?: string
): Promise<ApiResponse<{
  count: number;
  breakdown: {
    urgentReports: number;
    oldPendingAds: number;
    oldVerifications: number;
  };
}>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/notifications/count`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications count');
  }

  return response.json();
}

/**
 * Get system alerts (most urgent alert)
 */
export async function getSystemAlerts(
  token?: string
): Promise<ApiResponse<{
  message: string;
  type: 'danger' | 'warning' | 'info';
  count: number;
} | null>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/system-alerts`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch system alerts');
  }

  return response.json();
}

/**
 * Get average response time
 */
export async function getAvgResponseTime(
  token?: string
): Promise<ApiResponse<{
  avgResponseTime: string;
  breakdown: {
    adsAvgHours: number;
    verificationAvgHours: number;
    combinedAvgHours: number;
  };
}>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/avg-response-time`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch average response time');
  }

  return response.json();
}

/**
 * Get trends (percentage changes for pending items)
 */
export async function getTrends(
  token?: string
): Promise<ApiResponse<{
  pendingChange: string;
  verificationsChange: string;
  breakdown: {
    currentPendingAds: number;
    pastPendingAds: number;
    pendingAdsChangePercent: number;
    currentPendingVerifications: number;
    pastPendingVerifications: number;
    verificationsChangePercent: number;
  };
}>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/trends`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trends');
  }

  return response.json();
}

/**
 * Get users list with filters and pagination
 */
export async function getUsers(
  token?: string,
  params?: {
    role?: string;
    status?: 'active' | 'suspended';
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }
): Promise<ApiResponse<any[]>> {
  const authToken = token || await getBackendToken();

  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE}/api/editor/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

/**
 * Suspend user
 */
export async function suspendUser(
  userId: number,
  reason: string,
  duration?: number,
  token?: string
): Promise<ApiResponse<any>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/users/${userId}/suspend`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ reason, duration }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to suspend user');
  }

  return response.json();
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(
  userId: number,
  token?: string
): Promise<ApiResponse<any>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/users/${userId}/unsuspend`, {
    method: 'PUT',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to unsuspend user');
  }

  return response.json();
}

/**
 * Get support chat count (unresolved messages)
 */
export async function getSupportChatCount(token?: string): Promise<ApiResponse<{ count: number }>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/support-chat/count`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch support chat count');
  }

  return response.json();
}

/**
 * Get user reports trend (new reports today)
 */
export async function getUserReportsTrend(token?: string): Promise<ApiResponse<{
  newToday: number;
  formattedText: string;
  breakdown: {
    suspendedToday: number;
    rejectedToday: number;
  };
}>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/user-reports/trend`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user reports trend');
  }

  return response.json();
}

/**
 * Get average response time trend (improvement percentage)
 */
export async function getAvgResponseTimeTrend(token?: string): Promise<ApiResponse<{
  improvementPercent: number;
  formattedText: string;
  isImproved: boolean;
  breakdown: {
    currentAvgHours: number;
    previousAvgHours: number;
  };
}>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}/api/editor/avg-response-time/trend`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch avg response time trend');
  }

  return response.json();
}

/**
 * Get list of problematic users (user reports)
 */
export async function getUserReportsList(
  token?: string,
  params?: {
    page?: number;
    limit?: number;
    type?: 'all' | 'suspended' | 'rejected';
    search?: string;
  }
): Promise<ApiResponse<any[]>> {
  const authToken = token || await getBackendToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.search) queryParams.append('search', params.search);

  const url = `${API_BASE}/api/editor/user-reports/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch user reports list');
  }

  return response.json();
}
