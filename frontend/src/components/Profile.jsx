import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import Header from './Header';

function Profile() {
  console.log('Profile component rendering...');
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    locationId: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(`/${language}`);
    }
    // Block editors and super_admins from accessing profile
    if (!authLoading && isAuthenticated && user && (user.role === 'editor' || user.role === 'super_admin')) {
      alert('Editors and admins cannot access user profile');
      navigate(`/${language}`);
    }
  }, [isAuthenticated, authLoading, navigate, language, user]);

  // Fetch profile and locations
  useEffect(() => {
    console.log('Profile useEffect - user:', user);
    if (user) {
      fetchProfileData();
      fetchLocations();
    }
  }, [user]);

  const fetchProfileData = async () => {
    console.log('Profile - fetchProfileData called');
    try {
      setLoading(true);
      const data = await ApiService.getProfile();
      console.log('Profile - Fetched data:', data);
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        locationId: data.location_id || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await ApiService.getLocations();
      setLocations(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setUnsavedChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Convert formData to match backend expected field names
      const dataToSend = {
        name: formData.name,
        phone: formData.phone,
        location_id: formData.locationId ? parseInt(formData.locationId, 10) : null,
      };
      console.log('Profile - Sending data to backend:', dataToSend);
      const response = await ApiService.updateProfile(dataToSend);
      console.log('Profile - Backend response:', response);

      // Update profile with new data
      const updatedUser = response.data;
      setProfile(updatedUser);
      setFormData({
        name: updatedUser.name || '',
        phone: updatedUser.phone || '',
        locationId: updatedUser.location_id || ''
      });
      setUnsavedChanges(false);
      setSuccessMessage('Profile updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Failed to load profile
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Header />

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
              onClick={() => setError(null)}
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
                {(profile.individual_verified || profile.business_verification_status === 'approved') && (
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
                disabled={profile.individual_verified || profile.business_verification_status === 'approved'}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: (profile.individual_verified || profile.business_verification_status === 'approved') ? '#f1f5f9' : 'white',
                  cursor: (profile.individual_verified || profile.business_verification_status === 'approved') ? 'not-allowed' : 'text',
                  color: (profile.individual_verified || profile.business_verification_status === 'approved') ? '#64748b' : '#1e293b'
                }}
                placeholder="Enter your full name"
              />
              {(profile.individual_verified || profile.business_verification_status === 'approved') && (
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
                onClick={() => navigate(`/${language}/dashboard`)}
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
              <strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString('en-US', {
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

export default Profile;