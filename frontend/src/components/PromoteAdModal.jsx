import React, { useState } from 'react';
import { X, Star, Flame, Pin, Info } from 'lucide-react';
import '../styles/PromoteAdModal.css';

const PromoteAdModal = ({ isOpen, onClose, ad, onPromote }) => {
  const [selectedType, setSelectedType] = useState('featured');
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promotion pricing (from backend promotionService.js)
  const pricing = {
    featured: {
      3: { individual: 500, business: 350 },
      7: { individual: 1000, business: 700 },
      15: { individual: 1800, business: 1080 }
    },
    urgent: {
      3: { individual: 300, business: 210 },
      7: { individual: 600, business: 420 },
      15: { individual: 1000, business: 600 }
    },
    sticky: {
      3: { individual: 150, business: 105 },
      7: { individual: 300, business: 210 },
      15: { individual: 500, business: 300 }
    }
  };

  const promotionTypes = [
    {
      id: 'featured',
      name: 'Featured',
      icon: <Star className="promotion-icon" />,
      color: '#FFD700',
      description: 'Maximum visibility on homepage, search results, and category pages',
      benefits: [
        'Top placement on homepage',
        'Priority in search results',
        'Featured badge on ad',
        'Maximum exposure'
      ]
    },
    {
      id: 'urgent',
      name: 'Urgent Sale',
      icon: <Flame className="promotion-icon" />,
      color: '#FF4500',
      description: 'Perfect for quick sales - appears at top of subcategory',
      benefits: [
        'Top of subcategory listing',
        'Urgent sale badge',
        'Priority over sticky ads',
        'Quick buyer attention'
      ]
    },
    {
      id: 'sticky',
      name: 'Sticky/Bump',
      icon: <Pin className="promotion-icon" />,
      color: '#4169E1',
      description: 'Keep your ad at the top of subcategory listings',
      benefits: [
        'Stay at top of subcategory',
        'Sticky badge',
        'Better than regular ads',
        'Consistent visibility'
      ]
    }
  ];

  const durations = [3, 7, 15];

  const getCurrentPrice = () => {
    // TODO: Get actual user account type from context/auth
    const accountType = 'individual'; // For now, default to individual
    return pricing[selectedType][selectedDuration][accountType];
  };

  const handlePromote = async () => {
    if (!ad) return;

    setIsProcessing(true);
    try {
      await onPromote({
        adId: ad.id,
        promotionType: selectedType,
        durationDays: selectedDuration,
        amount: getCurrentPrice()
      });
    } catch (error) {
      console.error('Promotion error:', error);
      alert('Failed to initiate promotion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="promote-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Promote Your Ad</h2>
          <button className="close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          {/* Ad Preview */}
          <div className="ad-preview">
            <h3>{ad?.title}</h3>
            <p className="ad-price">रू {ad?.price?.toLocaleString()}</p>
          </div>

          {/* Promotion Type Selection */}
          <div className="section">
            <h3>Select Promotion Type</h3>
            <div className="promotion-types">
              {promotionTypes.map(type => (
                <div
                  key={type.id}
                  className={`promotion-card ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                  style={{ '--accent-color': type.color }}
                >
                  <div className="promotion-header">
                    {type.icon}
                    <h4>{type.name}</h4>
                  </div>
                  <p className="promotion-description">{type.description}</p>
                  <ul className="promotion-benefits">
                    {type.benefits.map((benefit, idx) => (
                      <li key={idx}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="promotion-price">
                    रू {pricing[type.id][selectedDuration].individual}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duration Selection */}
          <div className="section">
            <h3>Select Duration</h3>
            <div className="duration-options">
              {durations.map(days => (
                <button
                  key={days}
                  className={`duration-btn ${selectedDuration === days ? 'selected' : ''}`}
                  onClick={() => setSelectedDuration(days)}
                >
                  <span className="duration-days">{days} Days</span>
                  <span className="duration-price">
                    रू {pricing[selectedType][days].individual}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="summary-row">
              <span>Promotion Type:</span>
              <strong>{promotionTypes.find(t => t.id === selectedType)?.name}</strong>
            </div>
            <div className="summary-row">
              <span>Duration:</span>
              <strong>{selectedDuration} Days</strong>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <strong>रू {getCurrentPrice().toLocaleString()}</strong>
            </div>
          </div>

          {/* Info Note */}
          <div className="info-note">
            <Info size={16} />
            <p>
              Business verified accounts get 30-40% discount on all promotions!
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            className="btn-promote"
            onClick={handlePromote}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Pay रू ${getCurrentPrice().toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteAdModal;
