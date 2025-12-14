'use client';

import { REASON_LABELS } from './types';

export function getReasonBadge(reason: string) {
  const defaultReason = { label: 'Other', icon: '📝', color: 'gray' };
  const reasonInfo = REASON_LABELS[reason.toLowerCase()] ?? defaultReason;
  const colorClasses: Record<string, string> = {
    red: 'bg-red-100 text-red-800 border-red-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return {
    className: colorClasses[reasonInfo.color] || colorClasses.gray,
    label: reasonInfo.label,
    icon: reasonInfo.icon,
  };
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'resolved':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'restored':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'dismissed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-orange-100 text-orange-800 border-orange-200';
  }
}
