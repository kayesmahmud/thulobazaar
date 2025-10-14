import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import SimpleHeader from '../components/SimpleHeader';
import '../styles/PaymentPage.css';
import { API_BASE_URL } from '../config/env.js';

const PaymentPage = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'processing', 'success', 'failed'
  const [error, setError] = useState(null);

  const { ad, promotionType, durationDays, price } = location.state || {};

  useEffect(() => {
    // Validate that we have all required data
    if (!ad || !promotionType || !durationDays || !price) {
      setError('Missing payment information. Please start over.');
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [ad, promotionType, durationDays, price, isAuthenticated, navigate, location.pathname]);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setPaymentStatus('processing');
      setError(null);

      // Initiate payment
      const response = await ApiService.initiatePayment({
        userId: user.id,
        amount: price,
        paymentType: 'ad_promotion',
        relatedId: parseInt(adId),
        metadata: {
          adId: parseInt(adId),
          promotionType,
          durationDays: parseInt(durationDays)
        }
      });

      if (response.success) {
        const { transactionId, amount } = response;

        // For mock payment, show a confirm dialog
        const confirmPayment = window.confirm(
          `Mock Payment Gateway\n\nAmount: रू ${amount.toLocaleString('en-NP')}\nTransaction ID: ${transactionId}\n\nClick OK to complete payment (Success) or Cancel to fail payment.`
        );

        if (confirmPayment) {
          // Complete payment
          window.location.href = `${API_BASE_URL}/mock-payment/success?txnId=${transactionId}&amount=${amount}`;
        } else {
          // Cancel payment
          setPaymentStatus('failed');
          setError('Payment cancelled by user');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStatus('failed');
      setError(err.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  const getPromotionTypeDisplay = (type) => {
    const types = {
      featured: 'Featured',
      urgent: 'Urgent',
      sticky: 'Sticky',
      bump_up: 'Bump Up'
    };
    return types[type] || type;
  };

  if (error && !ad) {
    return (
      <div>
        <SimpleHeader showUserWelcome={true} />
        <div className="payment-page">
          <div className="payment-error">
            <XCircle size={64} color="#dc2626" />
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate(-2)} className="btn-primary">
              Back to Ad
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SimpleHeader showUserWelcome={true} />

      <div className="payment-page">
        <div className="payment-container">
          {/* Payment Header */}
          <div className="payment-header">
            <CreditCard size={48} color="#2563eb" />
            <h1>Complete Your Payment</h1>
            <p>Secure payment for ad promotion</p>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>

            <div className="summary-section">
              <h3>Ad Details</h3>
              <div className="summary-item">
                <span>Title:</span>
                <strong>{ad?.title}</strong>
              </div>
              <div className="summary-item">
                <span>Price:</span>
                <strong>रू {parseFloat(ad?.price).toLocaleString('en-NP')}</strong>
              </div>
              <div className="summary-item">
                <span>Location:</span>
                <strong>{ad?.location_name}</strong>
              </div>
            </div>

            <div className="summary-section">
              <h3>Promotion Details</h3>
              <div className="summary-item">
                <span>Type:</span>
                <strong>{getPromotionTypeDisplay(promotionType)}</strong>
              </div>
              <div className="summary-item">
                <span>Duration:</span>
                <strong>{durationDays} Days</strong>
              </div>
              <div className="summary-item">
                <span>Start Date:</span>
                <strong>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </div>
              <div className="summary-item">
                <span>End Date:</span>
                <strong>
                  {new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
              </div>
            </div>

            <div className="total-amount">
              <span>Total Amount:</span>
              <strong>रू {price?.toLocaleString('en-NP')}</strong>
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <div className="payment-status processing">
              <Loader size={48} className="spinner" />
              <h3>Processing Payment...</h3>
              <p>Please wait while we process your payment</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="payment-status success">
              <CheckCircle size={64} color="#22c55e" />
              <h3>Payment Successful!</h3>
              <p>Your ad has been promoted successfully</p>
              <button onClick={() => navigate(`/ad/${adId}`)} className="btn-primary">
                View Ad
              </button>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="payment-status failed">
              <XCircle size={64} color="#dc2626" />
              <h3>Payment Failed</h3>
              <p>{error || 'Something went wrong with your payment'}</p>
              <button onClick={() => setPaymentStatus(null)} className="btn-retry">
                Try Again
              </button>
            </div>
          )}

          {/* Payment Buttons */}
          {!paymentStatus && (
            <div className="payment-actions">
              <button
                onClick={() => navigate(-1)}
                className="btn-cancel"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                className="btn-pay"
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay रू ${price?.toLocaleString('en-NP')}`}
              </button>
            </div>
          )}

          {/* Payment Info */}
          <div className="payment-info">
            <p>🔒 Your payment information is secure</p>
            <p className="test-mode">⚠️ Test Mode: This is a mock payment gateway for testing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
