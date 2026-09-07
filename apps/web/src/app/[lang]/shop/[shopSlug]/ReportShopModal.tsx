'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useSession } from 'next-auth/react';

interface ReportShopModalProps {
  shopId: number;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

const REPORT_REASONS = [
  { value: 'fraud', labelKey: 'reportShopFraud', icon: '⚠️', descKey: 'reportShopFraudDesc' },
  { value: 'harassment', labelKey: 'reportShopHarassment', icon: '🚫', descKey: 'reportShopHarassmentDesc' },
  { value: 'fake_products', labelKey: 'reportShopFakeProducts', icon: '📦', descKey: 'reportShopFakeProductsDesc' },
  { value: 'poor_service', labelKey: 'reportShopPoorService', icon: '👎', descKey: 'reportShopPoorServiceDesc' },
  { value: 'impersonation', labelKey: 'reportShopImpersonation', icon: '🎭', descKey: 'reportShopImpersonationDesc' },
  { value: 'other', labelKey: 'reportShopOther', icon: '📝', descKey: 'reportShopOtherDesc' },
] as const;

export default function ReportShopModal({ shopId, shopName, isOpen, onClose, lang }: ReportShopModalProps) {
  const t = useTranslations('shop');
  const pathname = usePathname();
  const { isAuthenticated } = useUserAuth();
  const { data: session } = useSession();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError(t('selectReportReason'));
      return;
    }

    if (!isAuthenticated) {
      setError(t('loginToReportShop'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get the backend token from session
      const backendToken = (session?.user as any)?.backendToken;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add Authorization header if we have a backend token
      if (backendToken) {
        headers['Authorization'] = `Bearer ${backendToken}`;
      }

      const response = await fetch('/api/shop-reports', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          shopId,
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
          // Reset state
          setSelectedReason('');
          setDetails('');
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.message || t('failedToSubmitReport'));
      }
    } catch (err) {
      setError(t('failedToSubmitReport'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDetails('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🏪</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('reportShop')}</h2>
                <p className="text-sm text-white/80 line-clamp-1">{shopName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('reportSubmitted')}</h3>
              <p className="text-gray-600">{t('reportSubmittedDesc')}</p>
            </div>
          ) : !isAuthenticated ? (
            /* Not Authenticated State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4m0 0l-3 3m3-3l3 3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('loginRequired')}</h3>
              <p className="text-gray-600 mb-4">{t('loginToReportShop')}</p>
              <a
                href={`/${lang}/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                className="inline-block px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                {t('loginToContinue')}
              </a>
            </div>
          ) : (
            /* Report Form */
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Reason Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('whyReportingShop')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedReason === reason.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{reason.icon}</span>
                      <div className="text-left flex-1">
                        <div className={`font-medium ${selectedReason === reason.value ? 'text-orange-700' : 'text-gray-900'}`}>
                          {t(reason.labelKey)}
                        </div>
                        <div className="text-xs text-gray-500">{t(reason.descKey)}</div>
                      </div>
                      {selectedReason === reason.value && (
                        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('additionalDetails')}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={t('additionalDetailsPlaceholder')}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                />
                <div className="text-xs text-gray-400 text-right mt-1">
                  {details.length}/500
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <span>🏪</span>
                    {t('submitReport')}
                  </>
                )}
              </button>

              {/* Disclaimer */}
              <p className="mt-4 text-xs text-gray-500 text-center">
                {t('falseReportsWarning')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
