'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useProfileData } from '@/hooks/useProfileData';
import {
  ProfileHeader,
  ProfileTabs,
  SecurityTab,
  ShopTab,
  SavedAdsTab,
  TabType,
} from '@/components/profile';

interface LocationOption {
  id: number;
  name: string;
  type: string;
}

interface FavoriteAd {
  id: number;
  adId: number;
  createdAt: string;
  ad: {
    id: number;
    title: string;
    slug: string;
    price: number | null;
    primaryImage: string | null;
    category: { name: string } | null;
    location: { name: string } | null;
  };
}

export default function ProfilePage() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useProfileData({
    enabled: status === 'authenticated',
  });
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [formData, setFormData] = useState({
    name: '',
    locationId: '',
  });

  // Saved Ads (Favorites) state
  const [favorites, setFavorites] = useState<FavoriteAd[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  const isLoading = status === 'loading' || profileLoading || locationsLoading;

  const displayName = useMemo(() => {
    if (!profile) return '';
    const businessVerified =
      profile.businessVerificationStatus === 'approved' ||
      profile.businessVerificationStatus === 'verified';
    if (businessVerified && profile.businessName) {
      return profile.businessName;
    }
    if (profile.individualVerified && profile.verifiedSellerName) {
      return profile.verifiedSellerName;
    }
    return profile.fullName || '';
  }, [profile]);

  const fallbackShopSlug = useMemo(() => {
    if (!profile) return '';
    const baseName = (profile.businessName || displayName || 'shop')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-');
    return `${baseName}-${profile.id}`;
  }, [profile, displayName]);

  const activeShopSlug = profile?.customShopSlug || fallbackShopSlug;

  const isVerifiedBusiness = profile?.businessVerificationStatus === 'approved' || profile?.businessVerificationStatus === 'verified';
  const isVerified = profile?.individualVerified || isVerifiedBusiness;

  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      const response = await apiClient.getLocations({ type: 'municipality' });
      if (response.success && response.data) {
        setLocations(response.data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      setFavoritesLoading(true);
      const response = await fetch('/api/favorites', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.data) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  const removeFavorite = async (adId: number) => {
    try {
      const response = await fetch(`/api/favorites/${adId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setFavorites(prev => prev.filter(f => f.adId !== adId));
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }
    return undefined;
  }, [status, router, lang]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations();
      fetchFavorites();
    }
  }, [status, fetchLocations, fetchFavorites]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFormData({
      name: displayName,
      locationId: profile.locationId ? String(profile.locationId) : '',
    });
  }, [profile, displayName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiClient.updateProfile({
        fullName: formData.name,
      });

      if (response.success && response.data) {
        const updatedUser = response.data;

        setFormData({
          name: updatedUser.fullName || formData.name,
          locationId: updatedUser.locationId ? String(updatedUser.locationId) : formData.locationId,
        });

        setUnsavedChanges(false);
        setSuccessMessage('Profile updated successfully!');
        await refreshProfile();

        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.fullName,
            phone: updatedUser.phone,
          },
        });

        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySuccess = async () => {
    await refreshProfile();
    await update();
  };

  const handleShopSuccess = async () => {
    await refreshProfile();
    await update();
  };

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

  const isNameLocked = profile.individualVerified || profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified';

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
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
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
            {/* Profile Tab */}
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

            {/* Security Tab */}
            {activeTab === 'security' && (
              <SecurityTab
                isPhoneVerified={profile.phoneVerified ?? false}
                currentPhone={profile.phone ?? null}
                canChangePassword={profile.hasPassword ?? false}
                onPhoneVerified={handleSecuritySuccess}
              />
            )}

            {/* Shop Tab */}
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

            {/* Saved Tab */}
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

// Profile Edit Form Component
interface ProfileEditFormProps {
  formData: { name: string; locationId: string };
  isNameLocked: boolean;
  profile: {
    oauthProvider?: string | null;
    email?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    location?: { name: string } | null;
  };
  activeShopSlug: string;
  lang: string;
  unsavedChanges: boolean;
  saving: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onGoToSecurity: () => void;
}

function ProfileEditForm({
  formData,
  isNameLocked,
  profile,
  activeShopSlug,
  lang,
  unsavedChanges,
  saving,
  onInputChange,
  onSubmit,
  onCancel,
  onGoToSecurity,
}: ProfileEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
            {isNameLocked && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Locked
              </span>
            )}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            disabled={isNameLocked}
            required
            className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors ${
              isNameLocked
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-white border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
            }`}
            placeholder="Enter your full name"
          />
          {isNameLocked && (
            <p className="mt-1.5 text-xs text-gray-500">
              Name is locked due to verification status
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
            <span className="ml-2 text-xs font-normal text-gray-500">(Cannot be changed)</span>
          </label>
          {profile.oauthProvider === 'google' && (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Signed in with Google
            </div>
          )}
          <input
            type="email"
            value={profile.email || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Phone Field - Read-only, managed via Security tab */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          {profile.phoneVerified && profile.phone ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-900">{profile.phone}</span>
                <span className="text-xs text-green-600 font-medium">Verified</span>
              </div>
              <button
                type="button"
                onClick={onGoToSecurity}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Phone not verified</p>
                  <p className="text-xs text-amber-700 mt-0.5">Required to post ads and apply for verification badges</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onGoToSecurity}
                className="mt-2 w-full px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Verify Phone Number
              </button>
            </div>
          )}
        </div>

        {/* Location Field - Read-only, managed via Shop page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          {profile.location ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-gray-900">{profile.location.name}</span>
              </div>
              <a
                href={`/${lang}/shop/${activeShopSlug}`}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                Edit in Shop
              </a>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">No location set</p>
                  <a
                    href={`/${lang}/shop/${activeShopSlug}`}
                    className="text-xs text-primary hover:text-primary-hover font-medium"
                  >
                    Set location in your Shop page
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">You have unsaved changes</p>
            <p className="text-xs text-amber-700 mt-0.5">Save your changes before leaving this page.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!unsavedChanges || saving}
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
}
