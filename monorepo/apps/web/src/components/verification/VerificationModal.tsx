'use client';

import { ReactNode } from 'react';
import { formatDurationLabel } from '@/lib/verificationUtils';
import StepIndicator, { Step } from './StepIndicator';

export type VerificationType = 'individual' | 'business';

interface VerificationModalProps {
  type: VerificationType;
  durationDays: number;
  step: Step;
  isFreeVerification: boolean;
  onClose: () => void;
  children: ReactNode;
}

const themeConfig = {
  individual: {
    gradient: 'from-blue-500 to-indigo-600',
    stepTheme: 'blue' as const,
    formTitle: 'Individual Seller Verification',
    paymentTitle: 'Complete Payment',
  },
  business: {
    gradient: 'from-rose-500 to-pink-600',
    stepTheme: 'rose' as const,
    formTitle: 'Business Verification',
    paymentTitle: 'Complete Payment',
  },
};

export default function VerificationModal({
  type,
  durationDays,
  step,
  isFreeVerification,
  onClose,
  children,
}: VerificationModalProps) {
  const theme = themeConfig[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto relative">
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r ${theme.gradient} text-white p-4 sm:p-6 rounded-t-xl z-10`}>
          <div className="flex justify-between items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 'form' ? theme.formTitle : theme.paymentTitle}
              </h2>
              <p className="text-sm opacity-90 mt-1">
                {formatDurationLabel(durationDays)} Plan
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-2 flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator (only for paid verifications) */}
          {!isFreeVerification && (
            <StepIndicator currentStep={step} theme={theme.stepTheme} />
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
