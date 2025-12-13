export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: number | null;
  deletion_reason: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  category_name: string;
  location_name: string;
  seller_name: string;
  seller_email: string;
  reviewer_name: string | null;
  deleted_by_name: string | null;
}

export const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-rose-100 text-rose-700';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
