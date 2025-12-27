export interface ReportedAd {
  reportId: number;
  adId: number;
  adSlug: string;
  adTitle: string;
  adDescription: string;
  price: number;
  adStatus: string;
  reason: string;
  description: string;
  status: string;
  reportedAt: string;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  sellerName: string;
  sellerEmail: string;
  adminNotes?: string;
}

export type TabStatus = 'pending' | 'resolved' | 'dismissed' | 'restored';

export interface TabConfig {
  id: TabStatus;
  label: string;
  icon: string;
  color: string;
}

export const TABS: TabConfig[] = [
  { id: 'pending', label: 'Pending Review', icon: '🚩', color: 'red' },
  { id: 'resolved', label: 'Deleted Ads', icon: '🗑️', color: 'green' },
  { id: 'restored', label: 'Restored', icon: '♻️', color: 'blue' },
  { id: 'dismissed', label: 'Dismissed', icon: '✅', color: 'gray' },
];

export interface TabCounts {
  pending: number;
  resolved: number;
  dismissed: number;
  restored: number;
}
