/**
 * Dashboard Types
 * Shared types for web and mobile apps
 */

// ============================================
// Dashboard Ad Types (simplified for list view)
// ============================================

export interface DashboardAd {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: 'pending' | 'active' | 'sold' | 'rejected' | 'expired';
  views: number;
  created_at: string;
  images?: DashboardAdImage[];
}

export interface DashboardAdImage {
  id?: number;
  file_path?: string;
  filePath?: string;
  filename?: string;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStats {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalMessages: number;
}

export const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalAds: 0,
  activeAds: 0,
  totalViews: 0,
  totalMessages: 0,
};

// ============================================
// Verification Status Types
// ============================================

export interface BusinessVerificationRequest {
  id: number;
  status: string;
  businessName: string;
  createdAt: string;
  rejectionReason?: string;
}

export interface IndividualVerificationRequest {
  id: number;
  status: string;
  fullName: string;
  idDocumentType: string;
  createdAt: string;
  rejectionReason?: string;
}

export interface BusinessVerificationInfo {
  status: string;
  verified: boolean;
  businessName?: string | null;
  hasRequest?: boolean;
  request?: BusinessVerificationRequest;
}

export interface IndividualVerificationInfo {
  verified: boolean;
  fullName?: string | null;
  hasRequest?: boolean;
  request?: IndividualVerificationRequest;
}

export interface DashboardVerificationStatus {
  accountType: string;
  businessVerification: BusinessVerificationInfo;
  individualVerification: IndividualVerificationInfo;
}

// ============================================
// Dashboard Hook State Types
// ============================================

export interface UseDashboardState {
  ads: DashboardAd[];
  stats: DashboardStats;
  verificationStatus: DashboardVerificationStatus | null;
  loading: boolean;
  error: string | null;
}

export interface UseDashboardActions {
  loadData: () => Promise<void>;
  deleteAd: (adId: number) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export type UseDashboardReturn = UseDashboardState & UseDashboardActions;

// ============================================
// Dashboard API Response Types
// ============================================

export interface DashboardAdsResponse {
  success: boolean;
  data?: DashboardAd[];
  message?: string;
}

export interface DashboardVerificationResponse {
  success: boolean;
  data?: DashboardVerificationStatus;
  message?: string;
}

export interface DashboardUnreadCountResponse {
  success: boolean;
  data?: {
    unreadCount?: number;
    unread_messages?: number;
  };
  message?: string;
}

// ============================================
// Dashboard Tab Types
// ============================================

export type DashboardTab = 'active' | 'pending' | 'sold';

// ============================================
// Utility Functions
// ============================================

/**
 * Filter ads by status tab
 */
export function filterAdsByTab(ads: DashboardAd[], tab: DashboardTab): DashboardAd[] {
  return ads.filter(ad => ad.status === tab);
}

/**
 * Calculate dashboard stats from ads
 */
export function calculateStatsFromAds(ads: DashboardAd[], unreadMessages: number = 0): DashboardStats {
  const totalViews = ads.reduce((sum, ad) => sum + (ad.views || 0), 0);
  const activeAds = ads.filter(ad => ad.status === 'active').length;

  return {
    totalAds: ads.length,
    activeAds,
    totalViews,
    totalMessages: unreadMessages,
  };
}

/**
 * Get ad thumbnail URL
 */
export function getAdThumbnailUrl(ad: DashboardAd): string | null {
  const image = ad.images?.[0];
  if (!image) return null;

  const path = image.file_path || image.filePath || image.filename;
  return path ? `/${path}` : null;
}

/**
 * Check if user has any verification
 */
export function hasAnyVerification(status: DashboardVerificationStatus | null): boolean {
  if (!status) return false;
  return status.businessVerification.verified || status.individualVerification.verified;
}

/**
 * Check if verification was rejected
 */
export function isVerificationRejected(status: DashboardVerificationStatus | null): {
  business: boolean;
  individual: boolean;
} {
  return {
    business: status?.businessVerification?.request?.status === 'rejected',
    individual: status?.individualVerification?.request?.status === 'rejected',
  };
}
