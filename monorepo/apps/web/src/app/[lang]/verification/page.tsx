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
    expiresAt?: string;
    daysRemaining?: number;
    isExpiringSoon?: boolean;
  };
  individual?: {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejectionReason?: string;
    expiresAt?: string;
    daysRemaining?: number;
    isExpiringSoon?: boolean;
  };
}

interface PricingOption {
  id: number;
  durationDays: number;
  durationLabel: string;
  price: number;
  discountPercentage: number;
  finalPrice: number;
}

interface VerificationPricing {
  individual: PricingOption[];
  business: PricingOption[];
  freeVerification: {
    enabled: boolean;
    durationDays: number;
    types: string[];
    isEligible: boolean;
  };
}

export default function VerificationPage({ params }: VerificationPageProps) {
  const { lang } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [pricing, setPricing] = useState<VerificationPricing | null>(null);

  // Selection state
  const [selectedType, setSelectedType] = useState<'individual' | 'business' | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<PricingOption | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }

    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, lang]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load verification status and pricing in parallel
      const [verificationResponse, pricingResponse] = await Promise.all([
        apiClient.getVerificationStatus().catch(() => ({ success: false, data: null })),
        fetch('/api/verification/pricing', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        }).then(res => res.json()).catch(() => ({ success: false, data: null })),
      ]);

      if (verificationResponse.success && verificationResponse.data) {
        setVerificationStatus(verificationResponse.data);
      }

      if (pricingResponse.success && pricingResponse.data) {
        setPricing(pricingResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: 'individual' | 'business') => {
    setSelectedType(type);
    setSelectedDuration(null);
    setShowForm(false);
  };

  const handleDurationSelect = (option: PricingOption) => {
    setSelectedDuration(option);
  };

  const handleProceedToForm = () => {
    if (selectedType && selectedDuration) {
      setShowForm(true);
    }
  };

  const handleFormSuccess = async () => {
    success(`${selectedType === 'individual' ? 'Individual' : 'Business'} verification submitted successfully! We will review it shortly.`);
    setShowForm(false);
    setSelectedType(null);
    setSelectedDuration(null);
    await loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const handleBackToSelection = () => {
    setShowForm(false);
    setSelectedDuration(null);
  };

  // Check if free verification applies
  const isFreeVerification = pricing?.freeVerification.enabled &&
    pricing?.freeVerification.isEligible &&
    selectedType &&
    pricing?.freeVerification.types.includes(selectedType);

  const getEffectivePrice = () => {
    if (isFreeVerification) return 0;
    return selectedDuration?.finalPrice || 0;
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
        {/* Free Verification Promotion Banner */}
        {pricing?.freeVerification.enabled && pricing?.freeVerification.isEligible && (
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
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-8">
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

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Individual Verification Status */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${
            verificationStatus?.individual?.status === 'verified'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
              : verificationStatus?.individual?.status === 'rejected'
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
              : verificationStatus?.individual?.status === 'pending'
              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300'
              : 'bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-2xl cursor-pointer'
          }`} onClick={() => (!verificationStatus?.individual || ['unverified', 'rejected'].includes(verificationStatus.individual.status)) && handleTypeSelect('individual')}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative p-8 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl transform transition-transform group-hover:scale-110 ${
                    verificationStatus?.individual?.status === 'verified' ? 'animate-bounce' : ''
                  }`}>
                    {verificationStatus?.individual?.status === 'verified' ? '✅'
                      : verificationStatus?.individual?.status === 'rejected' ? '❌'
                      : verificationStatus?.individual?.status === 'pending' ? '⏳'
                      : '👤'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Individual Verification</h3>
                    <StatusBadge status={verificationStatus?.individual?.status || 'unverified'} size="md" showIcon />
                  </div>
                </div>
                {selectedType === 'individual' && !showForm && (
                  <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium">Selected</span>
                )}
              </div>

              {/* Expiry Warning */}
              {verificationStatus?.individual?.status === 'verified' && verificationStatus.individual.isExpiringSoon && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                  <span className="text-amber-800 font-medium">
                    Expires in {verificationStatus.individual.daysRemaining} days - Renew now!
                  </span>
                </div>
              )}

              {/* Rejection Reason */}
              {verificationStatus?.individual?.status === 'rejected' && verificationStatus.individual.rejectionReason && (
                <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <div className="font-bold text-red-900">Rejected</div>
                      <div className="text-red-800 text-sm">{verificationStatus.individual.rejectionReason}</div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-4">
                Verify your identity with a government-issued ID to build trust and unlock premium features.
              </p>

              {(!verificationStatus?.individual || ['unverified', 'rejected'].includes(verificationStatus.individual.status)) && (
                <div className="text-indigo-600 font-medium flex items-center gap-2">
                  <span>Click to get verified</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              {verificationStatus?.individual?.status === 'pending' && (
                <div className="text-amber-700">Your verification is under review (24-48 hours)</div>
              )}

              {verificationStatus?.individual?.status === 'verified' && (
                <div className="text-green-700">
                  Verified until {verificationStatus.individual.expiresAt
                    ? new Date(verificationStatus.individual.expiresAt).toLocaleDateString()
                    : 'N/A'}
                </div>
              )}
            </div>
          </div>

          {/* Business Verification Status */}
          <div className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${
            verificationStatus?.business?.status === 'verified'
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300'
              : verificationStatus?.business?.status === 'rejected'
              ? 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300'
              : verificationStatus?.business?.status === 'pending'
              ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300'
              : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-2xl cursor-pointer'
          }`} onClick={() => (!verificationStatus?.business || ['unverified', 'rejected'].includes(verificationStatus.business.status)) && handleTypeSelect('business')}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative p-8 z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`text-5xl transform transition-transform group-hover:scale-110 ${
                    verificationStatus?.business?.status === 'verified' ? 'animate-bounce' : ''
                  }`}>
                    {verificationStatus?.business?.status === 'verified' ? '✅'
                      : verificationStatus?.business?.status === 'rejected' ? '❌'
                      : verificationStatus?.business?.status === 'pending' ? '⏳'
                      : '🏢'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Business Verification</h3>
                    <StatusBadge status={verificationStatus?.business?.status || 'unverified'} size="md" showIcon />
                  </div>
                </div>
                {selectedType === 'business' && !showForm && (
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">Selected</span>
                )}
              </div>

              {/* Expiry Warning */}
              {verificationStatus?.business?.status === 'verified' && verificationStatus.business.isExpiringSoon && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
                  <span className="text-amber-800 font-medium">
                    Expires in {verificationStatus.business.daysRemaining} days - Renew now!
                  </span>
                </div>
              )}

              {/* Rejection Reason */}
              {verificationStatus?.business?.status === 'rejected' && verificationStatus.business.rejectionReason && (
                <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div>
                      <div className="font-bold text-red-900">Rejected</div>
                      <div className="text-red-800 text-sm">{verificationStatus.business.rejectionReason}</div>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-4">
                Verify your business with official documents to access premium features and build credibility.
              </p>

              {(!verificationStatus?.business || ['unverified', 'rejected'].includes(verificationStatus.business.status)) && (
                <div className="text-purple-600 font-medium flex items-center gap-2">
                  <span>Click to get verified</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}

              {verificationStatus?.business?.status === 'pending' && (
                <div className="text-amber-700">Your verification is under review (24-48 hours)</div>
              )}

              {verificationStatus?.business?.status === 'verified' && (
                <div className="text-green-700">
                  Verified until {verificationStatus.business.expiresAt
                    ? new Date(verificationStatus.business.expiresAt).toLocaleDateString()
                    : 'N/A'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Duration Selection */}
        {selectedType && !showForm && (
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Select Verification Duration
              </h2>
              <button
                onClick={() => { setSelectedType(null); setSelectedDuration(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Free Verification Notice */}
            {isFreeVerification && (
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <div className="font-bold text-green-800">You&apos;re Eligible for FREE Verification!</div>
                    <div className="text-green-700 text-sm">
                      Get {pricing?.freeVerification.durationDays && pricing.freeVerification.durationDays / 30} months free as a new user.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duration Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {(selectedType === 'individual' ? pricing?.individual : pricing?.business)?.map((option) => {
                const isFreeTier = isFreeVerification && option.durationDays === pricing?.freeVerification.durationDays;
                const isSelected = selectedDuration?.id === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => handleDurationSelect(option)}
                    className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl scale-105'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Popular/Recommended Badge */}
                    {option.durationDays === 180 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          POPULAR
                        </span>
                      </div>
                    )}

                    {/* Free Badge */}
                    {isFreeTier && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          FREE
                        </span>
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`text-lg font-bold mb-2 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {option.durationLabel}
                      </div>

                      {isFreeTier ? (
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-green-500">FREE</span>
                          <div className={`text-sm line-through ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                            NPR {option.price}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2">
                          {option.discountPercentage > 0 ? (
                            <>
                              <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
                                NPR {option.finalPrice}
                              </span>
                              <div className={`text-sm line-through ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                                NPR {option.price}
                              </div>
                            </>
                          ) : (
                            <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-indigo-600'}`}>
                              NPR {option.price}
                            </span>
                          )}
                        </div>
                      )}

                      {option.discountPercentage > 0 && !isFreeTier && (
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                        }`}>
                          Save {option.discountPercentage}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Summary & Proceed Button */}
            {selectedDuration && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-gray-600 mb-1">Selected Plan:</div>
                    <div className="text-xl font-bold text-gray-900">
                      {selectedType === 'individual' ? 'Individual' : 'Business'} Verification - {selectedDuration.durationLabel}
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {isFreeVerification ? 'FREE' : `NPR ${selectedDuration.finalPrice}`}
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToForm}
                    className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Verification</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                How does verification pricing work?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Choose from 1, 3, 6, or 12-month plans. Longer durations offer better discounts.
                New users may be eligible for FREE verification!
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <span className="text-rose-600">🔄</span>
                What happens when verification expires?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your verified badge will be removed, but your shop page and listings remain.
                You can renew anytime to restore your verified status.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business Verification Form Modal */}
      {showForm && selectedType === 'business' && selectedDuration && (
        <BusinessVerificationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          durationDays={selectedDuration.durationDays}
          price={isFreeVerification ? 0 : selectedDuration.finalPrice}
          isFreeVerification={isFreeVerification || false}
        />
      )}

      {/* Individual Verification Form Modal */}
      {showForm && selectedType === 'individual' && selectedDuration && (
        <IndividualVerificationForm
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          durationDays={selectedDuration.durationDays}
          price={isFreeVerification ? 0 : selectedDuration.finalPrice}
          isFreeVerification={isFreeVerification || false}
        />
      )}
    </div>
  );
}
