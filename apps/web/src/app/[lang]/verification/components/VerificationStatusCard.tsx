'use client';

import { StatusBadge } from '@/components/ui';
import {
  User,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
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

  const getIconGradient = () => {
    if (status === 'verified') return 'from-green-400 to-emerald-500';
    if (status === 'rejected') return 'from-red-400 to-rose-500';
    if (status === 'pending') return 'from-amber-400 to-yellow-500';
    // Match avatar badge colors: blue-500 for individual, yellow-400 for business
    return isIndividual
      ? 'from-blue-400 to-blue-600'
      : 'from-yellow-300 to-yellow-500';
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 sm:w-8 sm:h-8 text-white";
    if (status === 'verified') return <CheckCircle2 className={iconClass} />;
    if (status === 'rejected') return <XCircle className={iconClass} />;
    if (status === 'pending') return <Clock className={iconClass} />;
    return isIndividual
      ? <User className={iconClass} />
      : <Building2 className={iconClass} />;
  };

  const getCardClasses = () => {
    if (!phoneVerified) {
      return 'bg-gray-50 opacity-75 cursor-not-allowed';
    }

    // Type-specific background colors (matching avatar border colors: blue-500 for individual, yellow-400 for business)
    const typeBgColor = isIndividual ? 'bg-blue-100' : 'bg-yellow-100';

    // Base classes matching BenefitsGrid
    const baseClasses = `${typeBgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl transition-all duration-300`;

    if (status === 'verified') {
      return `${baseClasses} border-4 border-green-100 hover:border-green-200`;
    }
    if (status === 'rejected') {
      return `${baseClasses} border-4 border-red-100 hover:border-red-200`;
    }
    if (status === 'pending') {
      return `${baseClasses} border-4 border-amber-100 hover:border-amber-200`;
    }

    // Selectable state (matching avatar badge colors: blue-500 for individual, yellow-400 for business)
    const activeBorder = isIndividual ? 'hover:border-blue-500' : 'hover:border-yellow-400';
    return `${baseClasses} hover:shadow-2xl hover:-translate-y-1 cursor-pointer border-4 border-transparent ${activeBorder}`;
  };

  const handleClick = () => {
    if (canSelect) {
      onClick();
    }
  };

  return (
    <div
      className={`group relative overflow-hidden ${getCardClasses()} ${isSelected && !showForm ? (isIndividual ? 'ring-2 sm:ring-4 ring-blue-500' : 'ring-2 sm:ring-4 ring-yellow-400') : ''}`}
      onClick={handleClick}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${getIconGradient()} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {getIcon()}
          </div>
          {isSelected && !showForm && (
            <span className={`${isIndividual ? 'bg-blue-500' : 'bg-yellow-400'} text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-md animate-fade-in`}>
              Selected
            </span>
          )}
        </div>

        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <h3 className="text-base sm:text-xl font-bold text-gray-900">
              {isIndividual ? 'Individual' : 'Business'}
            </h3>
            <StatusBadge status={status} size="sm" showIcon />
          </div>

          <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
            {isIndividual
              ? 'Verify identity with government ID for trust & features.'
              : 'Verify business with official docs for premium access.'}
          </p>
        </div>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50">
          {/* Expiry Warning */}
          {status === 'verified' && data?.isExpiringSoon && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" />
              <span className="text-amber-800 text-[10px] sm:text-xs font-medium">
                Expires in {data.daysRemaining} days
              </span>
            </div>
          )}

          {/* Rejection Reason */}
          {status === 'rejected' && data?.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold text-red-900 text-[10px] sm:text-xs">Rejected</div>
                  <div className="text-red-700 text-[10px] sm:text-xs">{data.rejectionReason}</div>
                </div>
              </div>
            </div>
          )}

          {canSelect && (
            <div className={`flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors ${!phoneVerified ? 'text-gray-400' : isIndividual ? 'text-blue-600 group-hover:text-blue-700' : 'text-yellow-600 group-hover:text-yellow-700'
              }`}>
              <span>
                {!phoneVerified
                  ? 'Verify phone first'
                  : status === 'rejected'
                    ? 'Resubmit (Free)'
                    : 'Start Verification'}
              </span>
              {phoneVerified && (
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
              )}
            </div>
          )}

          {status === 'pending' && (
            <div className="flex items-center gap-2 text-amber-600 text-xs sm:text-sm font-medium">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Under review</span>
            </div>
          )}

          {status === 'verified' && (
            <div className="flex items-center gap-2 text-green-600 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>
                Valid until {data?.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
