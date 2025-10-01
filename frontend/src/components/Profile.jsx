import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import Header from './Header';
import Cropper from 'react-easy-crop';

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
    bio: '',
    phone: '',
    location_id: ''
  });

  // Image upload states
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Image cropper states
  const [cropperModal, setCropperModal] = useState({ isOpen: false, type: null, imageSrc: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

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
    console.log('Profile useEffect - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      fetchProfileData();
      fetchLocations();
    }
  }, [isAuthenticated]);

  const fetchProfileData = async () => {
    console.log('Profile - fetchProfileData called');
    try {
      setLoading(true);
      const data = await ApiService.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        bio: data.bio || '',
        phone: data.phone || '',
        location_id: data.location_id || ''
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
      const response = await ApiService.updateProfile(formData);
      setProfile(response.data);
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

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Avatar must be less than 2MB');
        e.target.value = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        e.target.value = '';
        return;
      }

      // Show cropper modal
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'avatar', imageSrc: reader.result });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    setError(null);

    try {
      const response = await ApiService.uploadAvatar(file);
      setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
      setSuccessMessage('Avatar uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Cover photo must be less than 5MB');
        e.target.value = '';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        e.target.value = '';
        return;
      }

      // Show cropper modal
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'cover', imageSrc: reader.result });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const uploadCover = async (file) => {
    setUploadingCover(true);
    setError(null);

    try {
      const response = await ApiService.uploadCoverPhoto(file);
      setProfile(prev => ({ ...prev, cover_photo: response.data.cover_photo }));
      setSuccessMessage('Cover photo uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error uploading cover photo:', err);
      setError(err.message || 'Failed to upload cover photo');
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      await ApiService.removeAvatar();
      setProfile(prev => ({ ...prev, avatar: null }));
      setAvatarPreview(null);
      setSuccessMessage('Avatar removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error removing avatar:', err);
      setError(err.message || 'Failed to remove avatar');
    }
  };

  const handleRemoveCover = async () => {
    if (!window.confirm('Are you sure you want to remove your cover photo?')) {
      return;
    }

    try {
      await ApiService.removeCoverPhoto();
      setProfile(prev => ({ ...prev, cover_photo: null }));
      setCoverPreview(null);
      setSuccessMessage('Cover photo removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error removing cover photo:', err);
      setError(err.message || 'Failed to remove cover photo');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Cropper callbacks
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Utility function to create image from URL
  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  // Function to get cropped image as blob
  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(cropperModal.imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' });

      if (cropperModal.type === 'avatar') {
        await uploadAvatar(file);
      } else {
        await uploadCover(file);
      }

      setCropperModal({ isOpen: false, type: null, imageSrc: null });
    } catch (err) {
      console.error('Error cropping image:', err);
      setError('Failed to process image');
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

  const bioCharCount = formData.bio.length;
  const bioMaxChars = 500;

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

        {/* Cover Photo Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          {/* Cover Photo */}
          <div style={{
            position: 'relative',
            height: '300px',
            background: profile.cover_photo || coverPreview
              ? `url(${coverPreview || `http://localhost:5000/uploads/covers/${profile.cover_photo}`})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            {uploadingCover && (
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '16px'
              }}>
                Uploading...
              </div>
            )}

            {/* Cover Photo Actions */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={() => coverInputRef.current?.click()}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                📷 {profile.cover_photo ? 'Change Cover' : 'Add Cover'}
              </button>
              {profile.cover_photo && (
                <button
                  onClick={handleRemoveCover}
                  style={{
                    backgroundColor: 'rgba(220,30,74,0.9)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverSelect}
            />
          </div>

          {/* Avatar Section */}
          <div style={{ padding: '0 30px', marginTop: '-75px', marginBottom: '20px' }}>
            <div style={{
              position: 'relative',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              border: '5px solid white',
              backgroundColor: '#e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              {profile.avatar || avatarPreview ? (
                <img
                  src={avatarPreview || `http://localhost:5000/uploads/avatars/${profile.avatar}`}
                  alt={profile.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#64748b',
                  backgroundColor: '#f1f5f9'
                }}>
                  {getInitials(profile.name)}
                </div>
              )}

              {uploadingAvatar && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  Uploading...
                </div>
              )}

              {/* Avatar Change Button */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ededed',
                  border: '3px solid white',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
            </div>

            {profile.avatar && (
              <button
                onClick={handleRemoveAvatar}
                style={{
                  marginTop: '10px',
                  backgroundColor: 'transparent',
                  color: '#dc1e4a',
                  border: '1px solid #dc1e4a',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>

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
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your full name"
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#334155',
                fontSize: '14px'
              }}>
                Bio
                <span style={{ color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
                  ({bioCharCount}/{bioMaxChars})
                </span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => {
                  if (e.target.value.length <= bioMaxChars) {
                    handleInputChange('bio', e.target.value);
                  }
                }}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Tell us about yourself..."
              />
              {bioCharCount >= bioMaxChars && (
                <div style={{ color: '#dc1e4a', fontSize: '13px', marginTop: '4px' }}>
                  Character limit reached
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
                value={formData.location_id}
                onChange={(e) => handleInputChange('location_id', e.target.value)}
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

      {/* Image Cropper Modal */}
      {cropperModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>
              {cropperModal.type === 'avatar' ? 'Crop Profile Picture' : 'Crop Cover Photo'}
            </h2>
            <button
              onClick={() => setCropperModal({ isOpen: false, type: null, imageSrc: null })}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '32px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>

          {/* Cropper Area */}
          <div style={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
            <Cropper
              image={cropperModal.imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropperModal.type === 'avatar' ? 1 : 16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape={cropperModal.type === 'avatar' ? 'round' : 'rect'}
            />
          </div>

          {/* Controls */}
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white'
          }}>
            {/* Zoom Slider */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#dc1e4a'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCropperModal({ isOpen: false, type: null, imageSrc: null })}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={uploadingAvatar || uploadingCover}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc1e4a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: uploadingAvatar || uploadingCover ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  opacity: uploadingAvatar || uploadingCover ? 0.7 : 1
                }}
              >
                {uploadingAvatar || uploadingCover ? 'Uploading...' : 'Save & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;