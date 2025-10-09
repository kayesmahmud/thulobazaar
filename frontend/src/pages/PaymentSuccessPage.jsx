import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import SimpleHeader from '../components/SimpleHeader';
import '../styles/PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [ad, setAd] = useState(null);

  const txnId = searchParams.get('txnId');
  const amount = searchParams.get('amount');
  const adId = searchParams.get('adId');

  useEffect(() => {
    // Fetch ad details to get slug
    const fetchAd = async () => {
      if (adId) {
        try {
          const adData = await ApiService.getAd(adId);
          setAd(adData);
        } catch (error) {
          console.error('Error fetching ad:', error);
        }
      }
    };
    fetchAd();
  }, [adId]);

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      if (ad && ad.slug) {
        navigate(`/${language}/ad/${ad.slug}`);
      } else if (adId) {
        navigate(`/${language}/dashboard`);
      } else {
        navigate(`/${language}`);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [ad, adId, language, navigate]);

  return (
    <div>
      <SimpleHeader showUserWelcome={true} />

      <div className="payment-success-page">
        <div className="success-container">
          <div className="success-icon">
            <CheckCircle size={80} color="#22c55e" />
          </div>

          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-message">
            Your ad promotion has been activated successfully
          </p>

          <div className="success-details">
            <div className="detail-row">
              <span className="detail-label">Transaction ID:</span>
              <span className="detail-value">{txnId}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Amount Paid:</span>
              <span className="detail-value amount">रू {parseFloat(amount).toLocaleString('en-NP')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-verified">✓ Verified</span>
            </div>
          </div>

          <div className="success-actions">
            <button
              onClick={() => navigate(ad && ad.slug ? `/${language}/ad/${ad.slug}` : `/${language}/dashboard`)}
              className="btn-view-ad"
            >
              View Your Ad
            </button>
            <button
              onClick={() => navigate(`/${language}/dashboard`)}
              className="btn-dashboard"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="auto-redirect">
            You will be redirected to your ad in 10 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
