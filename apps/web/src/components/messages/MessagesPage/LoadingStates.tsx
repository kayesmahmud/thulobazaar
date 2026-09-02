'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';

/** Same wording as the app's Chats gate; both links bring the user back here. */
export function NotLoggedInState() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const t = useTranslations('messages');
  const callbackUrl = encodeURIComponent(`/${lang}/messages`);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('signedOutTitle')}</h2>
        <p className="text-gray-600 mb-6">{t('signedOutBody')}</p>
        <Link
          href={`/${lang}/auth/signin?callbackUrl=${callbackUrl}`}
          className="block w-full rounded-xl bg-[#DC143C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#B8102F]"
        >
          {t('signInToChat')}
        </Link>
        <Link
          href={`/${lang}/auth/signup?callbackUrl=${callbackUrl}`}
          className="mt-4 inline-block font-semibold text-[#B8102F] hover:underline"
        >
          {t('newHere')}
        </Link>
      </div>
    </div>
  );
}

export function TokenLoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <div className="text-5xl mb-4">&#8987;</div>
        <p className="text-gray-600">Loading messaging system...</p>
      </div>
    </div>
  );
}

interface TokenErrorStateProps {
  error: string | null;
}

export function TokenErrorState({ error }: TokenErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] p-6">
      <div className="max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-5xl mb-4">&#10060;</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Messaging</h2>
        <p className="text-gray-600 mb-6">
          {error || 'Failed to fetch authentication token. Please try logging out and back in.'}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Log Out and Try Again
        </button>
      </div>
    </div>
  );
}
