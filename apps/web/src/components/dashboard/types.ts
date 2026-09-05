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
  /** AI moderation held this ad for manual review (owner-only surface) */
  aiHeld?: boolean;
  /** Whitelisted seller-facing hold category; null → generic message */
  aiSuggestedCategory?: string | null;
  aiReasonCode?: string | null;
  views: number;
  createdAt: string;
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
  openResubmitModal: (type: 'individual' | 'business') => void;
  closeResubmitModal: () => void;
  loadUserData: () => Promise<void>;
}
