export interface EditorActivity {
  id: number;
  type: 'login' | 'logout' | 'ad_approved' | 'ad_rejected' | 'ad_edited' | 'ad_deleted' | 'business_approved' | 'business_rejected' | 'individual_approved' | 'individual_rejected';
  timestamp: string;
  details?: string;
  relatedId?: number;
}

export interface AdWork {
  id: number;
  adTitle: string;
  action: 'approved' | 'rejected' | 'edited' | 'deleted';
  timestamp: string;
  reason?: string;
}

export interface VerificationWork {
  id: number;
  sellerName: string;
  action: 'approved' | 'rejected';
  timestamp: string;
  reason?: string;
}

export interface EditorDetail {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin: string | null;
  stats: {
    adsApproved: number;
    adsRejected: number;
    adsEdited: number;
    adsDeleted: number;
    businessApproved: number;
    businessRejected: number;
    individualApproved: number;
    individualRejected: number;
    supportTickets: number;
  };
  activities: EditorActivity[];
  adWork: AdWork[];
  businessVerifications: VerificationWork[];
  individualVerifications: VerificationWork[];
  timeBuckets?: {
    daily: { ads: number; business: number; individual: number; supportTickets: number };
    weekly: { ads: number; business: number; individual: number; supportTickets: number };
    monthly: { ads: number; business: number; individual: number; supportTickets: number };
  };
  monthLabel?: string;
}

export type ActiveTab = 'activity' | 'ads' | 'business' | 'individual';

export function getActivityIcon(type: EditorActivity['type']): string {
  const icons: Record<EditorActivity['type'], string> = {
    login: '🔓',
    logout: '🔒',
    ad_approved: '✅',
    ad_rejected: '❌',
    ad_edited: '✏️',
    ad_deleted: '🗑️',
    business_approved: '✓',
    business_rejected: '✗',
    individual_approved: '✓',
    individual_rejected: '✗',
  };
  return icons[type];
}

export function getActivityColor(type: EditorActivity['type']): string {
  if (type.includes('approved')) return 'text-emerald-600 bg-emerald-50';
  if (type.includes('rejected') || type.includes('deleted')) return 'text-rose-600 bg-rose-50';
  if (type.includes('edited')) return 'text-amber-600 bg-amber-50';
  if (type === 'login') return 'text-blue-600 bg-blue-50';
  if (type === 'logout') return 'text-gray-600 bg-gray-50';
  return 'text-gray-600 bg-gray-50';
}

export function getActivityLabel(activity: EditorActivity): string {
  const labels: Record<EditorActivity['type'], string> = {
    login: 'Logged In',
    logout: 'Logged Out',
    ad_approved: 'Ad Approved',
    ad_rejected: 'Ad Rejected',
    ad_edited: 'Ad Edited',
    ad_deleted: 'Ad Deleted',
    business_approved: 'Business Approved',
    business_rejected: 'Business Rejected',
    individual_approved: 'Individual Approved',
    individual_rejected: 'Individual Rejected',
  };
  return labels[activity.type];
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
