'use client';

import Link from 'next/link';
import type { VerificationPricing } from './types';

interface PhoneVerificationBannerProps {
  lang: string;
  userPhone: string | null;
}

export function PhoneVerificationBanner({ lang, userPhone }: PhoneVerificationBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-6 mb-8 -mt-16 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-5xl">📱</div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-1">Phone Verification Required</h3>
          <p className="text-lg opacity-90">
            {userPhone ? (
              <>Your phone <strong>{userPhone}</strong> is not verified. </>
            ) : (
              <>You haven&apos;t added a phone number yet. </>
            )}
            To apply for Individual or Business verification, please verify your phone number first.
          </p>
          <Link
            href={`/${lang}/profile`}
            className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-white text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Verify Phone in Security Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

interface FreeVerificationBannerProps {
  pricing: VerificationPricing;
  phoneVerified: boolean;
}

export function FreeVerificationBanner({ pricing, phoneVerified }: FreeVerificationBannerProps) {
  if (!pricing.freeVerification.enabled || !pricing.freeVerification.isEligible || !phoneVerified) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 mb-8 -mt-16 shadow-xl">
      <div className="flex items-center gap-4">
        <div className="text-5xl">🎁</div>
        <div>
          <h3 className="text-2xl font-bold mb-1">Special Offer: FREE Verification!</h3>
          <p className="text-lg opacity-90">
            As a new user, you&apos;re eligible for FREE {pricing.freeVerification.durationDays / 30}-month verification.
            Get verified today at no cost!
          </p>
        </div>
      </div>
    </div>
  );
}
