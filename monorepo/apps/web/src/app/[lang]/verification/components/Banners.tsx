'use client';

import Link from 'next/link';
import type { VerificationPricing } from './types';

interface PhoneVerificationBannerProps {
  lang: string;
  userPhone: string | null;
}

export function PhoneVerificationBanner({ lang, userPhone }: PhoneVerificationBannerProps) {
  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 -mt-8 sm:-mt-16 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-3xl sm:text-5xl">📱</div>
        <div className="flex-1">
          <h3 className="text-lg sm:text-2xl font-bold mb-1">Phone Verification Required</h3>
          <p className="text-sm sm:text-lg opacity-90">
            {userPhone ? (
              <>Your phone <strong>{userPhone}</strong> is not verified. </>
            ) : (
              <>You haven&apos;t added a phone number yet. </>
            )}
            To apply for Individual or Business verification, please verify your phone number first.
          </p>
          <Link
            href={`/${lang}/profile`}
            className="inline-flex items-center gap-2 mt-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="hidden sm:inline">Verify Phone in Security Settings</span>
            <span className="sm:hidden">Verify Phone</span>
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
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 -mt-8 sm:-mt-16 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-3xl sm:text-5xl">🎁</div>
        <div>
          <h3 className="text-lg sm:text-2xl font-bold mb-1">Special Offer: FREE Verification!</h3>
          <p className="text-sm sm:text-lg opacity-90">
            As a new user, you&apos;re eligible for FREE {pricing.freeVerification.durationDays / 30}-month verification.
            Get verified today at no cost!
          </p>
        </div>
      </div>
    </div>
  );
}

interface CampaignBannerProps {
  pricing: VerificationPricing;
}

export function CampaignBanner({ pricing }: CampaignBannerProps) {
  const campaign = pricing.campaign;

  // Don't show if free verification is eligible (that takes priority)
  if (!campaign || (pricing.freeVerification.enabled && pricing.freeVerification.isEligible)) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 -mt-8 sm:-mt-16 shadow-xl animate-pulse-subtle">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-3xl sm:text-5xl">{campaign.bannerEmoji || '🎉'}</div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
            <h3 className="text-lg sm:text-2xl font-bold">{campaign.name}</h3>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 rounded-full text-xs sm:text-sm font-semibold">
              {campaign.discountPercentage}% OFF
            </span>
          </div>
          <p className="text-sm sm:text-lg opacity-90">
            {campaign.description || campaign.bannerText}
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {campaign.daysRemaining === 1 ? 'Ends tomorrow!' : `${campaign.daysRemaining} days left`}
            </span>
            {campaign.appliesToTypes.length > 0 && campaign.appliesToTypes.length < 2 && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {campaign.appliesToTypes[0] === 'individual' ? 'Individual only' : 'Business only'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
