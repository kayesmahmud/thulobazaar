export interface BusinessVerification {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  businessName: string;
  businessLicense?: string;
  businessCategory?: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessPhone?: string;
  businessAddress?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentStatus?: string;
  durationDays?: number;
  status: string;
  submittedAt: string;
  type: string;
  shopSlug?: string;
  rejectionReason?: string;
}

export type TabStatus = 'pending' | 'rejected' | 'approved';
