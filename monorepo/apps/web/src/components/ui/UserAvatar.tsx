'use client';

import { useState } from 'react';
import { getAvatarUrl } from '@/lib/images';

interface UserAvatarProps {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  borderColor?: 'default' | 'gold' | 'blue' | 'none';
  showBorder?: boolean;
}

/**
 * Centralized UserAvatar component for consistent avatar handling across the app.
 *
 * Features:
 * - Supports both local uploads (/uploads/avatars/...) and external URLs (Google, Facebook)
 * - Uses referrerPolicy="no-referrer" for external images (required for Google avatars)
 * - Fallback to initials when image fails to load or no avatar provided
 * - Consistent sizing and styling
 *
 * Usage:
 * <UserAvatar src={user.avatar} name={user.fullName} size="md" />
 * <UserAvatar src={shop.avatar} name={shop.name} size="xl" borderColor="gold" />
 */
export function UserAvatar({
  src,
  name,
  size = 'md',
  className = '',
  borderColor = 'default',
  showBorder = true,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get initials from name
  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName) return '?';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      const first = names[0]?.[0] ?? '';
      const last = names[names.length - 1]?.[0] ?? '';
      return `${first}${last}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Get the proper image URL using centralized utility
  const imageUrl = getAvatarUrl(src);

  // Size classes
  const sizeClasses: Record<string, { container: string; text: string }> = {
    xs: { container: 'w-6 h-6', text: 'text-[10px]' },
    sm: { container: 'w-8 h-8', text: 'text-xs' },
    md: { container: 'w-10 h-10', text: 'text-sm' },
    lg: { container: 'w-12 h-12', text: 'text-base' },
    xl: { container: 'w-16 h-16', text: 'text-lg' },
    '2xl': { container: 'w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]', text: 'text-3xl sm:text-4xl' },
  };

  // Border classes
  const borderClasses: Record<string, string> = {
    default: 'border-gray-200',
    gold: 'border-yellow-400',
    blue: 'border-blue-500',
    none: 'border-transparent',
  };

  const initials = getInitials(name);
  const defaultSize = { container: 'w-10 h-10', text: 'text-sm' };
  const sizeClass = sizeClasses[size] ?? defaultSize;
  const borderClass = showBorder ? `border-2 ${size === '2xl' ? 'border-4 sm:border-[5px]' : ''} ${borderClasses[borderColor] ?? ''}` : '';

  // Show fallback if no image or image failed to load
  if (!imageUrl || imageError) {
    return (
      <div
        className={`${sizeClass.container} rounded-full bg-rose-500 flex items-center justify-center ${borderClass} shadow-md ${className}`}
      >
        <span className={`${sizeClass.text} font-bold text-white`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass.container} rounded-full overflow-hidden ${borderClass} shadow-md ${className}`}>
      <img
        src={imageUrl}
        alt={name || 'User'}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => {
          console.error('Avatar load error:', src);
          setImageError(true);
        }}
      />
    </div>
  );
}

export default UserAvatar;
