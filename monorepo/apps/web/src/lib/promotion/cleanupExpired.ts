/**
 * PROMOTION CLEANUP UTILITY
 * =========================
 * Cleans up expired promotion flags before querying ads
 * This ensures sorting is accurate even if the backend cron hasn't run yet
 */

import { prisma } from '@thulobazaar/database';

/**
 * Clean up expired promotion flags on ads
 * Call this before any query that sorts by promotion flags
 */
export async function cleanupExpiredPromotionFlags(): Promise<void> {
  const now = new Date();

  try {
    // Run all cleanups in parallel for efficiency
    await Promise.all([
      // Clear expired featured flags
      prisma.ads.updateMany({
        where: {
          is_featured: true,
          featured_until: { lt: now },
        },
        data: {
          is_featured: false,
          featured_until: null,
        },
      }),

      // Clear expired urgent flags
      prisma.ads.updateMany({
        where: {
          is_urgent: true,
          urgent_until: { lt: now },
        },
        data: {
          is_urgent: false,
          urgent_until: null,
        },
      }),

      // Clear expired sticky flags
      prisma.ads.updateMany({
        where: {
          is_sticky: true,
          sticky_until: { lt: now },
        },
        data: {
          is_sticky: false,
          sticky_until: null,
          is_bumped: false,
          bump_expires_at: null,
        },
      }),
    ]);
  } catch (error) {
    // Log but don't fail the request - this is a best-effort cleanup
    console.error('[Promotion Cleanup] Failed to cleanup expired flags:', error);
  }
}
