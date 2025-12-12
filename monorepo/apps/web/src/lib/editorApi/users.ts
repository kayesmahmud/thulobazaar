/**
 * Users API Functions
 */

import { apiRequest, buildQueryString } from './client';
import type { ApiResponse, User, GetUsersParams } from './types';

/**
 * Get users list with filters and pagination
 * Generic T allows callers to specify their own detailed type
 */
export async function getUsers<T = unknown>(
  token?: string,
  params?: GetUsersParams
): Promise<ApiResponse<T[]>> {
  const queryString = buildQueryString(params);
  return apiRequest<ApiResponse<T[]>>(`/api/editor/users${queryString}`, { token });
}

/**
 * Suspend user
 */
export async function suspendUser(
  userId: number,
  reason: string,
  duration?: number,
  token?: string
): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/api/editor/users/${userId}/suspend`, {
    method: 'PUT',
    body: { reason, duration },
    token,
  });
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(userId: number, token?: string): Promise<ApiResponse<User>> {
  return apiRequest<ApiResponse<User>>(`/api/editor/users/${userId}/unsuspend`, {
    method: 'PUT',
    token,
  });
}
