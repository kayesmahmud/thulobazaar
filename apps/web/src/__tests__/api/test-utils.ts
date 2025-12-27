/**
 * API Test Utilities
 *
 * Helpers for testing Next.js API routes
 */
import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options;

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3333');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(urlObj, init);
}

/**
 * Create a mock authenticated request
 */
export function createAuthenticatedRequest(
  url: string,
  token: string,
  options: {
    method?: string;
    body?: any;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  return createMockRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Parse JSON response from API route
 */
export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Generate a test JWT token (for testing only - not for production!)
 */
export function generateTestToken(payload: {
  userId: number;
  email: string;
  role?: string;
}): string {
  // This is a simplified test token - in real tests you'd use proper JWT
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = 'test-signature';
  return `${header}.${body}.${signature}`;
}
