export interface VerificationRequest {
  id: number;
  status: string;
  rejectionReason?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  durationDays?: number;
  canResubmitFree?: boolean;
}

export interface VerificationStatusData {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  request?: VerificationRequest;
}

export interface VerificationStatus {
  business?: VerificationStatusData;
  individual?: VerificationStatusData;
}

export interface PricingOption {
  id: number;
  durationDays: number;
  durationLabel: string;
  price: number;
  discountPercentage: number;
  finalPrice: number;
  hasCampaignDiscount?: boolean;
}

export interface VerificationCampaign {
  id: number;
  name: string;
  description: string | null;
  discountPercentage: number;
  bannerText: string;
  bannerEmoji: string | null;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  appliesToTypes: string[];
  minDurationDays: number | null;
}

export interface VerificationPricing {
  individual: PricingOption[];
  business: PricingOption[];
  freeVerification: {
    enabled: boolean;
    durationDays: number;
    types: string[];
    isEligible: boolean;
  };
  campaign: VerificationCampaign | null;
}

export type VerificationType = 'individual' | 'business';
