import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { styles, colors, spacing, typography, borderRadius } from '../styles/theme';
import AuthModal from './AuthModal';
import SimpleHeader from './SimpleHeader';
import Breadcrumb from './Breadcrumb';
import { recentlyViewedUtils } from '../utils/recentlyViewed';
import { extractAdIdFromUrl, generateBrowseUrl, generateSlug } from '../utils/urlUtils';

// Import new components
import ImageGallery from './ad-detail/ImageGallery';
import SellerCard from './ad-detail/SellerCard';
import ContactModal from './ad-detail/ContactModal';
import ReportModal from './ad-detail/ReportModal';
import PromoteAdModal from './PromoteAdModal';
import PromotionBadge from './PromotionBadge';

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
          window.location.href = `http://localhost:5000/api/mock-payment/success?txnId=${transactionId}&amount=${amount}`;
        } else {
          // Fail payment
          window.location.href = `http://localhost:5000/api/mock-payment/failure?txnId=${transactionId}&reason=User+cancelled`;
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
          <meta property="og:image" content={`http://localhost:5000/uploads/ads/${ad.primary_image}`} />
        )}
        <meta property="og:site_name" content="Thulobazaar" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${ad.title} - Thulobazaar`} />
        <meta name="twitter:description" content={metaDescription} />
        {ad.primary_image && (
          <meta name="twitter:image" content={`http://localhost:5000/uploads/ads/${ad.primary_image}`} />
        )}

        {/* Product schema for rich snippets */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": ad.title,
            "description": metaDescription,
            "image": ad.primary_image ? `http://localhost:5000/uploads/ads/${ad.primary_image}` : undefined,
            "offers": {
              "@type": "Offer",
              "price": ad.price,
              "priceCurrency": "NPR",
              "availability": "https://schema.org/InStock",
              "url": canonicalUrl
            }
          })}
        </script>
      

      <SimpleHeader showUserWelcome={true} />

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
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${spacing['3xl']} ${spacing.xl}`
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: spacing['3xl']
        }}>
          {/* Main Content */}
          <div>
            {/* Ad Title and Price */}
            <div style={{ marginBottom: spacing['2xl'] }}>
              <h1 style={styles.heading.h1}>{ad.title}</h1>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xl,
                marginBottom: spacing.lg,
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontSize: typography.fontSize['4xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary
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
                gap: spacing.xl,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                <span>📍 {formatLocation()}</span>
                <span>👁️ {ad.view_count} views</span>
                <span>🕒 {formatDate(ad.created_at)}</span>
              </div>
            </div>

            {/* Image Gallery */}
            <div style={{ marginBottom: spacing['2xl'] }}>
              <ImageGallery images={ad.images} title={ad.title} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: spacing['2xl'] }}>
              <h2 style={styles.heading.h2}>Description</h2>
              <div style={styles.card.flat}>
                <p style={{
                  lineHeight: typography.lineHeight.relaxed,
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base
                }}>
                  {ad.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Ad Details */}
            <div>
              <h2 style={styles.heading.h2}>Details</h2>
              <div style={styles.card.flat}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: spacing.lg
                }}>
                  {/* Show parent category if it exists (subcategory scenario) */}
                  {ad.parent_category_name ? (
                    <>
                      <div>
                        <strong style={{ color: colors.text.secondary }}>Category:</strong>
                        <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{ad.parent_category_name}</p>
                      </div>
                      <div>
                        <strong style={{ color: colors.text.secondary }}>Sub-category:</strong>
                        <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{ad.category_name}</p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <strong style={{ color: colors.text.secondary }}>Category:</strong>
                      <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{ad.category_name}</p>
                    </div>
                  )}
                  <div>
                    <strong style={{ color: colors.text.secondary }}>Condition:</strong>
                    <p style={{
                      color: colors.text.primary,
                      marginTop: spacing.xs,
                      textTransform: 'capitalize'
                    }}>
                      {ad.condition}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: colors.text.secondary }}>Location:</strong>
                    <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{formatLocation(true)}</p>
                  </div>
                  <div>
                    <strong style={{ color: colors.text.secondary }}>Posted:</strong>
                    <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{formatDate(ad.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
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
                ...styles.card.default,
                marginTop: spacing.xl,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none'
              }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '18px',
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
                    ...styles.button.primary,
                    width: '100%',
                    background: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    padding: '12px 24px',
                    fontSize: '16px'
                  }}
                >
                  Promote Now
                </button>
              </div>
            )}

            {/* Report Ad - ONLY FOR NON-OWNERS */}
            {(!isAuthenticated || !user || user.id !== ad.user_id) && (
              <div style={{
                ...styles.card.default,
                marginTop: spacing.xl
              }}>
                <button
                  onClick={handleReportAd}
                  style={{
                    ...styles.button.ghost,
                    width: '100%'
                  }}
                >
                  🚩 Report this ad
                </button>
              </div>
            )}
          </div>
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
