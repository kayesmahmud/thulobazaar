'use client';

import { formatDurationLabel } from '@/lib/verificationUtils';

export type VerificationType = 'individual' | 'business';

interface OrderSummaryProps {
  type: VerificationType;
  durationDays: number;
  price: number;
  displayName: string; // Full name for individual, business name for business
}

export default function OrderSummary({
  type,
  durationDays,
  price,
  displayName,
}: OrderSummaryProps) {
  const priceColor = type === 'individual' ? 'text-indigo-600' : 'text-rose-600';
  const nameLabel = type === 'individual' ? 'Name:' : 'Business Name:';

  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        Order Summary
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Verification Plan:</span>
          <span className="font-medium">{formatDurationLabel(durationDays)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">{nameLabel}</span>
          <span className="font-medium truncate max-w-[180px]">{displayName}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-800 font-semibold">Total Amount:</span>
          <span className={`text-lg font-bold ${priceColor}`}>
            NPR {price.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
