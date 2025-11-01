// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';

interface PromoteAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: number;
    title: string;
    isFeatured?: boolean;
    isUrgent?: boolean;
    isSticky?: boolean;
  };
  onPromote?: () => void;
}

interface PricingData {
  [promotionType: string]: {
    [duration: number]: {
      individual: { price: number; discount_percentage: number };
      individual_verified: { price: number; discount_percentage: number };
      business: { price: number; discount_percentage: number };
    };
  };
}

export default function PromoteAdModal({ isOpen, onClose, ad, onPromote }: PromoteAdModalProps) {
  const [selectedType, setSelectedType] = useState<'featured' | 'urgent' | 'sticky'>('featured');
  const [selectedDuration, setSelectedDuration] = useState<3 | 7 | 15>(7);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [userAccountType, setUserAccountType] = useState<'individual' | 'individual_verified' | 'business'>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pricing data
  useEffect(() => {
    if (isOpen) {
      fetchPricing();
      checkUserAccountType();
    }
  }, [isOpen]);

  const fetchPricing = async () => {
    try {
      const response = await apiClient.getPromotionPricing();
      if (response.success && response.data) {
        setPricing(response.data.pricing);
      }
    } catch (err: any) {
      console.error('Error fetching pricing:', err);
      setError('Failed to load pricing information');
    }
  };

  const checkUserAccountType = async () => {
    try {
      const response = await apiClient.getMe();
      if (response.success && response.data) {
        const user = response.data;
        // Check account type first, then verification status
        if (user.accountType === 'business' && user.businessVerificationStatus === 'approved') {
          setUserAccountType('business');
        } else if (user.accountType === 'individual' && (user.individualVerified || user.businessVerificationStatus === 'verified')) {
          setUserAccountType('individual_verified');
        } else {
          setUserAccountType('individual');
        }
      }
    } catch (err) {
      console.error('Error checking user account type:', err);
    }
  };

  const getCurrentPrice = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;
    return typePrice[userAccountType]?.price || 0;
  };

  const getDiscountPercentage = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;
    return typePrice[userAccountType]?.discount_percentage || 0;
  };

  const getOriginalPrice = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;
    return typePrice.individual?.price || 0;
  };

  const handlePromote = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentPrice = getCurrentPrice();

      // Initiate payment
      const paymentResponse = await apiClient.initiatePayment({
        amount: currentPrice,
        paymentType: 'ad_promotion',
        relatedId: ad.id,
        metadata: {
          adId: ad.id,
          promotionType: selectedType,
          durationDays: selectedDuration
        }
      });

      if (paymentResponse.success && paymentResponse.transactionId) {
        // Simulate payment success (in production, redirect to payment gateway)
        // For now, auto-verify the payment
        const successUrl = `http://localhost:3333/api/mock-payment/success?txnId=${paymentResponse.transactionId}&amount=${currentPrice}`;

        // Open payment success URL
        window.location.href = successUrl;
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (err: any) {
      console.error('Promotion error:', err);
      setError(err.message || 'Failed to promote ad');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const discountPercent = getDiscountPercentage();
  const savings = originalPrice - currentPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Promote Your Ad</h2>
              <p className="text-sm opacity-90 mt-1">{ad.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
              {error}
            </div>
          )}

          {/* Account Type Badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Your Account:</span>
            {userAccountType === 'business' ? (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-1">
                ⭐ Verified Business (40% OFF)
              </span>
            ) : userAccountType === 'individual_verified' ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-1">
                ✓ Verified Seller (20% OFF)
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                Individual Seller
              </span>
            )}
          </div>

          {/* Promotion Type Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Choose Promotion Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Featured */}
              <button
                onClick={() => setSelectedType('featured')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === 'featured'
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-gray-200 hover:border-yellow-300 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">⭐</div>
                <h4 className="font-bold text-lg mb-2">FEATURED</h4>
                <p className="text-sm text-gray-600 mb-3">Maximum visibility across entire platform</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Homepage carousel</li>
                  <li>✓ Top of search results</li>
                  <li>✓ Category highlights</li>
                </ul>
              </button>

              {/* Urgent */}
              <button
                onClick={() => setSelectedType('urgent')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === 'urgent'
                    ? 'border-red-500 bg-red-50 shadow-lg'
                    : 'border-gray-200 hover:border-red-300 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">🔥</div>
                <h4 className="font-bold text-lg mb-2">URGENT SALE</h4>
                <p className="text-sm text-gray-600 mb-3">Priority placement for quick sales</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Top of category</li>
                  <li>✓ Above sticky ads</li>
                  <li>✓ Urgent badge</li>
                </ul>
              </button>

              {/* Sticky */}
              <button
                onClick={() => setSelectedType('sticky')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === 'sticky'
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="text-3xl mb-2">📌</div>
                <h4 className="font-bold text-lg mb-2">STICKY/BUMP</h4>
                <p className="text-sm text-gray-600 mb-3">Stay at top of category listings</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>✓ Category visibility</li>
                  <li>✓ Cost-effective</li>
                  <li>✓ Consistent placement</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Duration</h3>
            <div className="grid grid-cols-3 gap-4">
              {[3, 7, 15].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDuration(days as 3 | 7 | 15)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedDuration === days
                      ? 'border-primary bg-primary text-white shadow-lg'
                      : 'border-gray-200 hover:border-primary hover:shadow-md'
                  }`}
                >
                  <div className="text-2xl font-bold">{days}</div>
                  <div className="text-sm">days</div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Price Summary</h3>
            <div className="space-y-3">
              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-gray-500">
                  <span>Original Price:</span>
                  <span className="line-through">NPR {originalPrice.toLocaleString()}</span>
                </div>
              )}
              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-green-600 font-semibold">
                  <span>Discount ({discountPercent}%):</span>
                  <span>- NPR {savings.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-2xl font-bold text-primary border-t-2 pt-3">
                <span>Total:</span>
                <span>NPR {currentPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handlePromote}
              variant="primary"
              loading={loading}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 py-4 text-lg"
            >
              {loading ? 'Processing...' : `Promote for NPR ${currentPrice.toLocaleString()}`}
            </Button>
            <Button
              onClick={onClose}
              variant="secondary"
              disabled={loading}
              className="px-8 py-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
