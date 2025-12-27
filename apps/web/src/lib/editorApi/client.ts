/**
 * Base API Client for Editor API
 *
 * Provides reusable fetch helper with automatic token handling,
 * headers, and error handling.
 */

import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Get backend token from session or localStorage
 * Checks both NextAuth session (for users) and localStorage (for editors/admins)
 */
export async function getBackendToken(): Promise<string | null> {
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

/**
 * Request configuration options
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  /** Use relative URL (for Next.js API routes) instead of API_BASE */
  useRelativeUrl?: boolean;
  /** Skip JSON content-type header (for FormData) */
  isFormData?: boolean;
}

/**
 * Build headers for API requests
 */
async function buildHeaders(options: RequestOptions): Promise<HeadersInit> {
  const authToken = options.token || await getBackendToken();

  const headers: HeadersInit = {};

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return headers;
}

/**
 * Build full URL for API requests
 * All endpoints go to the backend API (API_BASE) by default.
 * Use useRelativeUrl: true only for Next.js API routes.
 */
function buildUrl(endpoint: string, useRelativeUrl?: boolean): string {
  if (useRelativeUrl) {
    return endpoint;
  }
  return `${API_BASE}${endpoint}`;
}

/**
 * Generic API request helper
 * Handles token, headers, fetch, and error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, useRelativeUrl, isFormData } = options;

  const headers = await buildHeaders(options);
  const url = buildUrl(endpoint, useRelativeUrl);

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = isFormData ? (body as FormData) : JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${endpoint}`);
  }

  return response.json();
}

/**
 * GET request helper
 */
export function apiGet<T>(endpoint: string, token?: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET', token });
}

/**
 * POST request helper
 */
export function apiPost<T>(
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'POST', body, token });
}

/**
 * PUT request helper
 */
export function apiPut<T>(
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'PUT', body, token });
}

/**
 * DELETE request helper
 */
export function apiDelete<T>(
  endpoint: string,
  body?: unknown,
  token?: string
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE', body, token });
}

/**
 * Build query string from params object
 */
export function buildQueryString<T extends object>(params?: T): string {
  if (!params) return '';

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

export { API_BASE };
