'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ProfileHeader,
  ProfileTabs,
  SecurityTab,
  ShopTab,
  SavedAdsTab,
} from '@/components/profile';
import { useProfilePage, ProfileEditForm } from './components';

export default function ProfilePage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();

  const {
    profile,
    profileError,
    isLoading,
    saving,
    error,
    successMessage,
    unsavedChanges,
    activeTab,
    setActiveTab,
    formData,
    favorites,
    favoritesLoading,
    displayName,
    fallbackShopSlug,
    activeShopSlug,
    isVerified,
    isVerifiedBusiness,
    isNameLocked,
    handleInputChange,
    handleSubmit,
    handleSecuritySuccess,
    handleShopSuccess,
    removeFavorite,
    clearError,
  } = useProfilePage(lang);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load profile</h2>
          <p className="text-gray-600 mb-6">{profileError || error || 'Something went wrong. Please try again.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center gap-2 text-sm">
              <Link href={`/${lang}`} className="text-gray-500 hover:text-primary transition-colors">
                Home
              </Link>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href={`/${lang}/dashboard`} className="text-gray-500 hover:text-primary transition-colors">
                Dashboard
              </Link>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">Profile</span>
            </nav>
            <Link
              href={`/${lang}/dashboard`}
              className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Profile Header Card */}
        <ProfileHeader
          displayName={displayName}
          email={profile.email ?? null}
          avatar={profile.avatar ?? null}
          accountType={profile.accountType ?? null}
          isVerified={isVerified}
          isVerifiedBusiness={isVerifiedBusiness}
          createdAt={profile.createdAt ? String(profile.createdAt) : null}
        />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showShopTab={isVerifiedBusiness && !!profile.businessName}
            savedCount={favorites.length}
          />

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <ProfileEditForm
                formData={formData}
                isNameLocked={isNameLocked}
                profile={profile}
                activeShopSlug={activeShopSlug}
                lang={lang}
                unsavedChanges={unsavedChanges}
                saving={saving}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/${lang}/dashboard`)}
                onGoToSecurity={() => setActiveTab('security')}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                isPhoneVerified={profile.phoneVerified ?? false}
                currentPhone={profile.phone ?? null}
                canChangePassword={profile.hasPassword ?? false}
                onPhoneVerified={handleSecuritySuccess}
              />
            )}

            {activeTab === 'shop' && isVerifiedBusiness && profile.businessName && (
              <ShopTab
                businessName={profile.businessName}
                displayName={displayName}
                customShopSlug={profile.customShopSlug ?? null}
                fallbackShopSlug={fallbackShopSlug}
                lang={lang}
                onSuccess={handleShopSuccess}
              />
            )}

            {activeTab === 'saved' && (
              <SavedAdsTab
                favorites={favorites}
                loading={favoritesLoading}
                lang={lang}
                onRemoveFavorite={removeFavorite}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
