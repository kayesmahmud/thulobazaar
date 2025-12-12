/**
 * Editors Management API Functions
 */

import { apiRequest, getBackendToken } from './client';
import type {
  ApiResponse,
  Editor,
  EditorProfile,
  CreateEditorData,
  UpdateEditorData,
} from './types';

/**
 * Get editor's profile with last login info
 */
export async function getEditorProfile(token?: string): Promise<ApiResponse<EditorProfile>> {
  return apiRequest<ApiResponse<EditorProfile>>('/api/editor/profile', { token });
}

/**
 * Create new editor (Super Admin only)
 * Uses FormData for avatar upload
 */
export async function createEditor(
  data: CreateEditorData,
  token?: string
): Promise<ApiResponse<Editor>> {
  const authToken = token || await getBackendToken();

  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('email', data.email);
  formData.append('password', data.password);

  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  return apiRequest<ApiResponse<Editor>>('/api/editor/editors', {
    method: 'POST',
    body: formData,
    token: authToken || undefined,
    isFormData: true,
  });
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
  const authToken = token || await getBackendToken();

  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('email', data.email);

  if (data.password && data.password.trim().length > 0) {
    formData.append('password', data.password);
  }

  if (data.avatar) {
    formData.append('avatar', data.avatar);
  }

  return apiRequest<ApiResponse<Editor>>(`/api/editor/editors/${id}`, {
    method: 'PUT',
    body: formData,
    token: authToken || undefined,
    isFormData: true,
  });
}
