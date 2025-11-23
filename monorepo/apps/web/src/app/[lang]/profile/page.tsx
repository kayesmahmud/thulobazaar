// @ts-nocheck
'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';

interface ProfilePageProps {
  params: Promise<{ lang: string }>;
}

interface ProfileData {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  locationId: number | null;
  individualVerified: boolean;
  businessVerificationStatus: string | null;
  businessName: string | null;
  verifiedSellerName: string | null;
  accountType: string | null;
  customShopSlug: string | null;
  createdAt: string;
}

interface Location {
  id: number;
  name: string;
  type: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { lang } = use(params);
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    locationId: '',
  });

  // Custom shop URL state
  const [customShopSlug, setCustomShopSlug] = useState('');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestedSlugs, setSuggestedSlugs] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/signin`);
      return;
    }
  }, [status, router, lang]);

  // Fetch profile and locations
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfileData();
      fetchLocations();
    }
  }, [status, session]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMe();

      if (response.success && response.data) {
        const userData = response.data;

        // Determine the display name based on verification status
        let displayName = userData.fullName || '';
        const isBusinessVerified = userData.businessVerificationStatus === 'approved' || userData.businessVerificationStatus === 'verified';
        const isIndividualVerified = userData.individualVerified;

        if (isBusinessVerified && userData.businessName) {
          displayName = userData.businessName;
        } else if (isIndividualVerified && userData.verifiedSellerName) {
          displayName = userData.verifiedSellerName;
        }

        setProfile({
          id: userData.id,
          fullName: displayName,
          email: userData.email || '',
          phone: userData.phone || '',
          locationId: userData.locationId || null,
          individualVerified: isIndividualVerified,
          businessVerificationStatus: userData.businessVerificationStatus || null,
          businessName: userData.businessName || null,
          verifiedSellerName: userData.verifiedSellerName || null,
          accountType: userData.accountType || null,
          customShopSlug: userData.customShopSlug || null,
          createdAt: userData.createdAt || new Date().toISOString(),
        });

        // Initialize custom shop slug from profile data
        if (userData.customShopSlug) {
          setCustomShopSlug(userData.customShopSlug);
        }

        setFormData({
          name: displayName,
          phone: userData.phone || '',
          locationId: userData.locationId ? String(userData.locationId) : '',
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiClient.getLocations({ type: 'municipality' });
      if (response.success && response.data) {
        setLocations(response.data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

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
          // Generate suggestions
          const suggestions = [];
          const baseSlug = slug.replace(/-\d+$/, ''); // Remove any existing number suffix
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
        // Refresh profile to get updated slug
        await fetchProfileData();
        // Refresh NextAuth session to update header
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
        name: formData.name,
        phone: formData.phone || null,
        location_id: formData.locationId ? parseInt(formData.locationId, 10) : null,
      });

      if (response.success && response.data) {
        const updatedUser = response.data;

        // Preserve verification data from current profile since API might not return it
        setProfile(prev => ({
          ...prev!,
          fullName: updatedUser.fullName || prev!.fullName,
          email: updatedUser.email || prev!.email,
          phone: updatedUser.phone || prev!.phone,
          locationId: updatedUser.locationId !== undefined ? updatedUser.locationId : prev!.locationId,
        }));

        setFormData({
          name: updatedUser.fullName || formData.name,
          phone: updatedUser.phone || '',
          locationId: updatedUser.locationId ? String(updatedUser.locationId) : '',
        });

        setUnsavedChanges(false);
        setSuccessMessage('Profile updated successfully!');

        // Update session with new data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: updatedUser.fullName,
            phone: updatedUser.phone,
          },
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">Failed to load profile</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isNameLocked = profile.individualVerified || profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
              <Link href={`/${lang}`} className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
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
              <span className="text-primary font-medium">Profile Settings</span>
            </nav>

            {/* Quick Actions */}
            <Link
              href={`/${lang}/dashboard`}
              className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header Gradient */}
              <div className="h-24 bg-gradient-to-r from-primary via-pink-500 to-orange-500"></div>

              {/* Profile Content */}
              <div className="px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-pink-500 p-1 mx-auto">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-primary">
                      {profile.fullName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  {/* Verification Badge */}
                  {(profile.individualVerified || profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified') && (
                    <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-2 w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{profile.fullName}</h2>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">#{profile.id}</div>
                    <div className="text-xs text-gray-500 mt-1">User ID</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {profile.individualVerified || profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified' ? '✓' : '○'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Verified</div>
                  </div>
                </div>

                {/* Account Type Badge */}
                <div className="mt-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200 w-full justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-700">
                      {profile.accountType === 'business' ? 'Business Account' : 'Individual Account'}
                    </span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">Member since</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Form */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile Information
                </h2>
                <p className="text-sm text-gray-300 mt-1">Update your personal details and contact information</p>
              </div>

              {/* Card Body */}
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                    {isNameLocked && (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Locked
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={isNameLocked}
                      required
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl text-sm transition-all ${
                        isNameLocked
                          ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {isNameLocked && (
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Name is locked because you have a verified badge
                    </p>
                  )}
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                    <span className="ml-2 text-xs font-normal text-gray-500">(Cannot be changed)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                    <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="+977 98XXXXXXXX"
                    />
                  </div>
                </div>

                {/* Location Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                    <span className="ml-2 text-xs font-normal text-gray-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <select
                      value={formData.locationId}
                      onChange={(e) => handleInputChange('locationId', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none bg-white cursor-pointer"
                    >
                      <option value="">Select your location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Unsaved Changes Warning */}
                {unsavedChanges && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-amber-900">You have unsaved changes</h4>
                        <p className="text-xs text-amber-700 mt-1">Don't forget to save your changes before leaving this page.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => router.push(`/${lang}/dashboard`)}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!unsavedChanges || saving}
                    className="px-8 py-2.5 bg-gradient-to-r from-primary to-pink-600 text-white font-semibold rounded-xl hover:from-primary-hover hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Business Shop Page - Only for verified business users - KEEPING THIS SECTION AS IS */}
            {(profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified') && profile.businessName && (
              <div className="mt-5 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border-2 border-purple-200 rounded-xl shadow-md">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">🏪</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="m-0 text-xl font-bold text-purple-900">
                        Your Shop Page
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md">
                        ⭐ VERIFIED
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mb-4">
                      Your business is verified! Customers can now visit your dedicated shop page.
                    </p>

                    {/* Custom Shop URL Editor */}
                    <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-purple-700">Customize Your Shop URL:</div>
                        {!isEditingSlug && (
                          <button
                            onClick={() => {
                              setIsEditingSlug(true);
                              setCustomShopSlug(profile.businessName?.toLowerCase().replace(/\s+/g, '-') || '');
                            }}
                            className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline"
                          >
                            Edit URL
                          </button>
                        )}
                      </div>

                      {!isEditingSlug ? (
                        /* Display Mode */
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-purple-900 bg-purple-100 px-3 py-1.5 rounded border border-purple-300">
                            {typeof window !== 'undefined' ? window.location.origin : ''}/{lang}/shop/{profile.customShopSlug || `${profile.businessName?.toLowerCase().replace(/\s+/g, '-')}-${profile.id}`}
                          </code>
                          <button
                            onClick={() => {
                              const shopSlug = profile.customShopSlug || `${profile.businessName?.toLowerCase().replace(/\s+/g, '-')}-${profile.id}`;
                              const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${shopSlug}`;
                              navigator.clipboard.writeText(url);
                              alert('Shop URL copied to clipboard!');
                            }}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                            title="Copy URL"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </button>
                        </div>
                      ) : (
                        /* Edit Mode */
                        <div className="space-y-3">
                          {/* URL Input */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                              <span className="px-3 py-2 text-xs text-gray-600 bg-gray-100 border-r border-gray-300">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/{lang}/shop/
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
                                className="flex-1 px-3 py-2 text-sm outline-none border-none focus:ring-0"
                              />
                            </div>
                            <button
                              onClick={() => checkSlugAvailability(customShopSlug)}
                              disabled={slugAvailability === 'checking'}
                              className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {slugAvailability === 'checking' ? 'Checking...' : 'Check'}
                            </button>
                          </div>

                          {/* Availability Status */}
                          {slugAvailability === 'available' && (
                            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold">✓ Available! This URL is free to use.</span>
                            </div>
                          )}

                          {slugAvailability === 'taken' && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-semibold">✗ Not available. This URL is already taken.</span>
                              </div>
                              {suggestedSlugs.length > 0 && (
                                <div className="text-xs">
                                  <div className="text-purple-700 font-semibold mb-1.5">💡 Try these alternatives:</div>
                                  <div className="flex flex-wrap gap-2">
                                    {suggestedSlugs.map((suggestion) => (
                                      <button
                                        key={suggestion}
                                        onClick={() => {
                                          setCustomShopSlug(suggestion);
                                          checkSlugAvailability(suggestion);
                                        }}
                                        className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-300 font-mono"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={saveCustomSlug}
                              disabled={slugAvailability !== 'available' || saving}
                              className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'Saving...' : '✓ Save URL'}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingSlug(false);
                                setSlugAvailability('idle');
                                setSuggestedSlugs([]);
                              }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        href={`/${lang}/shop/${profile.customShopSlug || `${profile.businessName.toLowerCase().replace(/\s+/g, '-')}-${profile.id}`}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Your Shop
                      </Link>
                      <button
                        onClick={() => {
                          const shopSlug = profile.customShopSlug || `${profile.businessName.toLowerCase().replace(/\s+/g, '-')}-${profile.id}`;
                          const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${lang}/shop/${shopSlug}`;
                          if (navigator.share) {
                            navigator.share({
                              title: `${profile.businessName} - Shop`,
                              text: `Visit ${profile.businessName} on ThuLoBazaar`,
                              url: url,
                            }).catch(() => {});
                          } else {
                            alert('Share feature not supported on this browser. URL has been copied to clipboard!');
                            navigator.clipboard.writeText(url);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 font-semibold rounded-lg border-2 border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share Shop
                      </button>
                    </div>

                    {/* Features List */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <div className="text-xs font-bold text-purple-700 mb-2">✨ Shop Page Features:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-purple-600">
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-500">✓</span> Golden verified badge
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-500">✓</span> Custom shop URL
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-500">✓</span> All your listings
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-500">✓</span> Business information
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
