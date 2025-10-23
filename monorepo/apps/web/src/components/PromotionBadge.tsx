'use client';

interface PromotionBadgeProps {
  ad: {
    isFeatured?: boolean;
    featuredUntil?: string | Date | null;
    isUrgent?: boolean;
    urgentUntil?: string | Date | null;
    isSticky?: boolean;
    stickyUntil?: string | Date | null;
  };
  size?: 'small' | 'medium' | 'large';
  iconOnly?: boolean;
}

export default function PromotionBadge({ ad, size = 'medium', iconOnly = false }: PromotionBadgeProps) {
  const now = new Date();

  // Check if featured and not expired
  const isFeaturedActive = ad.isFeatured && ad.featuredUntil && new Date(ad.featuredUntil) > now;

  // Check if urgent and not expired
  const isUrgentActive = ad.isUrgent && ad.urgentUntil && new Date(ad.urgentUntil) > now;

  // Check if sticky and not expired
  const isStickyActive = ad.isSticky && ad.stickyUntil && new Date(ad.stickyUntil) > now;

  // Size classes
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const baseClass = `inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`;

  if (isFeaturedActive) {
    return (
      <span className={`${baseClass} bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg`}>
        <span className="text-base">⭐</span>
        {!iconOnly && 'FEATURED'}
      </span>
    );
  }

  if (isUrgentActive) {
    return (
      <span className={`${baseClass} bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg animate-pulse`}>
        <span className="text-base">🔥</span>
        {!iconOnly && 'URGENT'}
      </span>
    );
  }

  if (isStickyActive) {
    return (
      <span className={`${baseClass} bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md`}>
        <span className="text-base">📌</span>
        {!iconOnly && 'PROMOTED'}
      </span>
    );
  }

  return null;
}
