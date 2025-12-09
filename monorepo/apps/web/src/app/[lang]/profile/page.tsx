'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useProfileData } from '@/hooks/useProfileData';
import { formatPrice } from '@thulobazaar/utils';

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

type TabType = 'profile' | 'security' | 'shop' | 'saved';

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

  // Custom shop URL state
  const [customShopSlug, setCustomShopSlug] = useState('');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);

  // Saved Ads (Favorites) state
  const [favorites, setFavorites] = useState<FavoriteAd[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Phone Verification state
  const [phoneVerifyStep, setPhoneVerifyStep] = useState<'idle' | 'enter_phone' | 'enter_otp'>('idle');
  const [phoneToVerify, setPhoneToVerify] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerifyError, setPhoneVerifyError] = useState('');
  const [phoneVerifySuccess, setPhoneVerifySuccess] = useState('');
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

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

    setCustomShopSlug(profile.customShopSlug || fallbackShopSlug);
  }, [profile, displayName, fallbackShopSlug]);

  // Check if shop slug is available
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.trim() === '') {
      setSlugAvailability('idle');
      setSuggestedSlugs([]);
      return;
    }

    setSlugAvailability('checking');

    try {
      const response = await apiClient.checkShopSlugAvailability(slug);

      if (response.success) {
        if (response.data.available) {
          setSlugAvailability('available');
          setSuggestedSlugs([]);
        } else {
          setSlugAvailability('taken');
          const suggestions = [];
          const baseSlug = slug.replace(/-\d+$/, '');
          for (let i = 1; i <= 5; i++) {
            suggestions.push(`${baseSlug}-${i}`);
          }
          setSuggestedSlugs(suggestions);
        }
      }
    } catch (err) {
      console.error('Error checking slug availability:', err);
      setSlugAvailability('idle');
    }
  };

  // Save custom shop slug
  const saveCustomSlug = async () => {
    if (slugAvailability !== 'available') {
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.updateShopSlug(customShopSlug);

      if (response.success) {
        setSuccessMessage('Shop URL updated successfully!');
        setIsEditingSlug(false);
        await refreshProfile();
        await update();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.message || 'Failed to update shop URL');
      }
    } catch (err) {
      console.error('Error saving shop slug:', err);
      setError('Failed to update shop URL');
    } finally {
      setSaving(false);
    }
  };

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
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 5000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Check if user can change password (has password_hash, not OAuth-only)
  const canChangePassword = profile?.hasPassword;

  // OTP cooldown effect
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Send OTP to phone for verification
  const handleSendPhoneOtp = async () => {
    if (!phoneToVerify || phoneToVerify.length < 10) {
      setPhoneVerifyError('Please enter a valid phone number');
      return;
    }

    setSendingPhoneOtp(true);
    setPhoneVerifyError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          purpose: 'phone_verification',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPhoneVerifyStep('enter_otp');
        setOtpCooldown(60);
        setPhoneVerifyError('');
      } else {
        setPhoneVerifyError(data.message || 'Failed to send OTP');
        if (data.cooldownRemaining) {
          setOtpCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error('Send phone OTP error:', err);
      setPhoneVerifyError('Failed to send OTP. Please try again.');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  // Verify phone OTP and update phone
  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneVerifyError('Please enter the 6-digit OTP');
      return;
    }

    setVerifyingPhone(true);
    setPhoneVerifyError('');

    try {
      // First verify the OTP
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          otp: phoneOtp,
          purpose: 'phone_verification',
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setPhoneVerifyError(verifyData.message || 'Invalid OTP');
        setVerifyingPhone(false);
        return;
      }

      // Now update the phone number
      const updateResponse = await fetch('/api/auth/update-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: phoneToVerify,
          verificationToken: verifyData.verificationToken,
        }),
      });

      const updateData = await updateResponse.json();

      if (updateData.success) {
        setPhoneVerifySuccess('Phone number verified successfully!');
        setPhoneVerifyStep('idle');
        setPhoneToVerify('');
        setPhoneOtp('');
        await refreshProfile();
        setTimeout(() => setPhoneVerifySuccess(''), 5000);
      } else {
        setPhoneVerifyError(updateData.message || 'Failed to update phone number');
      }
    } catch (err) {
      console.error('Verify phone error:', err);
      setPhoneVerifyError('Failed to verify phone. Please try again.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  // Format phone number for display (mask middle digits)
  const formatPhoneDisplay = (phone: string | null | undefined) => {
    if (!phone) return '';
    if (phone.length < 10) return phone;
    return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
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
      {/* Header */}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-primary to-pink-500"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="relative">
                <UserAvatar
                  src={profile.avatar}
                  name={displayName}
                  size="2xl"
                  borderColor={isVerifiedBusiness ? 'gold' : isVerified ? 'blue' : 'default'}
                />
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 sm:pb-2">
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-gray-500">{profile.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    profile.accountType === 'business'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile.accountType === 'business' ? 'Business' : 'Individual'} Account
                  </span>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    Member since {new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden sm:inline">Profile</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="hidden sm:inline">Security</span>
                </span>
              </button>
              {isVerifiedBusiness && profile.businessName && (
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'shop'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="hidden sm:inline">Shop</span>
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="hidden sm:inline">Saved ({favorites.length})</span>
                  <span className="sm:hidden text-xs">{favorites.length}</span>
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
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
                          onClick={() => setActiveTab('security')}
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
                          onClick={() => setActiveTab('security')}
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
                    onClick={() => router.push(`/${lang}/dashboard`)}
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
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Phone Verification Section */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Phone Verification</h3>
                    <p className="text-sm text-gray-500">Verify your phone number to post ads and contact sellers</p>
                  </div>

                  {phoneVerifySuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {phoneVerifySuccess}
                    </div>
                  )}

                  {profile.phoneVerified ? (
                    // Phone is verified - show verified status with change option
                    <div className="max-w-md">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{formatPhoneDisplay(profile.phone)}</p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPhoneVerifyStep('enter_phone');
                            setPhoneToVerify('');
                            setPhoneOtp('');
                            setPhoneVerifyError('');
                          }}
                          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                        >
                          Change
                        </button>
                      </div>

                      {phoneVerifyStep !== 'idle' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          {phoneVerifyStep === 'enter_phone' && (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">Enter your new phone number to verify:</p>
                              {phoneVerifyError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                  {phoneVerifyError}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="tel"
                                  value={phoneToVerify}
                                  onChange={(e) => setPhoneToVerify(e.target.value.replace(/\D/g, ''))}
                                  placeholder="98XXXXXXXX"
                                  maxLength={10}
                                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                  onClick={handleSendPhoneOtp}
                                  disabled={sendingPhoneOtp || phoneToVerify.length < 10 || otpCooldown > 0}
                                  className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {sendingPhoneOtp ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send OTP'}
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  setPhoneVerifyStep('idle');
                                  setPhoneVerifyError('');
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {phoneVerifyStep === 'enter_otp' && (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to {phoneToVerify}:</p>
                              {phoneVerifyError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                  {phoneVerifyError}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={phoneOtp}
                                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="000000"
                                  maxLength={6}
                                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <button
                                  onClick={handleVerifyPhoneOtp}
                                  disabled={verifyingPhone || phoneOtp.length !== 6}
                                  className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {verifyingPhone ? 'Verifying...' : 'Verify'}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => {
                                    setPhoneVerifyStep('enter_phone');
                                    setPhoneOtp('');
                                    setPhoneVerifyError('');
                                  }}
                                  className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                  Change number
                                </button>
                                <button
                                  onClick={handleSendPhoneOtp}
                                  disabled={sendingPhoneOtp || otpCooldown > 0}
                                  className="text-sm text-primary hover:text-primary-hover disabled:text-gray-400"
                                >
                                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Phone not verified - show verification form
                    <div className="max-w-md">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-amber-800">Phone not verified</p>
                            <p className="text-xs text-amber-700 mt-0.5">Verify your phone to post ads and contact sellers securely.</p>
                          </div>
                        </div>
                      </div>

                      {phoneVerifyError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                          {phoneVerifyError}
                        </div>
                      )}

                      {phoneVerifyStep === 'idle' || phoneVerifyStep === 'enter_phone' ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="tel"
                                value={phoneToVerify}
                                onChange={(e) => setPhoneToVerify(e.target.value.replace(/\D/g, ''))}
                                placeholder="98XXXXXXXX"
                                maxLength={10}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                              />
                              <button
                                onClick={handleSendPhoneOtp}
                                disabled={sendingPhoneOtp || phoneToVerify.length < 10 || otpCooldown > 0}
                                className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {sendingPhoneOtp ? 'Sending...' : otpCooldown > 0 ? `Wait ${otpCooldown}s` : 'Send OTP'}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">Enter your 10-digit Nepali phone number (starting with 97 or 98)</p>
                          </div>
                        </div>
                      ) : phoneVerifyStep === 'enter_otp' ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Enter OTP sent to {phoneToVerify}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={phoneOtp}
                                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-center tracking-[0.5em] font-mono focus:border-primary focus:ring-2 focus:ring-primary/20"
                              />
                              <button
                                onClick={handleVerifyPhoneOtp}
                                disabled={verifyingPhone || phoneOtp.length !== 6}
                                className="px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {verifyingPhone ? 'Verifying...' : 'Verify'}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setPhoneVerifyStep('enter_phone');
                                setPhoneOtp('');
                                setPhoneVerifyError('');
                              }}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Change number
                            </button>
                            <button
                              onClick={handleSendPhoneOtp}
                              disabled={sendingPhoneOtp || otpCooldown > 0}
                              className="text-sm text-primary hover:text-primary-hover disabled:text-gray-400"
                            >
                              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Change Password Section */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h3>
                    <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                  </div>

                  {canChangePassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {passwordError}
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {passwordSuccess}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          required
                          minLength={8}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                          placeholder="Enter new password (min 8 characters)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          required
                          minLength={8}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                          placeholder="Confirm new password"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {changingPassword ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center max-w-md">
                      <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Password Not Available</h4>
                      <p className="text-sm text-gray-600">
                        You signed in with Google. Password change is not available for social login accounts.
                      </p>
                    </div>
                  )}
                </div>

                {/* Security Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Security Tips
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use a strong password with at least 8 characters</li>
                    <li>• Include uppercase, lowercase, numbers, and special characters</li>
                    <li>• Never share your password with anyone</li>
                    <li>• Don&apos;t use the same password on multiple sites</li>
                    <li>• Keep your verified phone number up to date</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Shop Tab */}
            {activeTab === 'shop' && isVerifiedBusiness && profile.businessName && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{profile.businessName}</h3>
                    <p className="text-sm text-gray-600">Your verified business shop page</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>

                {/* Shop URL Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shop URL</label>
                  {!isEditingSlug ? (
                    <div className="flex items-center gap-3">
                      <code className="flex-1 text-sm font-mono text-gray-700 bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200 truncate">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/{lang}/shop/{activeShopSlug}
                      </code>
                      <button
                        onClick={() => {
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${activeShopSlug}`;
                          navigator.clipboard.writeText(url);
                          setSuccessMessage('URL copied!');
                          setTimeout(() => setSuccessMessage(''), 2000);
                        }}
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Copy URL"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingSlug(true);
                          setCustomShopSlug(profile.customShopSlug || fallbackShopSlug);
                        }}
                        className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
                          <span className="px-3 py-2.5 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                            /{lang}/shop/
                          </span>
                          <input
                            type="text"
                            value={customShopSlug}
                            onChange={(e) => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                              setCustomShopSlug(value);
                            }}
                            onBlur={() => checkSlugAvailability(customShopSlug)}
                            placeholder="your-shop-name"
                            className="flex-1 px-3 py-2.5 text-sm outline-none border-none focus:ring-0"
                          />
                        </div>
                        <button
                          onClick={() => checkSlugAvailability(customShopSlug)}
                          disabled={slugAvailability === 'checking'}
                          className="px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-hover transition-colors disabled:opacity-50"
                        >
                          {slugAvailability === 'checking' ? 'Checking...' : 'Check'}
                        </button>
                      </div>

                      {slugAvailability === 'available' && (
                        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-lg border border-green-200">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          This URL is available!
                        </div>
                      )}

                      {slugAvailability === 'taken' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-4 py-2.5 rounded-lg border border-red-200">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            This URL is already taken
                          </div>
                          {suggestedSlugs.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Try these alternatives:</p>
                              <div className="flex flex-wrap gap-2">
                                {suggestedSlugs.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    onClick={() => {
                                      setCustomShopSlug(suggestion);
                                      checkSlugAvailability(suggestion);
                                    }}
                                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-mono"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={saveCustomSlug}
                          disabled={slugAvailability !== 'available' || saving}
                          className="px-5 py-2.5 bg-success text-white font-medium rounded-lg hover:bg-success-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Saving...' : 'Save URL'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingSlug(false);
                            setSlugAvailability('idle');
                            setSuggestedSlugs([]);
                            setCustomShopSlug(activeShopSlug);
                          }}
                          className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shop Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                  <Link
                    href={`/${lang}/shop/${activeShopSlug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Shop
                  </Link>
                  <button
                    onClick={() => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${activeShopSlug}`;
                      if (navigator.share) {
                        navigator.share({
                          title: `${displayName} - Shop`,
                          text: `Visit ${displayName} on ThuLoBazaar`,
                          url: url,
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url);
                        setSuccessMessage('Shop URL copied!');
                        setTimeout(() => setSuccessMessage(''), 2000);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Shop
                  </button>
                </div>

                {/* Shop Features */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Shop Features</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['Golden verified badge', 'Custom shop URL', 'All your listings', 'Business information'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                {favoritesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved ads yet</h3>
                    <p className="text-gray-500 mb-6">Save ads you like by clicking the heart icon</p>
                    <Link
                      href={`/${lang}/search`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Browse Ads
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 relative">
                          {fav.ad.primaryImage ? (
                            <Image
                              src={`/${fav.ad.primaryImage}`}
                              alt={fav.ad.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${lang}/ad/${fav.ad.slug}`}
                            className="text-gray-900 font-medium hover:text-primary transition-colors line-clamp-1 block"
                          >
                            {fav.ad.title}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            {fav.ad.category && <span>{fav.ad.category.name}</span>}
                            {fav.ad.category && fav.ad.location && <span>•</span>}
                            {fav.ad.location && <span>{fav.ad.location.name}</span>}
                          </div>
                          {fav.ad.price && (
                            <div className="text-base font-bold text-green-600 mt-1">
                              {formatPrice(fav.ad.price)}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Link
                              href={`/${lang}/ad/${fav.ad.slug}`}
                              className="text-xs text-primary hover:text-primary-hover font-medium"
                            >
                              View Ad
                            </Link>
                            <button
                              onClick={() => removeFavorite(fav.adId)}
                              className="text-xs text-gray-500 hover:text-red-600 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
