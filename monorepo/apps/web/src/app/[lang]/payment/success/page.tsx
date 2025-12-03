'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaymentDetails {
  orderId: string;
  gateway: string;
  type: string;
  relatedId?: string;
  adSlug?: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const orderId = searchParams.get('orderId') || '';
    const gateway = searchParams.get('gateway') || '';
    const type = searchParams.get('type') || '';
    const relatedId = searchParams.get('relatedId') || undefined;

    setDetails({ orderId, gateway, type, relatedId });

    // If this is an ad promotion, fetch the ad slug
    if (type === 'ad_promotion' && relatedId) {
      fetch(`/api/ads/${relatedId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.slug) {
            setDetails(prev => prev ? { ...prev, adSlug: data.data.slug } : null);
          }
        })
        .catch(console.error);
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-redirect based on payment type
      if (details?.type === 'ad_promotion') {
        if (details.adSlug) {
          router.push(`/en/ad/${details.adSlug}`);
        } else {
          // Fallback to dashboard if no slug available
          router.push('/en/dashboard');
        }
      } else if (details?.type === 'individual_verification' || details?.type === 'business_verification') {
        router.push('/en/verification');
      } else {
        router.push('/en/dashboard');
      }
    }
  }, [countdown, details, router]);

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'ad_promotion':
        return 'Ad Promotion';
      case 'individual_verification':
        return 'Individual Verification';
      case 'business_verification':
        return 'Business Verification';
      default:
        return 'Payment';
    }
  };

  const getGatewayLabel = (gateway: string) => {
    return gateway === 'khalti' ? 'Khalti' : gateway === 'esewa' ? 'eSewa' : gateway;
  };

  const getNextStepLink = () => {
    if (details?.type === 'ad_promotion') {
      if (details.adSlug) {
        return `/en/ad/${details.adSlug}`;
      }
      return '/en/dashboard';
    } else if (details?.type === 'individual_verification' || details?.type === 'business_verification') {
      return '/en/verification';
    }
    return '/en/dashboard';
  };

  const getNextStepLabel = () => {
    if (details?.type === 'ad_promotion') {
      return 'View Your Ad';
    } else if (details?.type === 'individual_verification' || details?.type === 'business_verification') {
      return 'View Verification Status';
    }
    return 'Go to Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with animation */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Animated circles */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-300" />
            </div>

            {/* Success icon */}
            <div className="relative z-10">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">
                Payment Successful!
              </h1>
              <p className="text-green-100 mt-2 text-sm sm:text-base">
                Your transaction has been completed
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 sm:p-6">
            {details && (
              <div className="space-y-3">
                {/* Transaction ID */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Transaction ID</span>
                  <span className="font-mono text-xs sm:text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {details.orderId.slice(0, 20)}...
                  </span>
                </div>

                {/* Payment Type */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Payment For</span>
                  <span className="font-semibold text-gray-800">
                    {getPaymentTypeLabel(details.type)}
                  </span>
                </div>

                {/* Payment Gateway */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 text-sm">Paid Via</span>
                  <span className={`font-semibold flex items-center gap-2 ${
                    details.gateway === 'khalti' ? 'text-purple-600' : 'text-green-600'
                  }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      details.gateway === 'khalti' ? 'bg-purple-600' : 'bg-green-600'
                    }`}>
                      {details.gateway === 'khalti' ? 'K' : 'e'}
                    </span>
                    {getGatewayLabel(details.gateway)}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 text-sm">Status</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Verified
                  </span>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What&apos;s Next?
              </h3>
              <p className="text-gray-600 text-sm mt-2">
                {details?.type === 'ad_promotion' && (
                  <>Your ad is now promoted and will get more visibility. The promotion is active immediately.</>
                )}
                {details?.type === 'individual_verification' && (
                  <>Your individual verification payment is complete. Your documents will be reviewed within 24-48 hours.</>
                )}
                {details?.type === 'business_verification' && (
                  <>Your business verification payment is complete. Our team will review your documents within 2-3 business days.</>
                )}
                {!details?.type && (
                  <>Your payment has been processed successfully.</>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 space-y-3">
              <Link
                href={getNextStepLink()}
                className="block w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25"
              >
                {getNextStepLabel()}
              </Link>

              <Link
                href="/en/dashboard"
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center font-medium rounded-xl hover:bg-gray-200 transition-all"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Auto-redirect notice */}
            <p className="text-center text-gray-400 text-xs mt-4">
              Auto-redirecting in {countdown} seconds...
            </p>
          </div>
        </div>

        {/* Support Note */}
        <p className="text-center text-gray-500 text-sm mt-4 px-4">
          Having issues? Contact{' '}
          <a href="mailto:support@thulobazaar.com" className="text-blue-600 hover:underline">
            support@thulobazaar.com
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
