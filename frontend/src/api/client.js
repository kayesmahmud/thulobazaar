/**
 * API Client - Shared fetch wrapper
 *
 * Provides centralized:
 * - Error handling
 * - Token management
 * - Request/response interceptors
 * - Logger integration
 */

import { API_BASE_URL } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Get auth token from localStorage
 */
export function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Get editor token from localStorage
 */
export function getEditorToken() {
  return localStorage.getItem('editorToken');
}

/**
 * Create enhanced error with structured information
 */
function createStructuredError(data) {
  const error = new Error(data.message || 'API request failed');
  error.type = data.error?.type;
  error.title = data.error?.title;
  error.suggestion = data.error?.suggestion;
  error.severity = data.error?.severity;
  error.field = data.error?.field;
  error.details = data.error?.details;
  error.structured = !!data.error;
  return error;
}

/**
 * Generic request handler
 */
export async function apiRequest(endpoint, options = {}) {
  const startTime = Date.now();
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  try {
    logger.debug(`API Request: ${method} ${endpoint}`, {
      url,
      hasBody: !!options.body
    });

    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    // Parse JSON response
    const data = await response.json();

    // Log API call
    logger.apiCall(method, endpoint, response.status, duration, !data.success ? new Error(data.message) : null);

    // Check for HTTP errors
    if (!response.ok) {
      throw createStructuredError(data);
    }

    // Check for API errors
    if (!data.success) {
      throw createStructuredError(data);
    }

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    logger.error(`API Error: ${method} ${endpoint}`, error, {
      endpoint,
      method,
      duration,
      url
    });

    throw error;
  }
}

/**
 * GET request
 */
export async function get(endpoint, useAuthToken = false, useEditorToken = false) {
  const headers = {};

  if (useAuthToken) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (useEditorToken) {
    const token = getEditorToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest(endpoint, {
    method: 'GET',
    headers
  });
}

/**
 * POST request
 */
export async function post(endpoint, body, useAuthToken = false, useEditorToken = false) {
  const headers = {};

  if (useAuthToken) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (useEditorToken) {
    const token = getEditorToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  } else {
    console.log('🔍 [API Client] Sending FormData to', endpoint);
    console.log('🔍 [API Client] FormData detected, not setting Content-Type (browser will set with boundary)');
    // Log FormData contents
    for (let pair of body.entries()) {
      console.log('  🔍', pair[0], ':', pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]);
    }
  }

  return apiRequest(endpoint, {
    method: 'POST',
    headers,
    body
  });
}

/**
 * PUT request
 */
export async function put(endpoint, body, useAuthToken = false, useEditorToken = false) {
  const headers = {};

  if (useAuthToken) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (useEditorToken) {
    const token = getEditorToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData vs JSON
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  return apiRequest(endpoint, {
    method: 'PUT',
    headers,
    body
  });
}

/**
 * DELETE request
 */
export async function del(endpoint, useAuthToken = false, useEditorToken = false) {
  const headers = {};

  if (useAuthToken) {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (useEditorToken) {
    const token = getEditorToken();
    if (!token) throw new Error('No authentication token found');
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest(endpoint, {
    method: 'DELETE',
    headers
  });
}

// Default export for backward compatibility
export default {
  get,
  post,
  put,
  delete: del,
  apiRequest,
  getAuthToken,
  getEditorToken
};
