/**
 * useBackendToken Hook
 * Fetches and caches the backend JWT token for API calls
 * This bypasses NextAuth session storage issues
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function useBackendToken() {
  const { data: session } = useSession();
  const [backendToken, setBackendToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBackendToken() {
      // First, try to get token from session (if NextAuth worked)
      const sessionToken = (session as any)?.backendToken;
      if (sessionToken) {
        console.log('✅ [useBackendToken] Token found in session');
        setBackendToken(sessionToken);
        setLoading(false);
        return;
      }

      // If no session token, check localStorage cache
      const cachedToken = localStorage.getItem('backend_jwt_token');
      if (cachedToken) {
        console.log('✅ [useBackendToken] Token found in localStorage cache');
        setBackendToken(cachedToken);
        setLoading(false);
        return;
      }

      // If still no token and user is logged in, fetch from backend
      if (session?.user?.email) {
        console.log('🔄 [useBackendToken] Fetching fresh token from backend...');

        try {
          const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: session.user.email,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const token = data.data?.token || data.token;

            if (token) {
              console.log('✅ [useBackendToken] Fresh token fetched successfully');
              setBackendToken(token);
              localStorage.setItem('backend_jwt_token', token);
              setLoading(false);
              return;
            }
          } else {
            const errorText = await response.text();
            console.error('❌ [useBackendToken] Failed to fetch token:', response.status, errorText);
            setError(`Failed to fetch token: ${response.status}`);
          }
        } catch (err: any) {
          console.error('❌ [useBackendToken] Error fetching token:', err);
          setError(err.message);
        }
      }

      setLoading(false);
    }

    if (session) {
      fetchBackendToken();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Clear token on logout
  useEffect(() => {
    if (!session) {
      localStorage.removeItem('backend_jwt_token');
      setBackendToken(null);
    }
  }, [session]);

  return { backendToken, loading, error };
}
