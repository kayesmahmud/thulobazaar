'use client';

import { getSession } from 'next-auth/react';

/**
 * Authenticated GET against the super-admin financial endpoints.
 * Mirrors the token lookup in useFinancialStats (NextAuth session -> backendToken).
 */
export async function financialFetch<T>(path: string): Promise<T> {
  const session = await getSession();
  const token = session?.user?.backendToken || (session as any)?.backendToken || null;
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await response.json();
  if (!response.ok || !json?.success) {
    throw new Error(json?.message || 'Request failed');
  }
  return json.data as T;
}
