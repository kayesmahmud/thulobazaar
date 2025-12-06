'use client';

import { formatDurationLabel } from '@/lib/verificationUtils';

export type VerificationType = 'individual' | 'business';

interface PlanSummaryProps {
  type: VerificationType;
  durationDays: number;
  price: number;
  isFreeVerification: boolean;
  isResubmission?: boolean;
}

export default function PlanSummary({
  type,
  durationDays,
  price,
  isFreeVerification,
  isResubmission = false,
}: PlanSummaryProps) {
  const isIndividual = type === 'individual';

  // Determine styling based on state
  const getContainerStyle = () => {
    if (isResubmission) {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200';
    }
    if (isFreeVerification) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200';
    }
    return isIndividual
      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200'
      : 'bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-200';
  };

  const getPriceColor = () => {
    if (isResubmission) return 'text-blue-600';
    if (isFreeVerification) return 'text-green-600';
    return isIndividual ? 'text-indigo-600' : 'text-rose-600';
  };

  const getIcon = () => {
    if (isResubmission) return '🔄';
    if (isFreeVerification) return '🎁';
    return isIndividual ? '✓' : '🏢';
  };

  const getTitle = () => {
    const prefix = isResubmission ? 'Resubmit ' : '';
    const suffix = isIndividual ? ' Verification' : ' Business Verification';
    return `${prefix}${formatDurationLabel(durationDays)}${suffix}`;
  };

  const getSubtitle = () => {
    if (isResubmission) {
      return 'Your previous application was rejected - No additional payment required';
    }
    if (isFreeVerification) {
      return 'Free promotional offer for new users';
    }
    return isIndividual ? 'Get verified seller badge' : 'Get verified business badge';
  };

  const getPriceText = () => {
    if (isResubmission) return 'NO CHARGE';
    if (isFreeVerification) return 'FREE';
    return `NPR ${price.toLocaleString()}`;
  };

  return (
    <div className={`rounded-lg p-4 mb-6 ${getContainerStyle()}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getIcon()}</span>
          <div>
            <div className="font-bold text-gray-900">{getTitle()}</div>
            <div className="text-sm text-gray-600">{getSubtitle()}</div>
          </div>
        </div>
        <div className={`text-xl sm:text-2xl font-bold ${getPriceColor()}`}>
          {getPriceText()}
        </div>
      </div>

      {isResubmission && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Please fix the issues from your previous application and resubmit with correct documents
          </p>
        </div>
      )}
    </div>
  );
}
