'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  IndividualVerificationForm,
  BusinessVerificationForm,
} from '@/components/verification';
import {
  DashboardStats,
  VerificationBanner,
  AdsList,
  useDashboardData,
} from '@/components/dashboard';

export default function DashboardPage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';

  const {
    session,
    status,
    activeTab,
    userAds,
    filteredAds,
    loading,
    error,
    stats,
    verificationStatus,
    showResubmitModal,
    resubmitType,
    setActiveTab,
    handleDeleteAd,
    handleMarkAsSold,
    openResubmitModal,
    closeResubmitModal,
    loadUserData,
    success,
  } = useDashboardData();

  // Show loading state while checking authentication
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            {/* Animated Loading Circle */}
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Dashboard</h2>
          <p className="text-white/80">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          {/* Breadcrumb */}
          <div className="flex gap-2 text-sm text-white/80 mb-6">
            <Link href={`/${lang}`} className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Dashboard</span>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                My Dashboard
              </h1>
              <p className="text-xl text-white/90">
                Welcome back, <span className="font-semibold">{session?.user?.name}</span>!
              </p>
            </div>
            <Link
              href={`/${lang}/post-ad`}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white px-10 py-5 rounded-2xl font-black text-lg hover:from-green-500 hover:via-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-2xl hover:shadow-green-500/50 hover:scale-110 animate-pulse"
            >
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>

              {/* Button Content */}
              <div className="relative flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="tracking-wide">POST FREE AD</span>
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-2xl shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <DashboardStats stats={stats} lang={lang} />

        {/* Verification Banner */}
        <VerificationBanner
          verificationStatus={verificationStatus}
          lang={lang}
          userName={session?.user?.name}
          onResubmit={openResubmitModal}
        />

        {/* Ads List */}
        <AdsList
          userAds={userAds}
          filteredAds={filteredAds}
          activeTab={activeTab}
          lang={lang}
          onTabChange={setActiveTab}
          onDelete={handleDeleteAd}
          onMarkAsSold={handleMarkAsSold}
        />
      </div>

      {/* Resubmission Modal */}
      {showResubmitModal &&
        resubmitType &&
        (resubmitType === 'individual' ? (
          <IndividualVerificationForm
            onSuccess={() => {
              closeResubmitModal();
              success('Verification resubmitted successfully! We will review your application.');
              loadUserData();
            }}
            onCancel={closeResubmitModal}
            durationDays={
              (verificationStatus?.individualVerification?.request as any)?.durationDays || 365
            }
            price={0}
            isFreeVerification={true}
            isResubmission={true}
          />
        ) : (
          <BusinessVerificationForm
            onSuccess={() => {
              closeResubmitModal();
              success('Verification resubmitted successfully! We will review your application.');
              loadUserData();
            }}
            onCancel={closeResubmitModal}
            durationDays={
              (verificationStatus?.businessVerification?.request as any)?.durationDays || 365
            }
            price={0}
            isFreeVerification={true}
            isResubmission={true}
          />
        ))}
    </div>
  );
}
