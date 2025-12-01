'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import IndividualVerificationForm from '@/components/IndividualVerificationForm';
import BusinessVerificationForm from '@/components/BusinessVerificationForm';
import { useToast } from '@/components/Toast';
import { StatusBadge } from '@/components/ui';

interface VerificationPageProps {
  params: Promise<{ lang: string }>;
}

interface VerificationStatus {
  business?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  };
  individual?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
  };
}

export default function VerificationPage({ params }: VerificationPageProps) {
  const { lang } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [showBusinessVerificationModal, setShowBusinessVerificationModal] = useState(false);
  const [showIndividualVerificationModal, setShowIndividualVerificationModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadVerificationStatus();
    }
  }, [status, router, lang]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const verificationResponse = await apiClient.getVerificationStatus().catch(() => ({ success: false, data: null }));

      if (verificationResponse.success && verificationResponse.data) {
        setVerificationStatus(verificationResponse.data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessVerificationSuccess = async () => {
    success('Business verification submitted successfully! We will review it shortly.');
    setShowBusinessVerificationModal(false);
    await loadVerificationStatus();
  };

  const handleIndividualVerificationSuccess = async () => {
    success('Individual verification submitted successfully! We will review it shortly.');
    setShowIndividualVerificationModal(false);
    await loadVerificationStatus();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <button
            onClick={() => router.push(`/${lang}/dashboard`)}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-all hover:gap-3 group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold">Verification Center</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Build Trust, Grow Faster
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Get verified and unlock premium features that help you sell more and build credibility
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-20">
          <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Build Trust</h3>
            <p className="text-gray-600 leading-relaxed">Verified badge increases buyer confidence by up to 3x</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Better Rankings</h3>
            <p className="text-gray-600 leading-relaxed">Verified ads appear higher in search results</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Features</h3>
            <p className="text-gray-600 leading-relaxed">Access exclusive tools and seller benefits</p>
          </div>
        </div>

        {/* Verification Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Individual Verification Card */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${
            verificationStatus?.individual?.status === 'verified'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
              : verificationStatus?.individual?.status === 'rejected'
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
              : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl'
          }`}>
            {/* Decorative gradient orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative p-8 z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl transform transition-transform group-hover:scale-110 ${
                    verificationStatus?.individual?.status === 'verified' ? 'animate-bounce' : ''
                  }`}>
                    {verificationStatus?.individual?.status === 'verified'
                      ? '✅'
                      : verificationStatus?.individual?.status === 'rejected'
                      ? '❌'
                      : '👤'}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      verificationStatus?.individual?.status === 'rejected' ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      Individual Verification
                    </h3>
                    <StatusBadge
                      status={verificationStatus?.individual?.status || 'unverified'}
                      size="md"
                      showIcon
                    />
                  </div>
                </div>
              </div>

              {verificationStatus?.individual?.status === 'rejected' && verificationStatus.individual.rejectionReason && (
                <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-6 mb-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <div className="font-bold text-red-900 text-lg mb-2">Verification Rejected</div>
                      <div className="text-red-800 mb-3">
                        <span className="font-semibold">Reason:</span> {verificationStatus.individual.rejectionReason}
                      </div>
                      <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                        💡 Please review the feedback above and submit a new application with the correct information.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6 leading-relaxed">
                Verify your identity with a government-issued ID to build trust and unlock premium features.
              </p>

              <div className="space-y-3 mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Verified badge on your profile</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Increased buyer trust & credibility</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Priority support access</span>
                </div>
              </div>

              {(!verificationStatus?.individual || verificationStatus.individual.status === 'unverified' || verificationStatus.individual.status === 'rejected') && (
                <button
                  onClick={() => setShowIndividualVerificationModal(true)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {verificationStatus?.individual?.status === 'rejected' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reapply for Verification</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Get Verified Now - FREE</span>
                    </>
                  )}
                </button>
              )}

              {verificationStatus?.individual?.status === 'pending' && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3 animate-bounce">⏳</div>
                  <div className="text-amber-900 font-bold text-lg mb-2">Under Review</div>
                  <div className="text-amber-800 text-sm">
                    We&apos;re reviewing your verification. This usually takes 24-48 hours. You&apos;ll receive an email notification once completed.
                  </div>
                </div>
              )}

              {verificationStatus?.individual?.status === 'verified' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3 animate-bounce">🎉</div>
                  <div className="text-green-900 font-bold text-lg mb-2">Verified Successfully!</div>
                  <div className="text-green-800 text-sm">
                    Congratulations! Your profile now displays a verified badge.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Verification Card */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${
            verificationStatus?.business?.status === 'verified'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
              : verificationStatus?.business?.status === 'rejected'
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
              : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-2xl'
          }`}>
            {/* Decorative gradient orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative p-8 z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl transform transition-transform group-hover:scale-110 ${
                    verificationStatus?.business?.status === 'verified' ? 'animate-bounce' : ''
                  }`}>
                    {verificationStatus?.business?.status === 'verified'
                      ? '✅'
                      : verificationStatus?.business?.status === 'rejected'
                      ? '❌'
                      : '🏢'}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      verificationStatus?.business?.status === 'rejected' ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      Business Verification
                    </h3>
                    <StatusBadge
                      status={verificationStatus?.business?.status || 'unverified'}
                      size="md"
                      showIcon
                    />
                  </div>
                </div>
              </div>

              {verificationStatus?.business?.status === 'rejected' && verificationStatus.business.rejectionReason && (
                <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-6 mb-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">⚠️</div>
                    <div>
                      <div className="font-bold text-red-900 text-lg mb-2">Verification Rejected</div>
                      <div className="text-red-800 mb-3">
                        <span className="font-semibold">Reason:</span> {verificationStatus.business.rejectionReason}
                      </div>
                      <div className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                        💡 Please review the feedback above and submit a new application with the correct information.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-6 leading-relaxed">
                Verify your business with official documents to access premium features and build credibility.
              </p>

              <div className="space-y-3 mb-6 bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Golden verified badge ⭐</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Custom shop page with URL</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Bulk listing & analytics tools</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-medium">Featured in business directory</span>
                </div>
              </div>

              {(!verificationStatus?.business || verificationStatus.business.status === 'unverified' || verificationStatus.business.status === 'rejected') && (
                <button
                  onClick={() => setShowBusinessVerificationModal(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {verificationStatus?.business?.status === 'rejected' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Reapply for Verification</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Get Verified - NPR 500</span>
                    </>
                  )}
                </button>
              )}

              {verificationStatus?.business?.status === 'pending' && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3 animate-bounce">⏳</div>
                  <div className="text-amber-900 font-bold text-lg mb-2">Under Review</div>
                  <div className="text-amber-800 text-sm">
                    We&apos;re reviewing your verification. This usually takes 24-48 hours. You&apos;ll receive an email notification once completed.
                  </div>
                </div>
              )}

              {verificationStatus?.business?.status === 'verified' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3 animate-bounce">🎉</div>
                  <div className="text-green-900 font-bold text-lg mb-2">Verified Successfully!</div>
                  <div className="text-green-800 text-sm">
                    Congratulations! Your business now displays a golden verified badge.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full mb-4">
              <span className="text-2xl">❓</span>
              <span className="font-bold text-indigo-900">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to know</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <span className="text-indigo-600">⏱️</span>
                How long does verification take?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Most verifications are reviewed within 24-48 hours. You&apos;ll receive an email notification once your verification is processed.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <span className="text-purple-600">📄</span>
                What documents do I need?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>Individual:</strong> Government ID (citizenship, passport, license) + selfie<br />
                <strong>Business:</strong> Business registration + valid business license
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <span className="text-pink-600">💰</span>
                Is verification free?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Individual verification is <strong>100% FREE</strong>. Business verification requires a one-time NPR 500 fee for document processing.
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <span className="text-rose-600">🔄</span>
                What if I&apos;m rejected?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                You&apos;ll receive detailed feedback on why your application was rejected. You can then reapply with corrected information at no additional cost.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Verification Modal */}
      {showBusinessVerificationModal && (
        <BusinessVerificationForm
          onSuccess={handleBusinessVerificationSuccess}
          onCancel={() => setShowBusinessVerificationModal(false)}
        />
      )}

      {/* Individual Verification Modal */}
      {showIndividualVerificationModal && (
        <IndividualVerificationForm
          onSuccess={handleIndividualVerificationSuccess}
          onCancel={() => setShowIndividualVerificationModal(false)}
        />
      )}
    </div>
  );
}
