'use client';

import { StatusBadge } from '@/components/ui';
import type { VerificationStatusData, VerificationType } from './types';

interface VerificationStatusCardProps {
  type: VerificationType;
  data?: VerificationStatusData;
  phoneVerified: boolean;
  isSelected: boolean;
  showForm: boolean;
  onClick: () => void;
}

export function VerificationStatusCard({
  type,
  data,
  phoneVerified,
  isSelected,
  showForm,
  onClick,
}: VerificationStatusCardProps) {
  const isIndividual = type === 'individual';
  const status = data?.status || 'unverified';
  const canSelect = !data || ['unverified', 'rejected'].includes(status);

  const getIcon = () => {
    if (status === 'verified') return '✅';
    if (status === 'rejected') return '❌';
    if (status === 'pending') return '⏳';
    return isIndividual ? '👤' : '🏢';
  };

  const getCardClasses = () => {
    if (!phoneVerified) {
      return 'bg-gray-100 border-2 border-gray-300 opacity-75 cursor-not-allowed';
    }
    if (status === 'verified') {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300';
    }
    if (status === 'rejected') {
      return 'bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300';
    }
    if (status === 'pending') {
      return 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300';
    }
    return `bg-white border-2 border-gray-200 hover:border-${isIndividual ? 'indigo' : 'purple'}-300 hover:shadow-2xl cursor-pointer`;
  };

  const handleClick = () => {
    if (canSelect) {
      onClick();
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl transition-all duration-300 ${getCardClasses()}`}
      onClick={handleClick}
    >
      <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${
        isIndividual ? 'from-indigo-200/30 to-purple-200/30' : 'from-purple-200/30 to-pink-200/30'
      } rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-500`}></div>

      <div className="relative p-8 z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`text-5xl transform transition-transform group-hover:scale-110 ${
              status === 'verified' ? 'animate-bounce' : ''
            }`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {isIndividual ? 'Individual' : 'Business'} Verification
              </h3>
              <StatusBadge status={status} size="md" showIcon />
            </div>
          </div>
          {isSelected && !showForm && (
            <span className={`bg-${isIndividual ? 'indigo' : 'purple'}-500 text-white px-3 py-1 rounded-full text-sm font-medium`}>
              Selected
            </span>
          )}
        </div>

        {/* Expiry Warning */}
        {status === 'verified' && data?.isExpiringSoon && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4">
            <span className="text-amber-800 font-medium">
              Expires in {data.daysRemaining} days - Renew now!
            </span>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && data?.rejectionReason && (
          <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <div className="font-bold text-red-900">Rejected</div>
                <div className="text-red-800 text-sm">{data.rejectionReason}</div>
              </div>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-4">
          {isIndividual
            ? 'Verify your identity with a government-issued ID to build trust and unlock premium features.'
            : 'Verify your business with official documents to access premium features and build credibility.'}
        </p>

        {canSelect && (
          <div className={`font-medium flex items-center gap-2 ${!phoneVerified ? 'text-gray-400' : `text-${isIndividual ? 'indigo' : 'purple'}-600`}`}>
            <span>{!phoneVerified ? 'Verify phone first to continue' : 'Click to get verified'}</span>
            {phoneVerified && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        )}

        {status === 'pending' && (
          <div className="text-amber-700">Your verification is under review (24-48 hours)</div>
        )}

        {status === 'verified' && (
          <div className="text-green-700">
            Verified until {data?.expiresAt
              ? new Date(data.expiresAt).toLocaleDateString()
              : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}
