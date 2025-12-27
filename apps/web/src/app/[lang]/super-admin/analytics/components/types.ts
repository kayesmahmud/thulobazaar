export interface AnalyticsData {
  period: {
    type: 'days' | 'month' | 'year';
    label: string;
    startDate: string;
    endDate: string;
  };
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    userGrowth: number;
    totalAds: number;
    activeAds: number;
    newAds: number;
    adGrowth: number;
    totalViews: number;
    periodViews: number;
    totalRevenue: number;
    revenueGrowth: number;
  };
  verifications: {
    pendingBusiness: number;
    pendingIndividual: number;
    approvedBusiness: number;
    approvedIndividual: number;
    newBusinessRequests: number;
    newIndividualRequests: number;
    approvedBusinessInPeriod: number;
    approvedIndividualInPeriod: number;
  };
  charts: {
    labels: string[];
    users: number[];
    ads: number[];
    revenue: number[];
  };
  usersByType: { type: string; count: number }[];
  adsByStatus: { status: string; count: number }[];
  topCategories: { id: number; name: string; adCount: number; views: number }[];
  topLocations: { id: number; name: string; adCount: number }[];
  revenueByType: { type: string; amount: number; count: number }[];
  summary: {
    totalNewUsers: number;
    totalNewAds: number;
    totalRevenue: number;
    totalTransactions: number;
    verificationsProcessed: number;
    avgRevenuePerDay: number;
    avgAdsPerDay: number;
    avgUsersPerDay: number;
  };
}

export type TimeRange = '7d' | '30d' | '90d';
export type PeriodMode = 'quick' | 'monthly' | 'yearly';

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500',
  active: 'bg-green-500',
  pending: 'bg-yellow-500',
  rejected: 'bg-red-500',
  suspended: 'bg-orange-500',
  deleted: 'bg-gray-500',
};

export const CATEGORY_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
];

// Utility functions
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

export function formatCurrency(amount: number): string {
  return 'Rs. ' + amount.toLocaleString();
}

export function getGrowthColor(growth: number): string {
  if (growth > 0) return 'text-green-600';
  if (growth < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function getGrowthIcon(growth: number): string {
  if (growth > 0) return '↑';
  if (growth < 0) return '↓';
  return '→';
}
