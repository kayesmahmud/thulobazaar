import React from 'react';

export type BadgeStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'verified'
  | 'unverified'
  | 'sold'
  | 'available'
  | string;

export type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: BadgeSize;
  showIcon?: boolean;
  customLabel?: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  active: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: '✓'
  },
  inactive: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: '○'
  },
  pending: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: '⏳'
  },
  approved: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: '✓'
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: '✕'
  },
  verified: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: '✓'
  },
  unverified: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: '○'
  },
  sold: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: '✓'
  },
  available: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: '✓'
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({
  status,
  size = 'md',
  showIcon = false,
  customLabel,
  className = ''
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const config = statusConfig[normalizedStatus] || statusConfig.unverified || { bg: 'bg-gray-100', text: 'text-gray-600', icon: '' };

  const label = customLabel || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`${config?.bg || ''} ${config?.text || ''} ${sizeClasses[size]} rounded font-medium inline-flex items-center gap-1 ${className}`}
    >
      {showIcon && config?.icon && <span>{config.icon}</span>}
      {label}
    </span>
  );
}
