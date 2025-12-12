'use client';

import Link from 'next/link';
import type { VerificationStatus } from './types';

interface VerificationBannerProps {
  verificationStatus: VerificationStatus | null;
  lang: string;
  userName?: string | null;
  onResubmit: (type: 'individual' | 'business') => void;
}

/**
 * Verification Banner Component
 * Displays 4 different states based on user verification status:
 * 1. Verified - User has approved verification
 * 2. Pending - User has submitted verification, awaiting review
 * 3. Rejected - User's verification was rejected
 * 4. Not Verified - User hasn't started verification (CTA)
 */
export function VerificationBanner({
  verificationStatus,
  lang,
  userName,
  onResubmit,
}: VerificationBannerProps) {
  // Check verification status
  const isBusinessVerified = verificationStatus?.businessVerification?.verified;
  const isIndividualVerified = verificationStatus?.individualVerification?.verified;
  const hasAnyVerification = isBusinessVerified || isIndividualVerified;

  // Get verified names from user record (not from verification request)
  const businessName = verificationStatus?.businessVerification?.businessName;
  const individualName = verificationStatus?.individualVerification?.fullName;

  const isBusinessRejected = verificationStatus?.businessVerification?.request?.status === 'rejected';
  const isIndividualRejected =
    verificationStatus?.individualVerification?.request?.status === 'rejected';

  // Check for pending applications
  const isBusinessPending = verificationStatus?.businessVerification?.request?.status === 'pending';
  const isIndividualPending =
    verificationStatus?.individualVerification?.request?.status === 'pending';
  const hasAnyPending = isBusinessPending || isIndividualPending;

  // STATE 1: User is verified - Show success state
  if (hasAnyVerification) {
    return (
      <div className="relative bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 rounded-3xl p-8 mb-12 shadow-2xl text-white overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Verified Account</h2>
                <p className="text-white/90 text-sm">Your account has been verified and trusted</p>
              </div>
            </div>

            <div className="space-y-3">
              {isBusinessVerified && (
                <div className="flex items-center gap-3 bg-white/95 px-5 py-3 rounded-xl shadow-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold text-lg">
                        {businessName || 'Your Business'}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">Business Verification</p>
                  </div>
                </div>
              )}

              {isIndividualVerified && (
                <div className="flex items-center gap-3 bg-white/95 px-5 py-3 rounded-xl shadow-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold text-lg">
                        {individualName || userName || 'You'}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">Individual Verification</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Link
              href={`/${lang}/verification`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-amber-600 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage Verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE 2: User has pending verification application
  if (hasAnyPending) {
    return (
      <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-8 mb-12 shadow-2xl text-white overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                {/* Animated Clock Icon */}
                <svg
                  className="w-10 h-10 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Verification Pending</h2>
                <p className="text-white/90 text-sm">We're reviewing your application</p>
              </div>
            </div>

            <div className="space-y-3">
              {isBusinessPending && (
                <div className="flex items-center gap-3 bg-white/95 px-5 py-3 rounded-xl shadow-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-white animate-spin"
                      style={{ animationDuration: '3s' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold text-lg">
                        {verificationStatus?.businessVerification?.request?.businessName ||
                          'Business Verification'}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        PENDING
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Business/Shop verification under review
                      {verificationStatus?.businessVerification?.request?.createdAt && (
                        <span className="text-gray-400 ml-2">
                          • Submitted{' '}
                          {new Date(
                            verificationStatus.businessVerification.request.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {isIndividualPending && (
                <div className="flex items-center gap-3 bg-white/95 px-5 py-3 rounded-xl shadow-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-white animate-spin"
                      style={{ animationDuration: '3s' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold text-lg">
                        {verificationStatus?.individualVerification?.request?.fullName ||
                          'Individual Verification'}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        PENDING
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Individual ID verification under review
                      {verificationStatus?.individualVerification?.request?.createdAt && (
                        <span className="text-gray-400 ml-2">
                          • Submitted{' '}
                          {new Date(
                            verificationStatus.individualVerification.request.createdAt
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-white/80 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Our team typically reviews applications within 24-48 hours
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STATE 3: User has rejected verification
  const hasAnyRejected = isBusinessRejected || isIndividualRejected;

  if (hasAnyRejected) {
    return (
      <div className="relative bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 rounded-3xl p-8 mb-12 shadow-2xl text-white overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-300 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Verification Rejected</h2>
                <p className="text-white/90 text-sm">Your application was not approved</p>
              </div>
            </div>

            <div className="space-y-3">
              {isBusinessRejected && (
                <div className="bg-white/95 px-5 py-4 rounded-xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-900 font-bold text-lg">Business Verification</span>
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                          REJECTED
                        </span>
                      </div>
                      {verificationStatus?.businessVerification?.request?.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Reason for rejection:
                          </div>
                          <p className="text-red-800 text-sm">
                            {verificationStatus.businessVerification.request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isIndividualRejected && (
                <div className="bg-white/95 px-5 py-4 rounded-xl shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-900 font-bold text-lg">
                          Individual Verification
                        </span>
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                          REJECTED
                        </span>
                      </div>
                      {verificationStatus?.individualVerification?.request?.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Reason for rejection:
                          </div>
                          <p className="text-red-800 text-sm">
                            {verificationStatus.individualVerification.request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-4 text-white/80 text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Please fix the issues mentioned above and resubmit your application
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {isIndividualRejected && (
              <button
                onClick={() => onResubmit('individual')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 cursor-pointer border-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Resubmit Individual
              </button>
            )}
            {isBusinessRejected && (
              <button
                onClick={() => onResubmit('business')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 font-bold rounded-2xl hover:bg-gray-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 cursor-pointer border-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Resubmit Business
              </button>
            )}
            <span className="text-white/70 text-xs font-medium">No additional payment required</span>
          </div>
        </div>
      </div>
    );
  }

  // STATE 4: User is not verified - Show CTA
  return (
    <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 mb-12 shadow-2xl text-white overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>
      </div>

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold">Get Verified & Stand Out</h2>
          </div>
          <p className="text-white/90 mb-5 text-lg leading-relaxed">
            Build trust with buyers, unlock premium features, and boost your visibility
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              <span className="font-medium">Not Verified Yet</span>
            </div>
          </div>
        </div>
        <div>
          <Link
            href={`/${lang}/verification`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-purple-600 font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Get Verified Now
          </Link>
        </div>
      </div>
    </div>
  );
}
