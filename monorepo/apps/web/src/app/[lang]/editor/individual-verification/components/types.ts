export interface IndividualVerification {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  verifiedSellerName?: string;
  phone?: string;
  location?: string;
  status: string;
  submittedAt: string;
  type: string;
  shopSlug?: string;
  durationDays?: number;
  paymentAmount?: number;
  paymentReference?: string;
  paymentStatus?: string;
  idDocumentType?: string;
  idDocumentNumber?: string;
  idDocumentFront?: string;
  idDocumentBack?: string;
  selfieWithId?: string;
  rejectionReason?: string;
}

export type TabStatus = 'pending' | 'rejected' | 'approved';
