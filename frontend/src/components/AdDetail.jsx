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
import { extractAdIdFromUrl } from '../utils/urlUtils';

// Import new components
import ImageGallery from './ad-detail/ImageGallery';
import SellerCard from './ad-detail/SellerCard';
import ContactModal from './ad-detail/ContactModal';
import ReportModal from './ad-detail/ReportModal';

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

  return (
    <div>
      <SimpleHeader showUserWelcome={true} />

      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: ad.category_name, path: `/search?category=${encodeURIComponent(ad.category_name)}` },
          { label: ad.title, current: true }
        ]}
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
                marginBottom: spacing.lg
              }}>
                <div style={{
                  fontSize: typography.fontSize['4xl'],
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary
                }}>
                  {formatPrice(ad.price)}
                </div>
                {ad.is_featured && (
                  <span style={styles.badge.featured}>
                    FEATURED
                  </span>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xl,
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary
              }}>
                <span>📍 {ad.location_name}</span>
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
                  <div>
                    <strong style={{ color: colors.text.secondary }}>Category:</strong>
                    <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{ad.category_name}</p>
                  </div>
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
                    <p style={{ color: colors.text.primary, marginTop: spacing.xs }}>{ad.location_name}</p>
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

            {/* Report Ad */}
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
    </div>
  );
}

export default AdDetail;
