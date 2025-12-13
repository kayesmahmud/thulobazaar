export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  account_type: string;
  business_name: string | null;
  business_verification_status: string;
  individual_verified: boolean;
  created_at: string;
  avatar: string | null;
  location_name: string | null;
  suspended_by_name: string | null;
  ad_count: number;
  shop_slug: string | null;
}

export type StatusFilter = 'all' | 'active' | 'suspended';

export const getUserBadge = (user: User): string => {
  if (user.is_suspended) return 'bg-red-100 text-red-800 border-red-200';
  if (user.business_verification_status === 'approved') return 'bg-blue-100 text-blue-800 border-blue-200';
  if (user.individual_verified) return 'bg-purple-100 text-purple-800 border-purple-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getUserStatusLabel = (user: User): string => {
  if (user.is_suspended) return '🚫 Suspended';
  if (user.business_verification_status === 'approved') return '🏢 Business';
  if (user.individual_verified) return '✓ Individual';
  return '👤 Regular';
};

export const getUserStats = (users: User[]) => ({
  total: users.length,
  active: users.filter(u => !u.is_suspended).length,
  suspended: users.filter(u => u.is_suspended).length,
  verified: users.filter(u => u.business_verification_status === 'approved' || u.individual_verified).length,
});
