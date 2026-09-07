'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useUserAuth } from '@/contexts/UserAuthContext';

interface ReportAdModalProps {
  adId: number;
  adTitle: string;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}

const REPORT_REASONS = [
  { value: 'spam', labelKey: 'reportSpam', icon: '📧', descKey: 'reportSpamDesc' },
  { value: 'fraud', labelKey: 'reportFraud', icon: '⚠️', descKey: 'reportFraudDesc' },
  { value: 'inappropriate', labelKey: 'reportInappropriate', icon: '🚫', descKey: 'reportInappropriateDesc' },
  { value: 'duplicate', labelKey: 'reportDuplicate', icon: '📋', descKey: 'reportDuplicateDesc' },
  { value: 'misleading', labelKey: 'reportMisleading', icon: '🔍', descKey: 'reportMisleadingDesc' },
  { value: 'other', labelKey: 'reportOther', icon: '📝', descKey: 'reportOtherDesc' },
] as const;

export default function ReportAdModal({ adId, adTitle, isOpen, onClose, lang }: ReportAdModalProps) {
  const { isAuthenticated } = useUserAuth();
  const t = useTranslations('ads');
  const pathname = usePathname();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const needsDetails = selectedReason === 'other';

  // While the dialog is open the page behind it must not scroll, so every
  // wheel / touch scroll goes to the dialog's own scroll container.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError(t('selectReportReason'));
      return;
    }

    if (!isAuthenticated) {
      setError(t('loginToReport'));
      return;
    }

    if (needsDetails && !details.trim()) {
      setError(t('detailsRequiredForOther'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          adId,
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
    // The dimmed overlay IS the scroll container (no separate fixed backdrop:
    // a fixed sibling would swallow wheel/touch scrolling). The whole dialog,
    // down to the submit button, is reachable by scrolling on any screen.
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="min-h-full flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col my-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🚩</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{t('reportAdTitle')}</h2>
                <p className="text-sm text-white/80 line-clamp-1">{adTitle}</p>
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
        <div className="p-6">
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
              <p className="text-gray-600 mb-4">{t('loginToReport')}</p>
              <a
                href={`/${lang}/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`}
                className="inline-block px-6 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
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
                  {t('whyReporting')} <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        selectedReason === reason.value
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{reason.icon}</span>
                      <div className="text-left flex-1">
                        <div className={`font-medium ${selectedReason === reason.value ? 'text-rose-700' : 'text-gray-900'}`}>
                          {t(reason.labelKey)}
                        </div>
                        <div className="text-xs text-gray-500">{t(reason.descKey)}</div>
                      </div>
                      {selectedReason === reason.value && (
                        <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {needsDetails ? t('additionalDetailsRequired') : t('additionalDetails')}
                  {needsDetails && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  // On phones the on-screen keyboard can cover the bottom of the
                  // modal; once it has opened, scroll so the field sits at the top
                  // of the modal and the submit button below it stays visible.
                  onFocus={(e) => {
                    const field = e.currentTarget;
                    setTimeout(() => field.scrollIntoView({ block: 'start', behavior: 'smooth' }), 300);
                  }}
                  placeholder={t('additionalDetailsPlaceholder')}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
                <div className="flex items-start justify-between gap-2 mt-1 text-xs">
                  <p className="text-gray-500">
                    {needsDetails && !details.trim() ? t('detailsRequiredForOther') : ''}
                  </p>
                  <span className="text-gray-400 shrink-0">{details.length}/500</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
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
                    <span>🚩</span>
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
    </div>
  );
}
