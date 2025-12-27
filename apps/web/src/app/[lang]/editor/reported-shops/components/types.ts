export interface ReportedShop {
  reportId: number;
  shopId: number;
  reporterId: number;
  reason: string;
  description: string;
  status: string;
  adminNotes?: string;
  resolvedBy?: number;
  reportedAt: string;
  updatedAt: string;
  shopName: string;
  shopEmail: string;
  shopAvatar: string | null;
  shopSlug: string;
  shopIsActive: boolean;
  shopAccountType: string | null;
  shopVerificationStatus: string | null;
  shopIndividualVerified: boolean;
  reporterName: string;
  reporterEmail: string;
  reporterAvatar: string | null;
  resolverName?: string | null;
  resolverEmail?: string | null;
  resolverRole?: string | null;
}

export type TabStatus = 'pending' | 'resolved' | 'dismissed' | 'restored';

export const TABS: { id: TabStatus; label: string; icon: string; color: string }[] = [
  { id: 'pending', label: 'Pending Review', icon: '🏪', color: 'orange' },
  { id: 'resolved', label: 'Suspended Shops', icon: '🚫', color: 'red' },
  { id: 'restored', label: 'Restored', icon: '♻️', color: 'blue' },
  { id: 'dismissed', label: 'Dismissed', icon: '✅', color: 'gray' },
];

export const REASON_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  fraud: { label: 'Fraud/Scam', icon: '⚠️', color: 'red' },
  harassment: { label: 'Harassment', icon: '🚫', color: 'purple' },
  fake_products: { label: 'Fake Products', icon: '📦', color: 'orange' },
  poor_service: { label: 'Poor Service', icon: '👎', color: 'yellow' },
  impersonation: { label: 'Impersonation', icon: '🎭', color: 'blue' },
  other: { label: 'Other', icon: '📝', color: 'gray' },
};

export interface TabCounts {
  pending: number;
  resolved: number;
  dismissed: number;
  restored: number;
}
