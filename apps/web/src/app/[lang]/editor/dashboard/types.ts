export interface DashboardStats {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  rejectedAds: number;
  pendingVerifications: number;
  avgResponseTime?: string;
  pendingChange?: string;
  verificationsChange?: string;
}

export interface MyWorkToday {
  adsApprovedToday: number;
  adsRejectedToday: number;
  adsEditedToday: number;
  businessVerificationsToday: number;
  individualVerificationsToday: number;
  supportTicketsAssigned: number;
}

export interface BadgeCounts {
  pendingAds: number;
  reportedAds: number;
  businessVerifications: number;
  individualVerifications: number;
  supportChat: number;
}

export interface SystemAlert {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface QuickActionConfig {
  icon: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
  badge: number;
  onClick: () => void;
}

export const DEFAULT_STATS: DashboardStats = {
  totalAds: 0,
  pendingAds: 0,
  activeAds: 0,
  rejectedAds: 0,
  pendingVerifications: 0,
  avgResponseTime: 'N/A',
  pendingChange: '0%',
  verificationsChange: '0%',
};

export const DEFAULT_MY_WORK: MyWorkToday = {
  adsApprovedToday: 0,
  adsRejectedToday: 0,
  adsEditedToday: 0,
  businessVerificationsToday: 0,
  individualVerificationsToday: 0,
  supportTicketsAssigned: 0,
};

export const DEFAULT_BADGE_COUNTS: BadgeCounts = {
  pendingAds: 0,
  reportedAds: 0,
  businessVerifications: 0,
  individualVerifications: 0,
  supportChat: 0,
};
