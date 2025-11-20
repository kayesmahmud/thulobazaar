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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  const isNameLocked = profile.individualVerified || profile.businessVerificationStatus === 'approved' || profile.businessVerificationStatus === 'verified';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex gap-2 text-sm text-gray-500">
            <Link href={`/${lang}`} className="text-indigo-500 hover:text-indigo-600">
              Home
            </Link>
            <span>/</span>
            <Link href={`/${lang}/dashboard`} className="text-indigo-500 hover:text-indigo-600">
              Dashboard
            </Link>
            <span>/</span>
            <span>Profile</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-5">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500 text-white px-5 py-3 rounded-lg mb-5 flex items-center gap-2.5">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-primary text-white px-5 py-3 rounded-lg mb-5 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="bg-transparent border-none text-white cursor-pointer text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h2 className="m-0 mb-6 text-2xl text-slate-800">
            Profile Information
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-5">
              <label className="block mb-2 font-semibold text-slate-700 text-sm">
                Full Name *
                {isNameLocked && (
                  <span className="text-slate-500 font-normal ml-2 text-xs">
                    (Locked - Verified Account)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isNameLocked}
                required
                className={`w-full p-3 border border-slate-300 rounded-lg text-base box-border ${
                  isNameLocked
                    ? 'bg-slate-100 cursor-not-allowed text-slate-500'
                    : 'bg-white cursor-text text-slate-800'
                }`}
                placeholder="Enter your full name"
              />
              {isNameLocked && (
                <div className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
                  🔒 Your name is locked because you have a verified badge
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="mb-5">
              <label className="block mb-2 font-semibold text-slate-700 text-sm">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full p-3 border border-slate-300 rounded-lg text-base box-border bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <div className="text-xs text-slate-500 mt-1">
                Email cannot be changed
              </div>
            </div>

            {/* Phone */}
            <div className="mb-5">
              <label className="block mb-2 font-semibold text-slate-700 text-sm">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-base box-border"
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            {/* Location */}
            <div className="mb-8">
              <label className="block mb-2 font-semibold text-slate-700 text-sm">
                Location
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => handleInputChange('locationId', e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-base box-border bg-white"
              >
                <option value="">Select location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${lang}/dashboard`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!unsavedChanges}
                loading={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {unsavedChanges && (
              <div className="mt-4 p-3 bg-amber-100 border border-amber-400 rounded-lg text-sm text-amber-900">
                ⚠️ You have unsaved changes
              </div>
            )}
          </form>
        </div>

        {/* Business Shop Page - Only for verified business users */}
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

        {/* Account Info */}
        <div className="mt-5 p-5 bg-white rounded-xl shadow-sm">
          <h3 className="m-0 mb-3 text-base text-slate-500">
            Account Information
          </h3>
          <div className="text-sm text-slate-400">
            <div className="mb-2">
              <strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div>
              <strong>User ID:</strong> #{profile.id}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
