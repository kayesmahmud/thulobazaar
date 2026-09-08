import { isStaffRole } from '@/lib/staffRoles';

export interface AdPageViewer {
  id?: string | number | null;
  role?: string | null;
}

/**
 * Who may see an ad that is not `approved`.
 *
 * The seller, so their own ad doesn't disappear on them while an edit waits for
 * review, and staff, because the editor panel's "View Details" opens this very
 * page — an editor has to read the real ad to approve or reject it. Everyone
 * else gets AdHiddenNotice, matching the API's AD_PENDING / AD_UNAVAILABLE 404.
 *
 * The role comes from the signed NextAuth session, which copies it from the
 * users.role column at login, so it cannot be set by user input.
 */
export function canViewNonPublicAd(
  viewer: AdPageViewer | null | undefined,
  ad: { user_id: number | null }
): boolean {
  const viewerId = viewer?.id == null ? NaN : Number(viewer.id);
  const isOwner = Number.isFinite(viewerId) && viewerId === ad.user_id;
  return isOwner || isStaffRole(viewer?.role);
}
