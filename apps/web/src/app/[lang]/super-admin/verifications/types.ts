export type TabType = 'pending' | 'verified-business' | 'verified-individual' | 'suspended-rejected';

export interface Verification {
  id: number;
  type: 'business' | 'individual';
  user_id: number;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
  // Business specific
  business_name?: string;
  business_category?: string;
  business_license_document?: string;
  // Individual specific
  id_document_type?: string;
  id_document_front?: string;
  shop_slug?: string;
}

export interface SuspendedUser {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  businessVerificationStatus: string | null;
  createdAt: string;
  shopSlug: string | null;
  adCount: number;
}

export interface VerificationStats {
  pending: number;
  verifiedBusiness: number;
  verifiedIndividual: number;
  suspendedRejected: number;
}

export interface TabConfig {
  id: TabType;
  label: string;
  count: number;
  icon: string;
  color: string;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function filterBySearch(items: Verification[], searchQuery: string): Verification[] {
  if (!searchQuery) return items;
  const query = searchQuery.toLowerCase();
  return items.filter((v) =>
    v.business_name?.toLowerCase().includes(query) ||
    v.full_name?.toLowerCase().includes(query) ||
    v.email?.toLowerCase().includes(query)
  );
}

export function filterSuspendedBySearch(items: SuspendedUser[], searchQuery: string): SuspendedUser[] {
  if (!searchQuery) return items;
  const query = searchQuery.toLowerCase();
  return items.filter((u) =>
    u.fullName?.toLowerCase().includes(query) ||
    u.email?.toLowerCase().includes(query)
  );
}
