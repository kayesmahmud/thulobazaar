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
}

export type VerificationType = 'individual' | 'business';
