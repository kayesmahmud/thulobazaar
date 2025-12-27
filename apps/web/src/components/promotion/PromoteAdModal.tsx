// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui';
import { PaymentMethodSelector } from '@/components/payment';
import type { PaymentGateway } from '@/lib/paymentGateways/types';

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

// Tier labels for display
const tierLabels: Record<string, string> = {
  default: 'Standard',
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  property: 'Property',
};

export default function PromoteAdModal({ isOpen, onClose, ad, onPromote }: PromoteAdModalProps) {
  const [selectedType, setSelectedType] = useState<'featured' | 'urgent' | 'sticky'>('featured');
  const [selectedDuration, setSelectedDuration] = useState<3 | 7 | 15>(7);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [pricingTier, setPricingTier] = useState<string>('default');
  const [userAccountType, setUserAccountType] = useState<'individual' | 'individual_verified' | 'business'>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<{
    id: number;
    name: string;
    discountPercentage: number;
    bannerText: string;
    bannerEmoji: string;
    daysRemaining: number;
    promoCode?: string;
  } | null>(null);

  // Fetch pricing data and active campaigns
  useEffect(() => {
    if (isOpen) {
      fetchPricing();
      checkUserAccountType();
      fetchActiveCampaigns();
      // Reset to first step when opening
      setStep('select');
      setSelectedPaymentMethod(null);
      setActiveCampaign(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, ad.id]);

  const fetchPricing = async () => {
    try {
      // Fetch pricing with adId to get tier-specific pricing
      const response = await apiClient.getPromotionPricing({ adId: ad.id });
      if (response.success && response.data) {
        // Use ad-specific pricing if available, otherwise use default
        setPricing(response.data.adPricing || response.data.pricing);
        // Set the tier for display
        setPricingTier(response.data.adPricingTier || 'default');
        console.log('📊 [Pricing] Tier for ad:', response.data.adPricingTier || 'default');
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

  const fetchActiveCampaigns = async () => {
    try {
      const response = await fetch(`/api/promotional-campaigns/active?tier=${pricingTier}`);
      const data = await response.json();
      if (data.success && data.data?.bestCampaign) {
        setActiveCampaign(data.data.bestCampaign);
      }
    } catch (err) {
      console.error('Error fetching active campaigns:', err);
    }
  };

  // Map account type to pricing key (individual_verified uses individual pricing)
  const getPricingAccountType = () => {
    if (userAccountType === 'individual_verified') return 'individual';
    return userAccountType;
  };

  const getCurrentPrice = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;

    const originalPrice = typePrice.individual?.price || 0;

    // Calculate ADDITIVE total discount (not compound)
    let totalDiscountPercent = 0;

    // Account type discount
    if (userAccountType === 'individual_verified') {
      totalDiscountPercent += 20; // 20% for verified individual
    } else if (userAccountType === 'business') {
      totalDiscountPercent += 40; // 40% for verified business
    }

    // Campaign discount (additive)
    if (activeCampaign && activeCampaign.discountPercentage > 0) {
      totalDiscountPercent += activeCampaign.discountPercentage;
    }

    // Cap total discount at 90% (don't allow free promotions)
    totalDiscountPercent = Math.min(totalDiscountPercent, 90);

    // Apply combined discount
    const finalPrice = Math.round(originalPrice * (1 - totalDiscountPercent / 100));

    return finalPrice;
  };

  const getDiscountPercentage = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;
    // For individual_verified, return 20% discount
    if (userAccountType === 'individual_verified') {
      return 20;
    }
    const pricingAccountType = getPricingAccountType();
    return typePrice[pricingAccountType]?.discountPercentage || 0;
  };

  const getOriginalPrice = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;
    return typePrice.individual?.price || 0;
  };

  // Get price after account discount but before campaign discount
  const getPriceBeforeCampaign = () => {
    if (!pricing || !pricing[selectedType]) return 0;
    const typePrice = pricing[selectedType][selectedDuration];
    if (!typePrice) return 0;

    const originalPrice = typePrice.individual?.price || 0;

    // Calculate account type discount only (no campaign)
    let accountDiscountPercent = 0;
    if (userAccountType === 'individual_verified') {
      accountDiscountPercent = 20;
    } else if (userAccountType === 'business') {
      accountDiscountPercent = 40;
    }

    return Math.round(originalPrice * (1 - accountDiscountPercent / 100));
  };

  // Get total combined discount percentage (ADDITIVE, not compound)
  const getTotalDiscountPercentage = () => {
    let total = 0;

    // Account type discount
    if (userAccountType === 'individual_verified') {
      total += 20;
    } else if (userAccountType === 'business') {
      total += 40;
    }

    // Campaign discount (additive)
    if (activeCampaign && activeCampaign.discountPercentage > 0) {
      total += activeCampaign.discountPercentage;
    }

    // Cap at 90% max discount
    return Math.min(total, 90);
  };

  const handleProceedToPayment = () => {
    setStep('payment');
    setError(null);
  };

  const handleBackToSelection = () => {
    setStep('select');
    setSelectedPaymentMethod(null);
    setError(null);
  };

  const handlePromote = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentPrice = getCurrentPrice();

      // Initiate payment with selected gateway
      // Note: Auth is handled via NextAuth cookies, not localStorage
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for NextAuth session
        body: JSON.stringify({
          gateway: selectedPaymentMethod,
          amount: currentPrice,
          paymentType: 'ad_promotion',
          relatedId: ad.id,
          orderName: `Promote Ad: ${ad.title}`,
          metadata: {
            adId: ad.id,
            promotionType: selectedType,
            durationDays: selectedDuration,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.paymentUrl) {
        // Redirect to payment gateway
        window.location.href = data.data.paymentUrl;
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      console.error('Promotion error:', err);
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPrice = getCurrentPrice();
  const originalPrice = getOriginalPrice();
  const discountPercent = getDiscountPercentage();
  const savings = originalPrice - currentPrice;

  // Check if we're in development/sandbox mode
  const isDevelopment = process.env.NODE_ENV === 'development' ||
    typeof window !== 'undefined' && window.location.hostname === 'localhost';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-purple-600 text-white p-4 sm:p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 'select' ? 'Promote Your Ad' : 'Complete Payment'}
              </h2>
              <p className="text-sm opacity-90 mt-1 truncate">{ad.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-2 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-1.5 ${step === 'select' ? 'opacity-100' : 'opacity-60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'select' ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
              }`}>1</span>
              <span className="text-sm hidden sm:inline">Select Plan</span>
            </div>
            <div className="w-8 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'opacity-100' : 'opacity-60'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                step === 'payment' ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
              }`}>2</span>
              <span className="text-sm hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'select' ? (
            <>
              {/* Pricing Tier Badge */}
              {pricingTier !== 'default' && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-amber-800">
                      <strong>{tierLabels[pricingTier] || pricingTier}</strong> category pricing applies to this ad
                    </span>
                  </div>
                </div>
              )}

              {/* Active Campaign Banner - Auto Applied */}
              {activeCampaign && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activeCampaign.bannerEmoji || '🎉'}</span>
                      <div>
                        <h4 className="font-bold text-green-800">{activeCampaign.name}</h4>
                        <p className="text-sm text-green-700">
                          Extra {activeCampaign.discountPercentage}% OFF automatically applied!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-green-500 text-white rounded-full text-sm font-bold">
                        -{activeCampaign.discountPercentage}%
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        ⏰ {activeCampaign.daysRemaining} days left
                      </span>
                    </div>
                  </div>
                  {/* Show promo code as auto-applied */}
                  {activeCampaign.promoCode && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-green-700">
                        Promo Code: <strong className="font-mono">{activeCampaign.promoCode}</strong> - Automatically Applied!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Account Type Badge */}
              <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-sm font-medium text-gray-600">Your Account:</span>
                {userAccountType === 'business' ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-1">
                    <span className="hidden sm:inline">✨</span> Verified Business Seller (40% OFF)
                  </span>
                ) : userAccountType === 'individual_verified' ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold flex items-center gap-1">
                    <span className="hidden sm:inline">✓</span> Verified Individual Seller (20% OFF)
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                    Individual Seller (Standard Price)
                  </span>
                )}
              </div>

              {/* Promotion Type Selection */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Choose Promotion Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Featured */}
                  <button
                    onClick={() => setSelectedType('featured')}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                      selectedType === 'featured'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 hover:border-yellow-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-2">⭐</div>
                    <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">FEATURED</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Maximum visibility across entire platform</p>
                    <ul className="text-xs text-gray-500 space-y-1 hidden sm:block">
                      <li>✓ Homepage carousel</li>
                      <li>✓ Top of search results</li>
                      <li>✓ Category highlights</li>
                    </ul>
                  </button>

                  {/* Urgent */}
                  <button
                    onClick={() => setSelectedType('urgent')}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                      selectedType === 'urgent'
                        ? 'border-red-500 bg-red-50 shadow-lg'
                        : 'border-gray-200 hover:border-red-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-2">🔥</div>
                    <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">URGENT SALE</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Priority placement for quick sales</p>
                    <ul className="text-xs text-gray-500 space-y-1 hidden sm:block">
                      <li>✓ Top of category</li>
                      <li>✓ Above sticky ads</li>
                      <li>✓ Urgent badge</li>
                    </ul>
                  </button>

                  {/* Sticky */}
                  <button
                    onClick={() => setSelectedType('sticky')}
                    className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left ${
                      selectedType === 'sticky'
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-2xl sm:text-3xl mb-2">📌</div>
                    <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">STICKY</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Stay at top of category listings</p>
                    <ul className="text-xs text-gray-500 space-y-1 hidden sm:block">
                      <li>✓ Category visibility</li>
                      <li>✓ Cost-effective</li>
                      <li>✓ Consistent placement</li>
                    </ul>
                  </button>
                </div>
              </div>

              {/* Duration Selection */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Select Duration</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[3, 7, 15].map((days) => (
                    <button
                      key={days}
                      onClick={() => setSelectedDuration(days as 3 | 7 | 15)}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        selectedDuration === days
                          ? 'border-rose-500 bg-rose-500 text-white shadow-lg'
                          : 'border-gray-200 hover:border-rose-500 hover:shadow-md'
                      }`}
                    >
                      <div className="text-xl sm:text-2xl font-bold">{days}</div>
                      <div className="text-xs sm:text-sm">days</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Price Summary</h3>
                <div className="space-y-2 sm:space-y-3">
                  {/* Original Price */}
                  {(discountPercent > 0 || activeCampaign) && (
                    <div className="flex justify-between items-center text-gray-500 text-sm sm:text-base">
                      <span>Original Price:</span>
                      <span className="line-through">NPR {originalPrice.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Account Type Discount */}
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-blue-600 font-medium text-sm sm:text-base">
                      <span className="flex items-center gap-1">
                        {userAccountType === 'business' ? '✨ Business Discount' : '✓ Verified Discount'} ({discountPercent}%):
                      </span>
                      <span>- NPR {(originalPrice - getPriceBeforeCampaign()).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Campaign Discount */}
                  {activeCampaign && activeCampaign.discountPercentage > 0 && (
                    <div className="flex justify-between items-center text-green-600 font-medium text-sm sm:text-base">
                      <span className="flex items-center gap-1">
                        {activeCampaign.bannerEmoji} {activeCampaign.name} ({activeCampaign.discountPercentage}%):
                      </span>
                      <span>- NPR {(getPriceBeforeCampaign() - currentPrice).toLocaleString()}</span>
                    </div>
                  )}

                  {/* Total Savings */}
                  {(discountPercent > 0 || activeCampaign) && (
                    <div className="flex justify-between items-center text-green-700 font-semibold text-sm sm:text-base bg-green-50 -mx-4 px-4 py-2 rounded-lg">
                      <span>🎉 Total Savings:</span>
                      <span>NPR {(originalPrice - currentPrice).toLocaleString()} ({getTotalDiscountPercentage()}% OFF)</span>
                    </div>
                  )}

                  {/* Final Price */}
                  <div className="flex justify-between items-center text-xl sm:text-2xl font-bold text-rose-500 border-t-2 pt-3">
                    <span>Total:</span>
                    <span>NPR {currentPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handleProceedToPayment}
                  variant="primary"
                  className="flex-1 bg-gradient-to-r from-primary to-purple-600 py-3 sm:py-4 text-base sm:text-lg order-1 sm:order-1"
                >
                  Proceed to Payment
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="px-6 sm:px-8 py-3 sm:py-4 order-2 sm:order-2"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Payment Step */}
              <div className="mb-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Order Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Promotion Type:</span>
                      <span className="font-medium capitalize">{selectedType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedDuration} days</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-800 font-semibold">Total Amount:</span>
                      <span className="text-lg font-bold text-rose-600">NPR {currentPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                  amount={currentPrice}
                  disabled={loading}
                  showTestInfo={isDevelopment}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handlePromote}
                  variant="primary"
                  loading={loading}
                  disabled={loading || !selectedPaymentMethod}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 py-3 sm:py-4 text-base sm:text-lg order-1 sm:order-1"
                >
                  {loading ? 'Processing...' : `Pay NPR ${currentPrice.toLocaleString()}`}
                </Button>
                <Button
                  onClick={handleBackToSelection}
                  variant="secondary"
                  disabled={loading}
                  className="px-6 sm:px-8 py-3 sm:py-4 order-2 sm:order-2"
                >
                  Back
                </Button>
              </div>

              {/* Security Note */}
              <p className="text-center text-xs text-gray-400 mt-4">
                You will be redirected to {selectedPaymentMethod === 'khalti' ? 'Khalti' : selectedPaymentMethod === 'esewa' ? 'eSewa' : 'payment gateway'} to complete your payment securely.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
