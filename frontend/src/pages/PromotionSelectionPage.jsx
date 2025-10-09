import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Star, Flame, Pin, TrendingUp } from 'lucide-react';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SimpleHeader from '../components/SimpleHeader';
import '../styles/PromotionSelectionPage.css';

const PromotionSelectionPage = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const [ad, setAd] = useState(location.state?.ad || null);
  const [pricing, setPricing] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Promotion types configuration
  const promotionTypes = {
    featured: {
      icon: <Star size={32} fill="#FFD700" />,
      title: 'Featured',
      description: 'Maximum visibility across homepage, search results, and category pages',
      benefits: [
        'Highlighted on homepage',
        'Top position in search results',
        'Featured in category pages',
        'Premium badge display'
      ],
      color: '#FFD700',
      bgColor: 'rgba(255, 215, 0, 0.1)'
    },
    urgent: {
      icon: <Flame size={32} />,
      title: 'Urgent',
      description: 'Priority placement at the top of category listings',
      benefits: [
        'Priority in category listings',
        'Urgent badge display',
        'Higher visibility',
        'Faster responses'
      ],
      color: '#FF4500',
      bgColor: 'rgba(255, 69, 0, 0.1)'
    },
    bump_up: {
      icon: <TrendingUp size={32} />,
      title: 'Bump Up',
      description: 'Stay at the top of category listings and move your ad to the top',
      benefits: [
        'Top of category listings',
        'Refresh ad position',
        'Consistent visibility',
        'Cost-effective boost'
      ],
      color: '#32CD32',
      bgColor: 'rgba(50, 205, 50, 0.1)'
    }
  };

  // Duration options
  const durationOptions = [3, 7, 15, 30];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch ad details if not provided
        if (!ad) {
          const adData = await ApiService.getAd(adId);
          setAd(adData);

          // Check if user owns the ad
          if (adData.user_id !== user?.id) {
            setError('You can only promote your own ads');
            return;
          }
        }

        // Fetch pricing data
        const pricingData = await ApiService.getPromotionPricing();
        setPricing(pricingData.pricing);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load promotion options');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [adId, ad, user, isAuthenticated, navigate, location.pathname]);

  const getPrice = (type, duration) => {
    if (!pricing || !pricing[type] || !pricing[type][duration]) {
      return null;
    }

    // Determine account type based on business verification
    const accountType = user?.business_verification_status === 'verified' ? 'business' : 'individual';
    return pricing[type][duration][accountType]?.price || null;
  };

  const handleProceedToPayment = () => {
    if (!selectedType || !selectedDuration) {
      alert('Please select promotion type and duration');
      return;
    }

    const price = getPrice(selectedType, selectedDuration);
    if (!price) {
      alert('Unable to calculate price. Please try again.');
      return;
    }

    // Navigate to payment page
    navigate(`/${language}/payment/${adId}`, {
      state: {
        ad,
        promotionType: selectedType,
        durationDays: selectedDuration,
        price
      }
    });
  };

  if (loading) {
    return (
      <div>
        <SimpleHeader showUserWelcome={true} />
        <div className="loading-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SimpleHeader showUserWelcome={true} />
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SimpleHeader showUserWelcome={true} />

      <div className="promotion-selection-page">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <h1>Boost Your Ad</h1>
            <p>Select a promotion type to increase your ad's visibility and reach more potential buyers</p>
          </div>

          {/* Ad Preview */}
          {ad && (
            <div className="ad-preview-card">
              <h3>Ad to Promote</h3>
              <div className="ad-preview-content">
                <h4>{ad.title}</h4>
                <p className="ad-price">रू {parseFloat(ad.price).toLocaleString('en-NP')}</p>
                <p className="ad-location">📍 {ad.location_name}</p>
              </div>
            </div>
          )}

          {/* Promotion Types */}
          <div className="promotion-section">
            <h2>1. Choose Promotion Type</h2>
            <div className="promotion-types-grid">
              {Object.entries(promotionTypes).map(([key, type]) => (
                <div
                  key={key}
                  className={`promotion-type-card ${selectedType === key ? 'selected' : ''}`}
                  onClick={() => setSelectedType(key)}
                  style={{
                    '--type-color': type.color,
                    '--type-bg': type.bgColor
                  }}
                >
                  <div className="promotion-type-header">
                    <div className="promotion-type-icon" style={{ color: type.color }}>
                      {type.icon}
                    </div>
                    <h3>{type.title}</h3>
                  </div>
                  <p className="promotion-type-description">{type.description}</p>
                  <ul className="promotion-type-benefits">
                    {type.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                  {selectedType === key && (
                    <div className="selected-badge">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          {selectedType && (
            <div className="duration-section">
              <h2>2. Choose Duration</h2>
              <div className="duration-options-grid">
                {durationOptions.map(days => {
                  const price = getPrice(selectedType, days);
                  return (
                    <div
                      key={days}
                      className={`duration-option-card ${selectedDuration === days ? 'selected' : ''}`}
                      onClick={() => price && setSelectedDuration(days)}
                      style={{ opacity: price ? 1 : 0.5, cursor: price ? 'pointer' : 'not-allowed' }}
                    >
                      <div className="duration-days">{days} Days</div>
                      {price ? (
                        <div className="duration-price">रू {price.toLocaleString('en-NP')}</div>
                      ) : (
                        <div className="duration-price">N/A</div>
                      )}
                      {selectedDuration === days && (
                        <div className="selected-badge">✓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Business Discount Notice */}
              {user?.business_verification_status !== 'verified' && (
                <div className="discount-notice">
                  <p>💡 <strong>Get 30-40% off!</strong> Verify your business to access discounted rates.</p>
                </div>
              )}
            </div>
          )}

          {/* Price Summary */}
          {selectedType && selectedDuration && (
            <div className="price-summary">
              <div className="summary-row">
                <span>Promotion Type:</span>
                <strong>{promotionTypes[selectedType].title}</strong>
              </div>
              <div className="summary-row">
                <span>Duration:</span>
                <strong>{selectedDuration} Days</strong>
              </div>
              <div className="summary-row">
                <span>Account Type:</span>
                <strong>{user?.business_verification_status === 'verified' ? 'Business (Discounted)' : 'Individual'}</strong>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <strong>रू {getPrice(selectedType, selectedDuration)?.toLocaleString('en-NP')}</strong>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={() => navigate(-1)} className="btn-cancel">
              Cancel
            </button>
            <button
              onClick={handleProceedToPayment}
              className="btn-proceed"
              disabled={!selectedType || !selectedDuration}
            >
              Proceed to Payment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionSelectionPage;
