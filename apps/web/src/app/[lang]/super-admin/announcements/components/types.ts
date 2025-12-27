export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetAudience: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  createdByName: string;
  stats: {
    totalAudience: number;
    readCount: number;
    readRate: number;
  };
}

export interface AnnouncementDetail extends Announcement {
  stats: {
    totalAudience: number;
    readCount: number;
    readRate: number;
    unreadCount: number;
  };
  timeline: Array<{ date: string; count: number }>;
}

export interface CreateFormData {
  title: string;
  content: string;
  targetAudience: string;
  expiresAt: string;
}

export const AUDIENCE_LABELS: Record<string, string> = {
  all_users: 'All Users',
  new_users: 'New Users (1-3 months)',
  business_verified: 'Business Verified',
  individual_verified: 'Individual Verified',
};

export const AUDIENCE_COLORS: Record<string, string> = {
  all_users: 'bg-blue-100 text-blue-800',
  new_users: 'bg-green-100 text-green-800',
  business_verified: 'bg-purple-100 text-purple-800',
  individual_verified: 'bg-orange-100 text-orange-800',
};

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
