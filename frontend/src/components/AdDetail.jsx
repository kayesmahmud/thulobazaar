import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthModal from './AuthModal';
import SimpleHeader from './SimpleHeader';
import Breadcrumb from './Breadcrumb';
import { recentlyViewedUtils } from '../utils/recentlyViewed';
import { extractAdIdFromUrl } from '../utils/urlUtils';

function AdDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Extract actual ID from URL - handle both old (/ad/21) and new (/ad/wooden-bed-kathmandu-21) formats
  const getAdId = () => {
    if (slug) {
      // New format: extract ID from SEO-friendly slug
      return extractAdIdFromUrl(`/ad/${slug}`);
    }
    // Old format: ID is direct
    return id;
  };

  const adId = getAdId();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [contactModal, setContactModal] = useState({ isOpen: false });
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [reportModal, setReportModal] = useState({ isOpen: false });
  const [reportForm, setReportForm] = useState({
    reason: '',
    details: ''
  });

  useEffect(() => {
    const fetchAd = async () => {
      if (!adId) {
        setError('Invalid ad URL.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const adData = await ApiService.getAd(adId);
        setAd(adData);

        // Add to recently viewed
        if (adData) {
          recentlyViewedUtils.addToRecentlyViewed({
            id: adData.id,
            title: adData.title,
            price: adData.price,
            location_name: adData.location_name,
            category_name: adData.category_name,
            primary_image: adData.primary_image,
            created_at: adData.created_at
          });
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError('Failed to load ad details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [adId]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handlePostAdClick = () => {
    if (isAuthenticated) {
      navigate(`/${language}/post-ad`);
    } else {
      setAuthModal({ isOpen: true, mode: 'login' });
    }
  };

  const handlePhoneReveal = () => {
    setPhoneRevealed(true);
    // TODO: Track phone reveal analytics
  };

  const handleEmailSeller = () => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    setContactModal({ isOpen: true });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const contactData = {
        adId: id,
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message
      };

      const result = await ApiService.contactSeller(contactData);

      alert(result.message || 'Message sent successfully! The seller will contact you soon.');
      setContactModal({ isOpen: false });
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message. Please try again.');
    }
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    if (phoneRevealed) return phone;

    // Show first 3 digits and last 2 digits, hide middle
    const visibleStart = phone.slice(0, 3);
    const visibleEnd = phone.slice(-2);
    const hiddenMiddle = '*'.repeat(Math.max(0, phone.length - 5));

    return `${visibleStart}${hiddenMiddle}${visibleEnd}`;
  };

  const handleReportAd = () => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, mode: 'login' });
      return;
    }
    setReportModal({ isOpen: true });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        adId: id,
        reason: reportForm.reason,
        details: reportForm.details
      };

      const result = await ApiService.reportAd(reportData);

      alert(result.message || 'Thank you for your report. We will review this ad and take appropriate action.');
      setReportModal({ isOpen: false });
      setReportForm({ reason: '', details: '' });
    } catch (error) {
      console.error('Error reporting ad:', error);
      alert(error.message || 'Failed to submit report. Please try again.');
    }
  };

  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading ad details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        color: '#dc1e4a'
      }}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/${language}`)}>
          Back to Home
        </button>
      </div>
    );
  }

  if (!ad) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>Ad not found</h2>
        <button onClick={() => navigate(`/${language}`)}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: ad.category_name, path: `/search?category=${encodeURIComponent(ad.category_name)}` },
          { label: ad.title, current: true }
        ]}
      />

      {/* Ad Detail Content */}
      <div className="ad-detail-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        <div className="ad-detail-grid" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '40px'
        }}>
          {/* Main Content */}
          <div>
            {/* Ad Title and Price */}
            <div style={{ marginBottom: '30px' }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px',
                lineHeight: '1.2'
              }}>
                {ad.title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#dc1e4a'
                }}>
                  {formatPrice(ad.price)}
                </div>
                {ad.is_featured && (
                  <span style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    FEATURED
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '14px',
                color: '#64748b'
              }}>
                <span>📍 {ad.location_name}</span>
                <span>👁️ {ad.view_count} views</span>
                <span>🕒 {formatDate(ad.created_at)}</span>
              </div>
            </div>

            {/* Ad Images Gallery */}
            <div style={{ marginBottom: '30px' }}>
              {ad.images && ad.images.length > 0 ? (
                <div>
                  {/* Main Image */}
                  <div style={{
                    width: '100%',
                    height: '400px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <img
                      className="main-ad-image"
                      src={`http://localhost:5000/uploads/ads/${ad.images[0].filename}`}
                      alt={ad.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>

                  {/* Thumbnail Gallery */}
                  {ad.images.length > 1 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: '8px',
                      maxHeight: '120px'
                    }}>
                      {ad.images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          style={{
                            aspectRatio: '1/1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            // Swap with main image
                            const mainImg = document.querySelector('.main-ad-image');
                            if (mainImg) {
                              mainImg.src = `http://localhost:5000/uploads/ads/${image.filename}`;
                            }
                          }}
                        >
                          <img
                            src={`http://localhost:5000/uploads/ads/${image.filename}`}
                            alt={`${ad.title} ${index + 2}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* No Images Placeholder */
                <div style={{
                  width: '100%',
                  height: '400px',
                  backgroundColor: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                      {ad.category_icon || '📦'}
                    </div>
                    <p>No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Description
              </h2>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  lineHeight: '1.6',
                  color: '#374151',
                  fontSize: '16px'
                }}>
                  {ad.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Ad Details */}
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Details
              </h2>
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <strong style={{ color: '#64748b' }}>Category:</strong>
                    <p style={{ color: '#1e293b', marginTop: '4px' }}>{ad.category_name}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Condition:</strong>
                    <p style={{ color: '#1e293b', marginTop: '4px', textTransform: 'capitalize' }}>
                      {ad.condition}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Location:</strong>
                    <p style={{ color: '#1e293b', marginTop: '4px' }}>{ad.location_name}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#64748b' }}>Posted:</strong>
                    <p style={{ color: '#1e293b', marginTop: '4px' }}>{formatDate(ad.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Seller Info */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Contact Seller
              </h3>

              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}>
                    {ad.seller_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {ad.business_verification_status === 'approved' && ad.business_name ? ad.business_name : ad.seller_name}
                      {ad.business_verification_status === 'approved' && (
                        <img
                          src="/golden-badge.png"
                          alt="Verified Business"
                          title="Verified Business"
                          style={{ width: '20px', height: '20px' }}
                        />
                      )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '14px' }}>
                      {ad.business_verification_status === 'approved' ? 'Verified Business' : 'Seller'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                {/* Phone Number Button */}
                <button
                  onClick={handlePhoneReveal}
                  style={{
                    width: '100%',
                    backgroundColor: phoneRevealed ? '#10b981' : '#dc1e4a',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📞 {phoneRevealed ? ad.seller_phone : formatPhoneDisplay(ad.seller_phone)}
                  {!phoneRevealed && (
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Click to reveal full number
                    </span>
                  )}
                </button>

                {/* WhatsApp Button (if phone is available) */}
                {phoneRevealed && ad.seller_phone && (
                  <button
                    onClick={() => {
                      const whatsappNumber = ad.seller_phone.replace(/[^0-9]/g, '');
                      const message = `Hi! I'm interested in your ad: ${ad.title}`;
                      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    style={{
                      width: '100%',
                      backgroundColor: '#25d366',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                  >
                    💬 WhatsApp
                  </button>
                )}

                {/* Email Seller Button */}
                <button
                  onClick={handleEmailSeller}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    color: '#dc1e4a',
                    border: '2px solid #dc1e4a',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '12px'
                  }}
                >
                  📧 Email Seller
                </button>
              </div>

              {/* Safety Tips */}
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: '#0369a1'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  🛡️ Safety Tips
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>Meet in public places</li>
                  <li>Don't pay in advance</li>
                  <li>Inspect item before buying</li>
                  <li>Report suspicious activity</li>
                </ul>
              </div>

              <div style={{
                fontSize: '12px',
                color: '#64748b',
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                ⚠️ Stay safe! Meet in public places and verify items before payment.
              </div>
            </div>

            {/* Report Ad */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <button
                onClick={handleReportAd}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🚩 Report this ad
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email Contact Modal */}
      {contactModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setContactModal({ isOpen: false })}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                📧 Contact Seller
              </h2>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '14px'
              }}>
                Send a message to {ad.seller_name} about "{ad.title}"
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleContactSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Your Email *
                </label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your email address"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Your Phone
                </label>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="+977-9800000000 (optional)"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Message *
                </label>
                <textarea
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder={`Hi ${ad.seller_name}, I'm interested in your "${ad.title}". Is it still available?`}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setContactModal({ isOpen: false })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#dc1e4a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  📧 Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Ad Modal */}
      {reportModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '100%',
            maxWidth: '500px',
            margin: '20px',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setReportModal({ isOpen: false })}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 8px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                🚩 Report this ad
              </h2>
              <p style={{
                margin: 0,
                color: '#64748b',
                fontSize: '14px'
              }}>
                Help us keep Thulobazaar safe by reporting inappropriate content.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Reason for reporting *
                </label>
                <select
                  required
                  value={reportForm.reason}
                  onChange={(e) => setReportForm(prev => ({ ...prev, reason: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam or fake listing</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fraud">Suspected fraud or scam</option>
                  <option value="duplicate">Duplicate listing</option>
                  <option value="wrong_category">Wrong category</option>
                  <option value="illegal">Illegal goods or services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Additional details (optional)
                </label>
                <textarea
                  value={reportForm.details}
                  onChange={(e) => setReportForm(prev => ({ ...prev, details: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Please provide any additional information that would help us review this ad..."
                />
              </div>

              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#0369a1'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  ℹ️ Please note:
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li>False reports may result in account restrictions</li>
                  <li>We review all reports within 24-48 hours</li>
                  <li>Your report is anonymous and confidential</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setReportModal({ isOpen: false })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🚩 Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        onAuthSuccess={() => {
          setAuthModal({ isOpen: false, mode: 'login' });
        }}
      />
    </div>
  );
}

export default AdDetail;
