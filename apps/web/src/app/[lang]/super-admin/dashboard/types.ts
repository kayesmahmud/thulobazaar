export interface DashboardStats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  adsThisWeek: number;
  usersThisWeek: number;
}

export interface DashboardUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  businessVerificationStatus: string | null;
  individualVerified: boolean;
}

export type ChartRange = '7d' | '30d' | '90d';

export interface QuickAction {
  icon: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'gray';
  badge?: number;
  onClick: () => void;
}

export const getStatusLabel = (user: DashboardUser): string => {
  if (user.businessVerificationStatus && ['approved', 'verified'].includes(user.businessVerificationStatus)) {
    return 'Business Verified';
  }
  if (user.individualVerified) {
    return 'Individual Verified';
  }
  return 'Regular';
};

export const exportColumn = (
  users: DashboardUser[],
  field: 'email' | 'phone'
): void => {
  const uniqueValues = Array.from(
    new Set(
      users
        .map((u) => (u[field] || '').trim())
        .filter((v) => v)
    )
  );

  const header = field === 'email' ? 'email' : 'phone';
  const csv = [header, ...uniqueValues].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${field}-list.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
