import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { styles, colors, spacing, typography, borderRadius } from '../styles/theme';
import AuthModal from './AuthModal';
import UserHeader from './UserHeader';
import Breadcrumb from './Breadcrumb';
import { recentlyViewedUtils } from '../utils/recentlyViewed';
import { extractAdIdFromUrl, generateBrowseUrl, generateSlug } from '../utils/urlUtils';
import { API_BASE_URL, UPLOADS_BASE_URL } from '../config/env.js';

// Import new components
import ImageGallery from './ad-detail/ImageGallery';
import SellerCard from './ad-detail/SellerCard';
import ContactModal from './ad-detail/ContactModal';
import ReportModal from './ad-detail/ReportModal';
import PromoteAdModal from './PromoteAdModal';
import PromotionBadge from './PromotionBadge';
import ElectronicsSpecs from './ad-details/specs/ElectronicsSpecs';
import VehiclesSpecs from './ad-details/specs/VehiclesSpecs';
import PropertySpecs from './ad-details/specs/PropertySpecs';
import FashionSpecs from './ad-details/specs/FashionSpecs';
import HomeLivingSpecs from './ad-details/specs/HomeLivingSpecs';
import PetsSpecs from './ad-details/specs/PetsSpecs';
import ServicesSpecs from './ad-details/specs/ServicesSpecs';
import './ad-details/specs/TemplateSpecs.css';

function AdDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const getAdId = () => {
    if (slug) {
      return extractAdIdFromUrl(`/ad/${slug}`);
    }
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
  const [promoteModal, setPromoteModal] = useState(false);
  const [relatedAds, setRelatedAds] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

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

        if (adData) {
          // Build location string for recently viewed
          const locationParts = [];
          if (adData.area_name) locationParts.push(adData.area_name);
          if (adData.district_name) locationParts.push(adData.district_name);
          const locationString = locationParts.join(', ') || 'Location not specified';

          recentlyViewedUtils.addToRecentlyViewed({
            id: adData.id,
            title: adData.title,
            price: adData.price,
            location_name: locationString,
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

  // Fetch related ads
  useEffect(() => {
    const fetchRelatedAds = async () => {
      if (!ad) return;

      try {
        setLoadingRelated(true);
        // Fetch ads from same category and location
        const params = new URLSearchParams({
          category: ad.category_id,
          location: ad.location_id,
          limit: 4,
          exclude: ad.id
        });
        const response = await fetch(`${API_BASE_URL}/ads?${params}`);
        const data = await response.json();
        setRelatedAds(data.ads || []);
      } catch (err) {
        console.error('Error fetching related ads:', err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedAds();
  }, [ad]);

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

  const formatLocation = (detailed = false) => {
    // Build location hierarchy from area to province
    const parts = [];

    if (ad.area_name) parts.push(ad.area_name);
    if (ad.ward_number) parts.push(`Ward ${ad.ward_number}`);

    if (detailed) {
      // Detailed version includes municipality, district, and province
      if (ad.municipality_name) parts.push(ad.municipality_name);
      if (ad.district_name) parts.push(ad.district_name);
      if (ad.province_name) parts.push(ad.province_name);
      return parts.join(' • '); // Using bullet separator for hierarchy
    } else {
      // Short version: Area, Ward, District
      if (ad.district_name) parts.push(ad.district_name);
      return parts.join(', ');
    }
  };

  const handlePhoneReveal = () => {
    setPhoneRevealed(true);
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

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = ad.title;
    const text = `${ad.title} - ${formatPrice(ad.price)}`;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      copy: url
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleRelatedAdClick = (relatedAd) => {
    const slugify = (text) => {
      return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    const parts = [relatedAd.title];
    if (relatedAd.area_name) parts.push(relatedAd.area_name);
    if (relatedAd.district_name && relatedAd.district_name !== relatedAd.area_name) {
      parts.push(relatedAd.district_name);
    }

    const slugPart = slugify(parts.join(' '));
    const seoSlug = `${slugPart}--${relatedAd.id}`;

    navigate(`/${language}/ad/${seoSlug}`);
    window.scrollTo(0, 0);
  };

  const handlePromote = async (promotionData) => {
    try {
      const response = await ApiService.initiatePayment(promotionData);

      if (response.success) {
        // In real implementation, redirect to payment URL
        // For mock payment, show success and redirect to success endpoint
        const { transactionId, amount } = response;

        // Simulate payment completion (for testing)
        const confirmPayment = window.confirm(
          `Mock Payment:\nAmount: रू ${amount}\nTransaction ID: ${transactionId}\n\nClick OK to complete payment (Success) or Cancel to fail payment.`
        );

        if (confirmPayment) {
          // Complete payment via success endpoint
          window.location.href = `${API_BASE_URL}/mock-payment/success?txnId=${transactionId}&amount=${amount}`;
        } else {
          // Fail payment
          window.location.href = `${API_BASE_URL}/mock-payment/failure?txnId=${transactionId}&reason=User+cancelled`;
        }

        setPromoteModal(false);
      }
    } catch (error) {
      console.error('Promotion error:', error);
      alert('Failed to initiate promotion. Please try again.');
    }
  };

  if (loading || authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: typography.fontSize.lg
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
        color: colors.danger
      }}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button
          onClick={() => navigate(`/${language}`)}
          style={styles.button.primary}
        >
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
        <button
          onClick={() => navigate(`/${language}`)}
          style={styles.button.primary}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Generate SEO-friendly description
  const metaDescription = ad.description
    ? ad.description.substring(0, 160)
    : `${ad.title} - ${ad.price} NPR in ${formatLocation()}. ${ad.category_name}`;

  // Canonical URL
  const canonicalUrl = `${window.location.origin}/${language}/ad/${slug || ad.id}`;

  return (
    <div>
      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .ad-main-content {
            grid-column: span 7 !important;
          }
          .ad-sidebar {
            grid-column: span 5 !important;
          }
          .mobile-only {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .ad-main-content, .ad-sidebar {
            grid-column: span 12 !important;
          }
          .details-simple-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* React 19 Native Metadata */}
      <title>{ad.title} - Thulobazaar</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={`${ad.category_name}, ${formatLocation()}, Nepal classifieds, buy ${ad.title}`} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph tags for social media */}
        <meta property="og:title" content={`${ad.title} - Thulobazaar`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonicalUrl} />
        {ad.primary_image && (
          <meta property="og:image" content={`${UPLOADS_BASE_URL}/ads/${ad.primary_image}`} />
        )}
        <meta property="og:site_name" content="Thulobazaar" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ad.title} - Thulobazaar`} />
        <meta name="twitter:description" content={metaDescription} />
        {ad.primary_image && (
          <meta name="twitter:image" content={`${UPLOADS_BASE_URL}/ads/${ad.primary_image}`} />
        )}

        {/* Product schema for rich snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": ad.title,
            "description": metaDescription,
            "image": ad.primary_image ? `${UPLOADS_BASE_URL}/ads/${ad.primary_image}` : undefined,
            "offers": {
              "@type": "Offer",
              "price": ad.price,
              "priceCurrency": "NPR",
              "availability": "https://schema.org/InStock",
              "url": canonicalUrl
            }
          })}
        </script>
      

      <UserHeader />

      <Breadcrumb
        items={(() => {
          // Determine best location slug (prioritize: area > municipality > district > province > 'nepal')
          const locationSlug = ad.area_name
            ? generateSlug(ad.area_name)
            : ad.municipality_name
            ? generateSlug(ad.municipality_name)
            : ad.district_name
            ? generateSlug(ad.district_name)
            : ad.province_name
            ? generateSlug(ad.province_name)
            : 'nepal';

          const categorySlug = ad.parent_category_name
            ? generateSlug(ad.parent_category_name)
            : generateSlug(ad.category_name);

          const subcategorySlug = ad.parent_category_name
            ? generateSlug(ad.category_name)
            : null;

          // Build breadcrumb items
          const items = [{ label: 'Home', path: '/' }];

          if (ad.parent_category_name) {
            // Has subcategory - show parent category first
            items.push({
              label: ad.parent_category_name,
              path: `/${language}${generateBrowseUrl(locationSlug, categorySlug)}`
            });
            items.push({
              label: ad.category_name,
              path: `/${language}${generateBrowseUrl(locationSlug, categorySlug, subcategorySlug)}`
            });
          } else {
            // No subcategory - just show category
            items.push({
              label: ad.category_name,
              path: `/${language}${generateBrowseUrl(locationSlug, categorySlug)}`
            });
          }

          items.push({ label: ad.title, current: true });

          return items;
        })()}
      />

      {/* Ad Detail Content */}
      <div style={{
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        paddingBottom: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '24px'
          }}>
            {/* Main Content - 60% width on desktop (7 columns) */}
            <div className="ad-main-content" style={{
              gridColumn: 'span 12'
            }}>
            {/* Ad Title and Info Card */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#1e293b',
                marginBottom: '16px',
                lineHeight: '1.3'
              }}>
                {ad.title}
              </h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#dc1e4a'
                }}>
                  {formatPrice(ad.price)}
                </div>
                {/* Show promotion badges */}
                {ad.is_featured && <PromotionBadge type="featured" />}
                {ad.is_urgent && <PromotionBadge type="urgent" />}
                {ad.is_sticky && <PromotionBadge type="bump_up" />}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '16px',
                flexWrap: 'wrap'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 {formatLocation()}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  👁️ {ad.view_count} views
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🕒 {formatDate(ad.created_at)}
                </span>
              </div>

              {/* Social Share Buttons */}
              <div style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: '14px',
                  color: '#64748b',
                  fontWeight: '500'
                }}>
                  Share:
                </span>
                <button
                  onClick={() => handleShare('facebook')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1877f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#25d366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1da1f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📋 Copy Link
                </button>
              </div>
            </div>

            {/* Image Gallery */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <ImageGallery images={ad.images} title={ad.title} />
            </div>

            {/* Description */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '16px'
              }}>
                Description
              </h2>
              <p style={{
                lineHeight: '1.7',
                color: '#334155',
                fontSize: '15px',
                whiteSpace: 'pre-wrap'
              }}>
                {ad.description || 'No description provided.'}
              </p>
            </div>

            {/* Template-Specific Specifications */}
            {ad.custom_fields && Object.keys(ad.custom_fields).length > 0 && (() => {
              // Determine parent category ID (use category_parent_id if exists, otherwise category_id)
              const parentCategoryId = ad.category_parent_id || ad.category_id;

              // Render appropriate specs component based on category
              let SpecsComponent = null;

              if (parentCategoryId === 3) {
                // Vehicles category
                SpecsComponent = VehiclesSpecs;
              } else if (parentCategoryId === 1 || parentCategoryId === 2) {
                // Mobiles or Electronics categories
                SpecsComponent = ElectronicsSpecs;
              } else if (parentCategoryId === 4) {
                // Home & Living category
                SpecsComponent = HomeLivingSpecs;
              } else if (parentCategoryId === 5) {
                // Property category
                SpecsComponent = PropertySpecs;
              } else if (parentCategoryId === 6) {
                // Pets & Animals category
                SpecsComponent = PetsSpecs;
              } else if (parentCategoryId === 7 || parentCategoryId === 8) {
                // Fashion categories (Men's Fashion & Women's Fashion)
                SpecsComponent = FashionSpecs;
              } else if (parentCategoryId === 9 || parentCategoryId === 13 || parentCategoryId === 14) {
                // Services, Jobs, and Education categories
                SpecsComponent = ServicesSpecs;
              }

              // If no matching component, return null
              if (!SpecsComponent) return null;

              return (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <SpecsComponent customFields={ad.custom_fields} />
                </div>
              );
            })()}

            {/* Ad Details */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div className="template-specs">
                <div className="specs-header">
                  <h3>✅ Ad Details</h3>
                </div>
                <div className="specs-grid">
                  {/* Category */}
                  {ad.parent_category_name ? (
                    <>
                      <div className="spec-item">
                        <div className="spec-label">Category</div>
                        <div className="spec-value">{ad.parent_category_name}</div>
                      </div>
                      <div className="spec-item">
                        <div className="spec-label">Sub-category</div>
                        <div className="spec-value">{ad.category_name}</div>
                      </div>
                    </>
                  ) : (
                    <div className="spec-item">
                      <div className="spec-label">Category</div>
                      <div className="spec-value">{ad.category_name}</div>
                    </div>
                  )}

                  {/* Condition - Hide for Property (5) and Fashion (7, 8) categories */}
                  {!((ad.category_parent_id === 5) || (ad.category_id === 5 && !ad.category_parent_id) ||
                      (ad.category_parent_id === 7) || (ad.category_id === 7 && !ad.category_parent_id) ||
                      (ad.category_parent_id === 8) || (ad.category_id === 8 && !ad.category_parent_id)) && (
                    <div className="spec-item">
                      <div className="spec-label">Condition</div>
                      <div className="spec-value" style={{ textTransform: 'capitalize' }}>
                        {ad.condition === 'new' ? 'Brand New' : ad.condition === 'used' ? 'Used' : ad.condition}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="spec-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="spec-label">Location</div>
                    <div className="spec-value">
                      {formatLocation(true).replace(/•/g, '•')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 40% width on desktop (5 columns) */}
          <div className="ad-sidebar" style={{
            gridColumn: 'span 12'
          }}>
            {/* Seller Card */}
            <SellerCard
              ad={ad}
              phoneRevealed={phoneRevealed}
              onPhoneReveal={handlePhoneReveal}
              onEmailSeller={handleEmailSeller}
              formatPhoneDisplay={formatPhoneDisplay}
            />

            {/* Boost Your Ad - ONLY FOR AD OWNER */}
            {isAuthenticated && user && user.id === ad.user_id && (
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🚀 Boost Your Ad
                </h3>
                <p style={{
                  fontSize: '14px',
                  margin: '0 0 16px 0',
                  opacity: 0.9
                }}>
                  Get more visibility with Featured, Urgent, or Sticky promotions!
                </p>
                <button
                  onClick={() => navigate(`/${language}/promote/${ad.id}`, { state: { ad } })}
                  style={{
                    width: '100%',
                    background: 'white',
                    color: '#667eea',
                    fontWeight: '600',
                    padding: '12px 24px',
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Promote Now
                </button>
              </div>
            )}

            {/* Report Ad - ONLY FOR NON-OWNERS */}
            {(!isAuthenticated || !user || user.id !== ad.user_id) && (
              <div style={{
                marginTop: '20px',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <button
                  onClick={handleReportAd}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🚩 Report this ad
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related Ads Section */}
        {relatedAds && relatedAds.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '20px'
            }}>
              Related Ads
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {relatedAds.map((relatedAd) => (
                <div
                  key={relatedAd.id}
                  onClick={() => handleRelatedAdClick(relatedAd)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f1f5f9',
                    position: 'relative'
                  }}>
                    {relatedAd.primary_image ? (
                      <img
                        src={`${UPLOADS_BASE_URL}/ads/${relatedAd.primary_image}`}
                        alt={relatedAd.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '48px'
                      }}>
                        📷
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {relatedAd.title}
                    </h3>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#dc1e4a',
                      marginBottom: '8px'
                    }}>
                      {formatPrice(relatedAd.price)}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📍 {relatedAd.area_name || relatedAd.district_name || 'Location'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky CTA Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e2e8f0',
        padding: '12px 16px',
        display: 'flex',
        gap: '12px',
        zIndex: 1000,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}
        className="mobile-only"
      >
        <button
          onClick={() => {
            if (!phoneRevealed) {
              handlePhoneReveal();
            } else {
              window.location.href = `tel:${ad.seller_phone}`;
            }
          }}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          📞 {phoneRevealed ? 'Call Now' : 'Show Phone'}
        </button>
        <button
          onClick={handleEmailSeller}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: '#dc1e4a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          ✉️ Chat
        </button>
      </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false })}
        ad={ad}
        formData={contactForm}
        onFormChange={(field, value) => setContactForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleContactSubmit}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false })}
        formData={reportForm}
        onFormChange={(field, value) => setReportForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleReportSubmit}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        onAuthSuccess={() => {
          setAuthModal({ isOpen: false, mode: 'login' });
        }}
      />

      {/* Promote Ad Modal */}
      <PromoteAdModal
        isOpen={promoteModal}
        onClose={() => setPromoteModal(false)}
        ad={ad}
        onPromote={handlePromote}
      />
    </div>
  );
}

export default AdDetail;
