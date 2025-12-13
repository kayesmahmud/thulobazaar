export interface Editor {
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
  };
}

export type StatusFilter = 'all' | 'active' | 'suspended';

export function transformBackendEditor(editor: any): Editor {
  return {
    id: editor.id,
    fullName: editor.full_name || editor.email,
    email: editor.email,
    avatar: editor.avatar,
    status: editor.is_active ? 'active' : 'suspended',
    createdAt: editor.created_at,
    lastLogin: editor.last_login || null,
    stats: {
      adsApproved: 0,
      adsRejected: 0,
      adsEdited: 0,
      adsDeleted: 0,
      businessApproved: 0,
      businessRejected: 0,
      individualApproved: 0,
      individualRejected: 0,
    },
  };
}

export function formatLastLogin(lastLogin: string | null): string {
  if (!lastLogin) return 'Never';
  return new Date(lastLogin).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
