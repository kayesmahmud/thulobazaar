import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import { styles, colors, spacing, borderRadius, typography } from '../styles/theme';
import Header from './Header';
import ApiService from '../services/api';

const API_URL = 'http://localhost:5000/api';

function ShopProfile() {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [aboutSaving, setAboutSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    business_phone: '',
    phone: '',
    business_website: '',
    google_maps_link: ''
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
    fetchShopProfile();
  }, [shopSlug]);

  const fetchShopProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/shop/${shopSlug}`);
      if (response.data.success) {
        setShopData(response.data.data);
        setAboutText(response.data.data.shop.business_description || '');
        setContactData({
          business_phone: response.data.data.shop.business_phone || '',
          phone: response.data.data.shop.phone || '',
          business_website: response.data.data.shop.business_website || '',
          google_maps_link: response.data.data.shop.google_maps_link || ''
        });
        console.log('Shop owner ID:', response.data.data.shop.id);
        console.log('Current user ID:', currentUserId);
        console.log('Show edit button?', currentUserId === response.data.data.shop.id);
      } else {
        setError('Shop not found');
      }
    } catch (err) {
      console.error('Error fetching shop profile:', err);
      setError(err.response?.data?.message || 'Failed to load shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAbout = async () => {
    try {
      setAboutSaving(true);
      const token = localStorage.getItem('authToken');

      const response = await axios.put(
        `${API_URL}/shop/${shopSlug}/about`,
        { business_description: aboutText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShopData(prev => ({
          ...prev,
          shop: { ...prev.shop, business_description: aboutText }
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
        `${API_URL}/shop/${shopSlug}/contact`,
        contactData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setShopData(prev => ({
          ...prev,
          shop: {
            ...prev.shop,
            business_phone: contactData.business_phone,
            phone: contactData.phone,
            business_website: contactData.business_website,
            google_maps_link: contactData.google_maps_link
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
      setShopData(prev => ({
        ...prev,
        shop: { ...prev.shop, avatar: response.data.avatar }
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
      setShopData(prev => ({
        ...prev,
        shop: { ...prev.shop, cover_photo: response.data.cover_photo }
      }));
      setCoverPreview(null);
      alert('Cover photo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading cover:', err);
      alert(err.message || 'Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your avatar?')) return;
    try {
      await ApiService.removeAvatar();
      setShopData(prev => ({
        ...prev,
        shop: { ...prev.shop, avatar: null }
      }));
      setAvatarPreview(null);
      alert('Avatar removed successfully!');
    } catch (err) {
      console.error('Error removing avatar:', err);
      alert(err.message || 'Failed to remove avatar');
    }
  };

  const handleRemoveCover = async () => {
    if (!window.confirm('Are you sure you want to remove your cover photo?')) return;
    try {
      await ApiService.removeCoverPhoto();
      setShopData(prev => ({
        ...prev,
        shop: { ...prev.shop, cover_photo: null }
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

  const handleAdClick = (ad) => {
    const currentLang = window.location.pathname.split('/')[1] || 'en';

    // Generate SEO-friendly slug: title-area-district--id
    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    const parts = [ad.title];
    if (ad.area_name) parts.push(ad.area_name);
    if (ad.district_name && ad.district_name !== ad.area_name) parts.push(ad.district_name);

    const slugPart = slugify(parts.join(' '));
    const seoSlug = `${slugPart}--${ad.id}`;

    navigate(`/${currentLang}/ad/${seoSlug}`);
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
            }}>🏪</div>
            <p style={{ color: colors.text.secondary }}>Loading shop profile...</p>
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
            <h2 style={{ color: colors.text.primary, marginBottom: spacing.sm }}>Shop Not Found</h2>
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

  const { shop, ads, stats } = shopData;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .shop-profile-container {
            padding: ${spacing.md} !important;
          }
          .shop-cover-photo {
            height: 200px !important;
          }
          .shop-avatar-container {
            margin-top: -30px !important;
            width: 100px !important;
          }
          .shop-avatar-image {
            width: 100px !important;
            height: 100px !important;
            border-width: 3px !important;
          }
          .shop-avatar-icon {
            width: 32px !important;
            height: 32px !important;
            bottom: 5px !important;
            right: 5px !important;
          }
          .shop-avatar-icon svg {
            width: 16px !important;
            height: 16px !important;
          }
          .shop-info-section {
            padding: 0 ${spacing.md} ${spacing.md} ${spacing.md} !important;
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .shop-name {
            font-size: ${typography.fontSize.xl} !important;
          }
          .shop-badge {
            width: 24px !important;
            height: 24px !important;
          }
          .shop-stats {
            flex-wrap: wrap !important;
            gap: ${spacing.md} !important;
          }
          .shop-main-grid {
            grid-template-columns: 1fr !important;
          }
          .shop-ads-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .shop-avatar-container {
            width: 80px !important;
            margin-top: -25px !important;
          }
          .shop-avatar-image {
            width: 80px !important;
            height: 80px !important;
          }
          .shop-name {
            font-size: ${typography.fontSize.lg} !important;
          }
          .shop-stats {
            font-size: ${typography.fontSize.sm} !important;
          }
        }
      `}</style>
      <Header />
      <div className="shop-profile-container" style={{
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
          <div className="shop-cover-photo" style={{
            width: '100%',
            height: '300px',
            position: 'relative',
            backgroundImage: shop.cover_photo || coverPreview
              ? `url(${coverPreview || `http://localhost:5000/uploads/covers/${shop.cover_photo}`})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: `${borderRadius.lg} ${borderRadius.lg} 0 0`
          }}>
            {/* Cover Edit Buttons - Only for owner */}
            {currentUserId === shop.id && (
              <>
                <div style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  display: 'flex',
                  gap: spacing.sm,
                  zIndex: 10
                }}>
                  <button
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    style={{
                      ...styles.button.primary,
                      padding: `${spacing.sm} ${spacing.md}`,
                      fontSize: typography.fontSize.sm,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      color: colors.primary,
                      border: 'none',
                      cursor: uploadingCover ? 'not-allowed' : 'pointer',
                      opacity: uploadingCover ? 0.6 : 1
                    }}
                  >
                    {uploadingCover ? '⏳ Uploading...' : `📷 ${shop.cover_photo ? 'Change Cover' : 'Add Cover'}`}
                  </button>
                  {shop.cover_photo && (
                    <button
                      onClick={handleRemoveCover}
                      style={{
                        ...styles.button.secondary,
                        padding: `${spacing.sm} ${spacing.md}`,
                        fontSize: typography.fontSize.sm,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: colors.danger,
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
          <div className="shop-info-section" style={{
            padding: `0 ${spacing.xl} ${spacing.xl} ${spacing.xl}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            gap: spacing.lg
          }}>
            {/* Shop Avatar - Overlapping Cover */}
            <div className="shop-avatar-container" style={{
              position: 'relative',
              marginTop: '-45px',
              marginBottom: 0,
              width: '150px',
              flexShrink: 0
            }}>
              {shop.avatar || avatarPreview ? (
                <img
                  className="shop-avatar-image"
                  src={avatarPreview || `http://localhost:5000/uploads/avatars/${shop.avatar}`}
                  alt={shop.business_name}
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: borderRadius.full,
                    objectFit: 'cover',
                    border: '5px solid #ffc70b',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <div className="shop-avatar-image" style={{
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
                  border: '5px solid #fbbf24',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {shop.business_name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Avatar Edit Button - Only for owner */}
              {currentUserId === shop.id && (
                <>
                  {shop.avatar ? (
                    // Show delete icon when avatar exists
                    <button
                      className="shop-avatar-icon"
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
                      className="shop-avatar-icon"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
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
                        cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: uploadingAvatar ? 0.6 : 1,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                      title={uploadingAvatar ? 'Uploading...' : 'Add avatar'}
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

            {/* Shop Info */}
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
                <h1 className="shop-name" style={{
                  ...styles.heading.h1,
                  margin: 0
                }}>
                  {shop.business_name || shop.full_name}
                </h1>
                {shop.business_verification_status === 'approved' && (
                  <img
                    className="shop-badge"
                    src="/golden-badge.png"
                    alt="Verified Business"
                    title="Verified Business"
                    style={{ width: '32px', height: '32px' }}
                  />
                )}
              </div>

              <p style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.lg,
                margin: `0 0 ${spacing.md} 0`
              }}>
                Verified Business Account
              </p>

              {/* Stats */}
              <div className="shop-stats" style={{
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
                    {new Date(shop.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
        <div className="shop-main-grid" style={{
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
                {!isEditingAbout && currentUserId === shop.id && (
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
                    placeholder="Describe your business..."
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
                        setAboutText(shop.business_description || '');
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
                  {shop.business_description || 'No description available. Click Edit to add information about your business.'}
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
                {!isEditingContact && currentUserId === shop.id && (
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
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={contactData.business_phone}
                      onChange={(e) => setContactData({ ...contactData, business_phone: e.target.value })}
                      placeholder="977-98XXXXXXXX"
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
                      Mobile Phone
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

                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      Google Maps Link
                    </label>
                    <input
                      type="url"
                      value={contactData.google_maps_link}
                      onChange={(e) => setContactData({ ...contactData, google_maps_link: e.target.value })}
                      placeholder="https://maps.google.com/?q=..."
                      style={{
                        width: '100%',
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.border}`,
                        fontSize: typography.fontSize.base,
                        fontFamily: 'inherit'
                      }}
                    />
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      marginTop: spacing.xs
                    }}>
                      📍 Get your link from Google Maps → Share → Copy link
                    </div>
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
                          business_phone: shop.business_phone || '',
                          phone: shop.phone || '',
                          business_website: shop.business_website || '',
                          google_maps_link: shop.google_maps_link || ''
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
                  {shop.business_phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>💬</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>WhatsApp</div>
                        <div style={{ fontWeight: typography.fontWeight.semibold }}>{shop.business_phone}</div>
                      </div>
                    </div>
                  )}
                  {shop.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>📱</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Mobile</div>
                        <div style={{ fontWeight: typography.fontWeight.semibold }}>{shop.phone}</div>
                      </div>
                    </div>
                  )}
                  {shop.business_website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>🌐</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Website</div>
                        <a
                          href={shop.business_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: colors.primary, textDecoration: 'none', fontWeight: typography.fontWeight.semibold }}
                        >
                          {shop.business_website}
                        </a>
                      </div>
                    </div>
                  )}
                  {shop.google_maps_link && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <span style={{ fontSize: '24px' }}>📍</span>
                      <div>
                        <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Location</div>
                        <a
                          href={shop.google_maps_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: colors.primary, textDecoration: 'none', fontWeight: typography.fontWeight.semibold }}
                        >
                          View on Google Maps
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
                {shop.business_address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <span style={{ fontSize: '24px' }}>📍</span>
                    <div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>Address</div>
                      <div style={{ fontWeight: typography.fontWeight.semibold }}>{shop.business_address}</div>
                    </div>
                  </div>
                )}
                {shop.location_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <span style={{ fontSize: '24px' }}>🗺️</span>
                    <div>
                      <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>City/Area</div>
                      <div style={{ fontWeight: typography.fontWeight.semibold }}>{shop.location_name}</div>
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
              Ads from {shop.business_name} ({stats.total_ads})
            </h2>

            {ads.length === 0 ? (
              <div style={{
                ...styles.card.default,
                textAlign: 'center',
                padding: spacing.xxl
              }}>
                <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📦</div>
                <p style={{ color: colors.text.secondary, marginBottom: spacing.lg }}>No active ads at the moment</p>
                {currentUserId === shop.id && (
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
              <div className="shop-ads-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: spacing.lg
              }}>
                {ads.map(ad => (
                  <div
                    key={ad.id}
                    onClick={() => handleAdClick(ad)}
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: spacing.xl
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: spacing.lg,
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                ...styles.heading.h2,
                margin: 0
              }}>
                {cropperModal.type === 'avatar' ? 'Crop Profile Picture' : 'Crop Cover Photo'}
              </h2>
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

            {/* Zoom Control */}
            <div style={{
              padding: spacing.lg,
              borderTop: `1px solid ${colors.border}`,
              borderBottom: `1px solid ${colors.border}`
            }}>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                marginBottom: spacing.sm,
                fontWeight: typography.fontWeight.semibold
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
                style={{
                  width: '100%',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: spacing.lg,
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setCropperModal({ isOpen: false, type: null, imageSrc: null })}
                disabled={uploadingAvatar || uploadingCover}
                style={{
                  ...styles.button.secondary,
                  padding: `${spacing.md} ${spacing.lg}`
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={uploadingAvatar || uploadingCover}
                style={{
                  ...styles.button.primary,
                  padding: `${spacing.md} ${spacing.lg}`,
                  opacity: (uploadingAvatar || uploadingCover) ? 0.6 : 1,
                  cursor: (uploadingAvatar || uploadingCover) ? 'not-allowed' : 'pointer'
                }}
              >
                {uploadingAvatar || uploadingCover ? 'Uploading...' : 'Save & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ShopProfile;
