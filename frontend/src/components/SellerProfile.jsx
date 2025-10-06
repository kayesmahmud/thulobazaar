import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { styles, colors, spacing, borderRadius, typography } from '../styles/theme';
import Header from './Header';
import ApiService from '../services/api';

const API_URL = 'http://localhost:5000/api';

function SellerProfile() {
  const { sellerSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutSaving, setAboutSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '',
    business_website: ''
  });
  const [contactSaving, setContactSaving] = useState(false);

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

  // Check if user is logged in
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Current logged in user:', user);
      setCurrentUserId(user.id);
    } else {
      console.log('No user logged in');
    }
  }, []);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerSlug]);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/seller/${sellerSlug}`);
      if (response.data.success) {
        setSellerData(response.data.data);
        setAboutText(response.data.data.seller.bio || '');
        setContactData({
          phone: response.data.data.seller.phone || '',
          business_website: response.data.data.seller.business_website || ''
        });
        console.log('Seller owner ID:', response.data.data.seller.id);
        console.log('Current user ID:', currentUserId);
        console.log('Show edit button?', currentUserId === response.data.data.seller.id);
      } else {
        setError('Seller not found');
      }
    } catch (err) {
      console.error('Error fetching seller profile:', err);
      setError(err.response?.data?.message || 'Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbout = async () => {
    try {
      setAboutSaving(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.put(
        `${API_URL}/seller/${sellerSlug}/about`,
        { bio: aboutText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSellerData(prev => ({
          ...prev,
          seller: { ...prev.seller, bio: aboutText }
        }));
        setIsEditingAbout(false);
      }
    } catch (err) {
      console.error('Error updating about:', err);
      alert(err.response?.data?.message || 'Failed to update about section');
    } finally {
      setAboutSaving(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      setContactSaving(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.put(
        `${API_URL}/seller/${sellerSlug}/contact`,
        contactData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSellerData(prev => ({
          ...prev,
          seller: {
            ...prev.seller,
            phone: contactData.phone,
            business_website: contactData.business_website
          }
        }));
        setIsEditingContact(false);
      }
    } catch (err) {
      console.error('Error updating contact:', err);
      alert(err.response?.data?.message || 'Failed to update contact information');
    } finally {
      setContactSaving(false);
    }
  };

  // Image upload handlers
  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Avatar must be less than 2MB');
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WebP images are allowed');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'avatar', imageSrc: reader.result });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    try {
      const response = await ApiService.uploadAvatar(file);
      setSellerData(prev => ({
        ...prev,
        seller: { ...prev.seller, avatar: response.data.avatar }
      }));
      setAvatarPreview(null);
      alert('Avatar uploaded successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Cover photo must be less than 5MB');
        e.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, PNG, and WebP images are allowed');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperModal({ isOpen: true, type: 'cover', imageSrc: reader.result });
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCover = async (file) => {
    setUploadingCover(true);
    try {
      const response = await ApiService.uploadCoverPhoto(file);
      setSellerData(prev => ({
        ...prev,
        seller: { ...prev.seller, cover_photo: response.data.cover_photo }
      }));
      setCoverPreview(null);
      alert('Cover photo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading cover photo:', err);
      alert(err.message || 'Failed to upload cover photo');
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
      setSellerData(prev => ({
        ...prev,
        seller: { ...prev.seller, avatar: null }
      }));
      setAvatarPreview(null);
      alert('Avatar removed successfully!');
    } catch (err) {
      console.error('Error removing avatar:', err);
      alert(err.message || 'Failed to remove avatar');
    }
  };

  const handleRemoveCover = async () => {
    if (!window.confirm('Are you sure you want to remove your cover photo?')) {
      return;
    }

    try {
      await ApiService.removeCoverPhoto();
      setSellerData(prev => ({
        ...prev,
        seller: { ...prev.seller, cover_photo: null }
      }));
      setCoverPreview(null);
      alert('Cover photo removed successfully!');
    } catch (err) {
      console.error('Error removing cover photo:', err);
      alert(err.message || 'Failed to remove cover photo');
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

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
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    }
  };

  const handleAdClick = (adSlug) => {
    const currentLang = window.location.pathname.split('/')[1] || 'en';
    navigate(`/${currentLang}/ad/${adSlug}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: spacing.md
            }}>👤</div>
            <p style={{ color: colors.text.secondary }}>Loading seller profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: spacing.md
            }}>❌</div>
            <h2 style={{ color: colors.text.primary, marginBottom: spacing.sm }}>Seller Not Found</h2>
            <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>{error}</p>
            <button
              onClick={() => navigate(-1)}
              style={styles.button.secondary}
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const { seller, ads, stats } = sellerData;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .seller-profile-container {
            padding: ${spacing.md} !important;
          }
          .seller-cover-photo {
            height: 200px !important;
          }
          .seller-avatar-container {
            margin-top: -30px !important;
            width: 100px !important;
          }
          .seller-avatar-image {
            width: 100px !important;
            height: 100px !important;
            border-width: 3px !important;
          }
          .seller-avatar-icon {
            width: 32px !important;
            height: 32px !important;
            bottom: 5px !important;
            right: 5px !important;
          }
          .seller-avatar-icon svg {
            width: 16px !important;
            height: 16px !important;
          }
          .seller-info-section {
            padding: 0 ${spacing.md} ${spacing.md} ${spacing.md} !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .seller-name {
            font-size: ${typography.fontSize.xl} !important;
          }
          .seller-badge {
            width: 24px !important;
            height: 24px !important;
          }
          .seller-stats {
            flex-wrap: wrap !important;
            gap: ${spacing.md} !important;
          }
          .seller-main-grid {
            grid-template-columns: 1fr !important;
          }
          .seller-ads-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .seller-avatar-container {
            width: 80px !important;
            margin-top: -25px !important;
          }
          .seller-avatar-image {
            width: 80px !important;
            height: 80px !important;
          }
          .seller-name {
            font-size: ${typography.fontSize.lg} !important;
          }
          .seller-stats {
            font-size: ${typography.fontSize.sm} !important;
          }
        }
      `}</style>
      <Header />
      <div className="seller-profile-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: spacing.xl
      }}>
        {/* Cover Photo & Avatar Container */}
        <div style={{
          ...styles.card.default,
          padding: 0,
          marginBottom: spacing.xl,
          overflow: 'visible'
        }}>
          {/* Cover Photo */}
          <div className="seller-cover-photo" style={{
            width: '100%',
            height: '300px',
            position: 'relative',
            backgroundImage: seller.cover_photo || coverPreview
              ? `url(${coverPreview || `http://localhost:5000/uploads/covers/${seller.cover_photo}`})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: `${borderRadius.lg} ${borderRadius.lg} 0 0`
          }}>
            {uploadingCover && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '16px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '12px 24px',
                borderRadius: '8px'
              }}>
                Uploading...
              </div>
            )}

            {/* Cover Edit Buttons - Only for owner */}
            {currentUserId === seller.id && (
              <>
                <div style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  display: 'flex',
                  gap: spacing.sm
                }}>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    style={{
                      ...styles.button.primary,
                      padding: `${spacing.sm} ${spacing.md}`,
                      fontSize: typography.fontSize.sm,
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: colors.text.primary
                    }}
                  >
                    📷 {seller.cover_photo ? 'Change Cover' : 'Add Cover'}
                  </button>
                  {seller.cover_photo && (
                    <button
                      onClick={handleRemoveCover}
                      style={{
                        ...styles.button.secondary,
                        padding: `${spacing.sm} ${spacing.md}`,
                        fontSize: typography.fontSize.sm,
                        cursor: 'pointer',
                        backgroundColor: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                {/* Recommended Cover Dimensions - Only for owner */}
                <div style={{
                  position: 'absolute',
                  bottom: spacing.sm,
                  right: spacing.sm,
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}>
                  Recommended: 1280 x 720
                </div>
              </>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverSelect}
            />
          </div>

          {/* Profile Info Section with Overlapping Avatar */}
          <div className="seller-info-section" style={{
            padding: `0 ${spacing.xl} ${spacing.xl} ${spacing.xl}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            gap: spacing.lg
          }}>
            {/* Seller Avatar - Overlapping Cover */}
            <div className="seller-avatar-container" style={{
              position: 'relative',
              marginTop: '-45px',
              marginBottom: 0,
              width: '150px',
              flexShrink: 0
            }}>
              {seller.avatar || avatarPreview ? (
                <img
                  className="seller-avatar-image"
                  src={avatarPreview || `http://localhost:5000/uploads/avatars/${seller.avatar}`}
                  alt={seller.full_name}
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: borderRadius.full,
                    objectFit: 'cover',
                    border: '5px solid #2a77f2',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <div className="seller-avatar-image" style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primary,
                  color: colors.text.inverse,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: typography.fontWeight.bold,
                  border: '5px solid #2a77f2',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {seller.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              {uploadingAvatar && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '12px',
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}>
                  Uploading...
                </div>
              )}

              {/* Avatar Edit Button - Only for owner */}
              {currentUserId === seller.id && (
                <>
                  {seller.avatar ? (
                    // Show delete icon when avatar exists
                    <button
                      className="seller-avatar-icon"
                      onClick={handleRemoveAvatar}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        border: '3px solid white',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      title="Remove avatar"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  ) : (
                    // Show camera icon when no avatar
                    <button
                      className="seller-avatar-icon"
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
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      title="Add avatar"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </button>
                  )}

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarSelect}
                  />
                </>
              )}
            </div>

            {/* Seller Info */}
            <div style={{
              flex: 1,
              paddingBottom: spacing.md
            }}>
              {/* Name and Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                marginTop: '10px',
                marginBottom: spacing.sm
              }}>
                <h1 className="seller-name" style={{
                  ...styles.heading.h1,
                  margin: 0
                }}>
                  {seller.individual_verified && seller.verified_seller_name ? seller.verified_seller_name : seller.full_name}
                </h1>
                {/* Golden Badge for Business Verified */}
                {seller.business_verification_status === 'approved' && (
                  <img
                    className="seller-badge"
                    src="/golden-badge.png"
                    alt="Verified Business"
                    title="Verified Business Account"
                    style={{ width: '32px', height: '32px' }}
                  />
                )}
                {/* Blue Badge for Individual Verified (but not business verified) */}
                {seller.individual_verified && seller.business_verification_status !== 'approved' && (
                  <img
                    className="seller-badge"
                    src="/blue-badge.png"
                    alt="Verified Seller"
                    title="Verified Individual Seller"
                    style={{ width: '32px', height: '32px' }}
                  />
                )}
              </div>

              <p style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.lg,
                margin: `0 0 ${spacing.md} 0`
              }}>
                Individual Seller
              </p>

              {/* Stats */}
              <div className="seller-stats" style={{
                display: 'flex',
                gap: spacing.xl
              }}>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary
                  }}>
                    {stats.total_ads}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary
                  }}>
                    Active Ads
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary
                  }}>
                    {stats.total_views || 0}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary
                  }}>
                    Total Views
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary
                  }}>
                    {new Date(seller.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary
                  }}>
                    Member Since
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Sidebar + Ads Grid */}
        <div className="seller-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: spacing.xl
        }}>
          {/* Left Sidebar - About, Contact & Location */}
          <div>
            {/* About Section */}
            <div style={{
              ...styles.card.default,
              marginBottom: spacing.xl
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <h2 style={{
                  ...styles.heading.h2,
                  margin: 0
                }}>
                  About
                </h2>
                {!isEditingAbout && currentUserId === seller.id && (
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    style={{
                      ...styles.button.secondary,
                      padding: `${spacing.xs} ${spacing.md}`,
                      fontSize: typography.fontSize.sm
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingAbout ? (
                <div>
                  <textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: spacing.md,
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.border}`,
                      fontSize: typography.fontSize.base,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      marginBottom: spacing.sm
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.md
                  }}>
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary
                    }}>
                      {aboutText.length}/500 characters
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: spacing.sm
                  }}>
                    <button
                      onClick={handleSaveAbout}
                      disabled={aboutSaving}
                      style={{
                        ...styles.button.primary,
                        flex: 1,
                        opacity: aboutSaving ? 0.6 : 1
                      }}
                    >
                      {aboutSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAbout(false);
                        setAboutText(seller.bio || '');
                      }}
                      disabled={aboutSaving}
                      style={{
                        ...styles.button.secondary,
                        flex: 1
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {seller.bio || 'No description available. Click Edit to add information about yourself.'}
                </p>
              )}
            </div>

            {/* Contact Information */}
            <div style={{
              ...styles.card.default,
              marginBottom: spacing.xl
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.lg
              }}>
                <h2 style={{
                  ...styles.heading.h2,
                  margin: 0
                }}>
                  Contact Information
                </h2>
                {!isEditingContact && currentUserId === seller.id && (
                  <button
                    onClick={() => setIsEditingContact(true)}
                    style={{
                      ...styles.button.secondary,
                      padding: `${spacing.xs} ${spacing.md}`,
                      fontSize: typography.fontSize.sm
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingContact ? (
                <div>
                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={contactData.phone}
                      onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                      placeholder="98XXXXXXXX"
                      style={{
                        width: '100%',
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.border}`,
                        fontSize: typography.fontSize.base,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      Website / Social Media
                    </label>
                    <input
                      type="url"
                      value={contactData.business_website}
                      onChange={(e) => setContactData({ ...contactData, business_website: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      style={{
                        width: '100%',
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.border}`,
                        fontSize: typography.fontSize.base,
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: spacing.sm
                  }}>
                    <button
                      onClick={handleSaveContact}
                      disabled={contactSaving}
                      style={{
                        ...styles.button.primary,
                        flex: 1,
                        opacity: contactSaving ? 0.6 : 1
                      }}
                    >
                      {contactSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingContact(false);
                        setContactData({
                          phone: seller.phone || '',
                          business_website: seller.business_website || ''
                        });
                      }}
                      disabled={contactSaving}
                      style={{
                        ...styles.button.secondary,
                        flex: 1
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.lg
                }}>
                  {seller.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Phone</div>
                        <div style={{ fontWeight: typography.fontWeight.semibold }}>{seller.phone}</div>
                      </div>
                    </div>
                  )}
                  {seller.business_website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>🌐</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Website</div>
                        <a
                          href={seller.business_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: colors.primary, textDecoration: 'none', fontWeight: typography.fontWeight.semibold }}
                        >
                          {seller.business_website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Location Information */}
            <div style={styles.card.default}>
              <h2 style={{
                ...styles.heading.h2,
                marginBottom: spacing.lg
              }}>
                Location
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg
              }}>
                {seller.location_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <span style={{ fontSize: '24px' }}>🗺️</span>
                    <div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>City/Area</div>
                      <div style={{ fontWeight: typography.fontWeight.semibold }}>{seller.location_name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Ads Grid */}
          <div>
            <h2 style={{
              ...styles.heading.h2,
              marginBottom: spacing.lg
            }}>
              Ads from {seller.full_name} ({stats.total_ads})
            </h2>

            {ads.length === 0 ? (
              <div style={{
                ...styles.card.default,
                textAlign: 'center',
                padding: spacing.xxl
              }}>
                <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📦</div>
                <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>No active ads at the moment</p>
                {currentUserId === seller.id && (
                  <button
                    onClick={() => {
                      const currentLang = window.location.pathname.split('/')[1] || 'en';
                      navigate(`/${currentLang}/post-ad`);
                    }}
                    style={{
                      ...styles.button.primary,
                      fontSize: typography.fontSize.base,
                      padding: `${spacing.md} ${spacing.xl}`,
                      marginBottom: '20px'
                    }}
                  >
                    📝 Post Free Ad
                  </button>
                )}
              </div>
            ) : (
              <div className="seller-ads-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: spacing.lg
              }}>
                {ads.map(ad => (
                  <div
                    key={ad.id}
                    onClick={() => handleAdClick(ad.slug)}
                    style={{
                      ...styles.card.default,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    {/* Promotion Badges */}
                    {ad.is_urgent && (
                      <div style={{
                        position: 'absolute',
                        top: spacing.sm,
                        left: spacing.sm,
                        backgroundColor: colors.danger,
                        color: colors.text.inverse,
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.md,
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.bold,
                        zIndex: 1
                      }}>
                        URGENT
                      </div>
                    )}

                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.md,
                      marginBottom: spacing.md,
                      overflow: 'hidden'
                    }}>
                      {ad.primary_image ? (
                        <img
                          src={`http://localhost:5000/uploads/ads/${ad.primary_image}`}
                          alt={ad.title}
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
                          color: colors.text.secondary,
                          fontSize: '48px'
                        }}>
                          📷
                        </div>
                      )}
                    </div>

                    <h3 style={{
                      ...styles.heading.h4,
                      marginBottom: spacing.sm,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {ad.title}
                    </h3>

                    <div style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary,
                      marginBottom: spacing.sm
                    }}>
                      NPR {parseFloat(ad.price).toLocaleString()}
                    </div>

                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{ad.location_name || 'No location'}</span>
                      <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
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
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            {/* Cropper Area */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '400px',
              backgroundColor: '#000'
            }}>
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
            <div style={{ padding: '20px' }}>
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
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setCropperModal({ isOpen: false, type: null, imageSrc: null })}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '500'
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
        </div>
      )}
    </>
  );
}

export default SellerProfile;
