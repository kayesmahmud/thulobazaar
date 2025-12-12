'use client';

import Link from 'next/link';

interface PhoneVerificationBannerProps {
  lang: string;
  phoneVerified: boolean;
  userPhone: string | null;
  loading: boolean;
}

export function PhoneVerificationBanner({
  lang,
  phoneVerified,
  userPhone,
  loading,
}: PhoneVerificationBannerProps) {
  if (loading) return null;

  // Verified phone display
  if (phoneVerified && userPhone) {
    return (
      <div className="bg-green-50 border border-green-500 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
        <span className="text-base text-green-500">✓</span>
        <span className="text-green-700 text-sm">
          Contact phone: <strong>{userPhone}</strong> (verified)
        </span>
      </div>
    );
  }

  // Not verified warning
  return (
    <div className="bg-amber-50 border border-amber-500 rounded-lg px-5 py-4 mb-6 flex items-start gap-3">
      <span className="text-xl leading-none">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-amber-800 m-0 mb-1 text-[15px]">
          Phone verification required
        </p>
        <p className="text-amber-800 m-0 text-sm leading-relaxed">
          To post ads and let buyers contact you, please verify your phone number first.
          {userPhone ? (
            <>
              {' '}
              Your phone <strong>{userPhone}</strong> is not yet verified.
            </>
          ) : (
            <> You haven&apos;t added a phone number yet.</>
          )}
        </p>
        <Link
          href={`/${lang}/profile`}
          className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-500 text-white rounded-md no-underline font-medium text-sm hover:bg-amber-600"
        >
          Verify Phone in Security Settings →
        </Link>
      </div>
    </div>
  );
}
