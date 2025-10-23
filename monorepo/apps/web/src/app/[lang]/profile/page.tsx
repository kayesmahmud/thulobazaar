'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

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
        setProfile({
          id: userData.id,
          fullName: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          locationId: userData.locationId || null,
          individualVerified: userData.individualVerified || false,
          businessVerificationStatus: userData.businessVerificationStatus || null,
          createdAt: userData.createdAt || new Date().toISOString(),
        });

        setFormData({
          name: userData.name || '',
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
        setProfile({
          id: updatedUser.id,
          fullName: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          locationId: updatedUser.locationId || null,
          individualVerified: updatedUser.individualVerified || false,
          businessVerificationStatus: updatedUser.businessVerificationStatus || null,
          createdAt: updatedUser.createdAt || new Date().toISOString(),
        });

        setFormData({
          name: updatedUser.name || '',
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
            name: updatedUser.name,
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
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#dc2626' }}>Failed to load profile</p>
        </div>
      </div>
    );
  }

  const isNameLocked = profile.individualVerified || profile.businessVerificationStatus === 'approved';

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 0'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <Link href={`/${lang}`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Home
            </Link>
            <span>/</span>
            <Link href={`/${lang}/dashboard`} style={{ color: '#667eea', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <span>/</span>
            <span>Profile</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Success Message */}
        {successMessage && (
          <div style={{
            backgroundColor: '#22c55e',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#dc1e4a',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Form */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#1e293b' }}>
            Profile Information
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
                fontSize: '14px'
              }}>
                Full Name *
                {isNameLocked && (
                  <span style={{
                    color: '#64748b',
                    fontWeight: '400',
                    marginLeft: '8px',
                    fontSize: '12px'
                  }}>
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
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: isNameLocked ? '#f1f5f9' : 'white',
                  cursor: isNameLocked ? 'not-allowed' : 'text',
                  color: isNameLocked ? '#64748b' : '#1e293b'
                }}
                placeholder="Enter your full name"
              />
              {isNameLocked && (
                <div style={{
                  color: '#64748b',
                  fontSize: '13px',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🔒 Your name is locked because you have a verified badge
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
                fontSize: '14px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'not-allowed'
                }}
              />
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Email cannot be changed
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
                fontSize: '14px'
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
                fontSize: '14px'
              }}>
                Location
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => handleInputChange('locationId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
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
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => router.push(`/${lang}/dashboard`)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#64748b'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !unsavedChanges}
                style={{
                  padding: '12px 24px',
                  backgroundColor: unsavedChanges ? '#dc1e4a' : '#cbd5e1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: unsavedChanges ? 'pointer' : 'not-allowed',
                  fontSize: '15px',
                  fontWeight: '500',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {unsavedChanges && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                ⚠️ You have unsaved changes
              </div>
            )}
          </form>
        </div>

        {/* Account Info */}
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#64748b' }}>
            Account Information
          </h3>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            <div style={{ marginBottom: '8px' }}>
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
