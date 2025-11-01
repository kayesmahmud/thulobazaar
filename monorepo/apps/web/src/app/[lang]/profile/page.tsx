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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${lang}/auth/login`);
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
          createdAt: userData.createdAt || new Date().toISOString(),
        });

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
