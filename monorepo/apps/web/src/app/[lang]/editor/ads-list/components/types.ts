export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  statusReason?: string;
  slug: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  deletedAt?: string;
  categoryId: number;
  locationId: number;
  categoryName?: string;
  locationName?: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    accountType: string;
    businessVerified: boolean;
    individualVerified: boolean;
  };
  primaryImage?: string;
}

export type TabStatus = 'all' | 'approved' | 'pending' | 'suspended' | 'rejected' | 'deleted';

export interface SuspendModalData {
  ad: Ad;
  reason: string;
}

export interface DeleteModalData {
  ad: Ad;
  reason: string;
}

export function getStatusBadge(status: string, deletedAt?: string): string {
  if (deletedAt) {
    return 'bg-black text-white border-black';
  }
  const badges: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    deleted: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getStatusLabel(ad: Ad): string {
  if (ad.deletedAt) return '🗑️ DELETED';
  if (ad.status === 'suspended') return '⏸️ SUSPENDED';
  if (ad.status === 'approved') return '✅ APPROVED';
  if (ad.status === 'pending') return '⏳ PENDING';
  if (ad.status === 'rejected') return '❌ REJECTED';
  return ad.status.toUpperCase();
}
