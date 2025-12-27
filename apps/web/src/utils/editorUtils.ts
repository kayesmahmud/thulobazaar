interface Ad {
  id: number;
  status: string;
  deletedAt?: string | null;
}

export function getStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    deleted: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getAvailableActions(ad: Ad): string[] {
  // Deleted ads can only be restored or permanently deleted
  if (ad.deletedAt) {
    return ['restore', 'permanentDelete'];
  }

  // Active ads - actions based on status
  switch (ad.status) {
    case 'pending':
      return ['approve', 'reject', 'suspend', 'delete', 'permanentDelete'];
    case 'approved':
      return ['reject', 'suspend', 'delete', 'permanentDelete'];
    case 'rejected':
      return ['approve', 'delete', 'permanentDelete'];
    case 'suspended':
      return ['approve', 'unsuspend', 'delete', 'permanentDelete'];
    default:
      return [];
  }
}
