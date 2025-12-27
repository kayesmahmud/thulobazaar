/**
 * Dashboard Types
 */

export interface Ad {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  actualStatus?: string;
  isApproved?: boolean;
  statusReason?: string;
  views: number;
  created_at: string;
  images?: Array<{
    file_path?: string;
    filePath?: string;
    filename?: string;
  }>;
}

export interface DashboardStats {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalMessages: number;
}

export interface VerificationRequest {
  id: number;
  status: string;
  businessName?: string;
  fullName?: string;
  idDocumentType?: string;
  createdAt: string;
  rejectionReason?: string;
  durationDays?: number;
}

export interface VerificationStatus {
  accountType: string;
  businessVerification: {
    status: string;
    verified: boolean;
    businessName?: string | null;
    hasRequest?: boolean;
    request?: VerificationRequest;
  };
  individualVerification: {
    verified: boolean;
    fullName?: string | null;
    hasRequest?: boolean;
    request?: VerificationRequest;
  };
}

export type AdTab = 'active' | 'pending' | 'rejected' | 'sold';

export interface DashboardState {
  activeTab: AdTab;
  userAds: Ad[];
  loading: boolean;
  error: string;
  stats: DashboardStats;
  verificationStatus: VerificationStatus | null;
  showResubmitModal: boolean;
  resubmitType: 'individual' | 'business' | null;
}

export interface DashboardActions {
  setActiveTab: (tab: AdTab) => void;
  handleDeleteAd: (adId: number) => Promise<void>;
  handleMarkAsSold: (adId: number) => Promise<void>;
  openResubmitModal: (type: 'individual' | 'business') => void;
  closeResubmitModal: () => void;
  loadUserData: () => Promise<void>;
}
