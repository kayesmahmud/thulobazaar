export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  images?: string[];
  sellerName?: string;
  sellerPhone?: string;
  condition?: string;
  statusReason?: string;
  suspendedUntil?: string | null;
  slug?: string;
}

export type TabStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deleted' | 'all';

export const TAB_LIST: TabStatus[] = ['pending', 'approved', 'rejected', 'suspended', 'deleted', 'all'];

// Transform API response (snake_case) to component format (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformAd(ad: any): Ad {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: ad.category_name || ad.category || '',
    location: ad.location_name || ad.location || '',
    status: ad.status,
    createdAt: ad.created_at || ad.createdAt,
    updatedAt: ad.updated_at || ad.updatedAt,
    deletedAt: ad.deleted_at || ad.deletedAt,
    images: ad.images || [],
    sellerName: ad.seller_name || ad.sellerName,
    sellerPhone: ad.seller_phone || ad.sellerPhone,
    condition: ad.condition,
    statusReason: ad.status_reason || ad.statusReason,
    suspendedUntil: ad.suspended_until || ad.suspendedUntil,
    slug: ad.slug,
  };
}
