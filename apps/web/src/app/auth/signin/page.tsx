'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SigninRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters when redirecting
    const callbackUrl = searchParams.get('callbackUrl') || '/en';
    const error = searchParams.get('error');

    // Build the redirect URL with preserved params
    let redirectUrl = '/en/auth/signin';
    const params = new URLSearchParams();

    if (callbackUrl) params.set('callbackUrl', callbackUrl);
    if (error) params.set('error', error);

    if (params.toString()) {
      redirectUrl += '?' + params.toString();
    }

    router.replace(redirectUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    </div>
  );
}
