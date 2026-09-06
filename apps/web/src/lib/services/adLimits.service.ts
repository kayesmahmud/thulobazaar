/**
 * Ad Limits Service for Next.js API Routes
 * Fetches ad-related limits from site_settings and enforces them.
 */

import { prisma } from '@thulobazaar/database';
import { isLimitedDigitalService } from '@thulobazaar/types';

export interface AdLimits {
  maxAdsPerUser: number;
  adExpiryDays: number;      // 0 = no expiration
  freeAdsLimit: number;
  maxImagesPerAd: number;    // fallback
  maxImagesVerified: number;
  maxImagesUnverified: number;
}

const DEFAULTS: AdLimits = {
  maxAdsPerUser: 50,
  adExpiryDays: 0,
  freeAdsLimit: 30,
  maxImagesPerAd: 10,
  maxImagesVerified: 10,
  maxImagesUnverified: 5,
};

/**
 * Sent as `code` on the 400 when a seller is at their active-ad cap, with
 * `details: { limit, verifiedLimit, verified }` so clients can localize the
 * message and offer a "Get verified" action instead of parsing English text.
 */
export const AD_LIMIT_REACHED_CODE = 'AD_LIMIT_REACHED';

const SETTING_KEYS = [
  'max_ads_per_user',
  'ad_expiry_days',
  'free_ads_limit',
  'max_images_per_ad',
  'max_images_verified',
  'max_images_unverified',
];

export async function getAdLimits(): Promise<AdLimits> {
  try {
    const settings = await prisma.site_settings.findMany({
      where: { setting_key: { in: SETTING_KEYS } },
      select: { setting_key: true, setting_value: true },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      if (s.setting_value) map[s.setting_key] = s.setting_value;
    }

    // ad_expiry_days: 0 is meaningful ("never expires"), so || won't do — but
    // parseInt('') is NaN and NaN ?? default stays NaN, which produced an
    // Invalid Date whenever the setting row was missing.
    const parsedExpiryDays = parseInt(map.ad_expiry_days || '', 10);

    return {
      maxAdsPerUser: parseInt(map.max_ads_per_user || '', 10) || DEFAULTS.maxAdsPerUser,
      adExpiryDays: Number.isFinite(parsedExpiryDays) ? parsedExpiryDays : DEFAULTS.adExpiryDays,
      freeAdsLimit: parseInt(map.free_ads_limit || '', 10) || DEFAULTS.freeAdsLimit,
      maxImagesPerAd: parseInt(map.max_images_per_ad || '', 10) || DEFAULTS.maxImagesPerAd,
      maxImagesVerified: parseInt(map.max_images_verified || '', 10) || DEFAULTS.maxImagesVerified,
      maxImagesUnverified: parseInt(map.max_images_unverified || '', 10) || DEFAULTS.maxImagesUnverified,
    };
  } catch (error) {
    console.error('Failed to fetch ad limits:', error);
    return DEFAULTS;
  }
}

export async function isUserVerified(userId: number): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      individual_verified: true,
      business_verification_status: true,
    },
  });
  if (!user) return false;
  return user.individual_verified === true ||
    user.business_verification_status === 'approved' ||
    user.business_verification_status === 'verified';
}

export async function getImageLimitForUser(userId: number): Promise<number> {
  const [limits, verified] = await Promise.all([
    getAdLimits(),
    isUserVerified(userId),
  ]);
  return verified ? limits.maxImagesVerified : limits.maxImagesUnverified;
}

export async function countUserActiveAds(userId: number): Promise<number> {
  return prisma.ads.count({
    where: {
      user_id: userId,
      deleted_at: null,
      status: { notIn: ['expired', 'deleted'] },
    },
  });
}

/**
 * Twin of the Express helper (apps/api/src/services/adLimits.service.ts) — the
 * two ad-create paths are separate implementations, so the cap must exist in
 * both. The RULE itself is shared via @thulobazaar/types so only the query
 * duplicates, not the keyword list.
 */
export async function countUserLimitedDigitalAds(
  userId: number,
  excludeAdId?: number
): Promise<number> {
  const ads = await prisma.ads.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      status: { notIn: ['expired', 'deleted'] },
      ...(excludeAdId ? { id: { not: excludeAdId } } : {}),
    },
    select: { title: true },
  });
  return ads.filter((ad) => isLimitedDigitalService(ad.title ?? '')).length;
}

/**
 * Fetch a single boolean setting from site_settings (defaults to true)
 */
export async function getBooleanSetting(key: string, defaultValue = true): Promise<boolean> {
  try {
    const setting = await prisma.site_settings.findUnique({
      where: { setting_key: key },
      select: { setting_value: true },
    });
    if (!setting?.setting_value) return defaultValue;
    return setting.setting_value === 'true';
  } catch {
    return defaultValue;
  }
}

export interface ExpiryBackfillResult {
  restamped: number;
  revived: number;
}

/**
 * Apply a changed ad_expiry_days setting to ALL existing ads, not just new ones.
 * - days > 0:  expires_at = created_at + days (each ad keeps its own clock),
 *              floored at NOW() + 15 days so no ad expires without the
 *              "expiring soon" warning (checkExpiringAds in the API's
 *              notificationCron uses the same 15-day window) firing first.
 * - days <= 0: expires_at = NULL (never expires)
 * Then revive expired ads that were previously approved (reviewed_at set)
 * and now fall inside the new window. The hourly expiry cron handles the
 * opposite direction (ads that fell outside a shrunken window).
 */
export async function applyExpirySettingToAllAds(days: number): Promise<ExpiryBackfillResult> {
  let restamped: number;
  if (days > 0) {
    // Live ads: floored so none expires without warning
    const live = await prisma.$executeRaw`
        UPDATE ads
        SET expires_at = GREATEST(
              created_at + make_interval(days => ${days}),
              NOW() + interval '15 days'
            ),
            updated_at = NOW()
        WHERE deleted_at IS NULL AND status <> 'expired'`;
    // Already-expired ads: plain stamp — no grace floor, otherwise the revive
    // check below would wrongly resurrect ads that are outside the new window
    const expired = await prisma.$executeRaw`
        UPDATE ads
        SET expires_at = created_at + make_interval(days => ${days}), updated_at = NOW()
        WHERE deleted_at IS NULL AND status = 'expired'`;
    restamped = live + expired;
  } else {
    restamped = await prisma.$executeRaw`
        UPDATE ads
        SET expires_at = NULL, updated_at = NOW()
        WHERE deleted_at IS NULL`;
  }

  const revived = await prisma.$executeRaw`
      UPDATE ads
      SET status = 'approved', updated_at = NOW()
      WHERE deleted_at IS NULL
        AND status = 'expired'
        AND reviewed_at IS NOT NULL
        AND (expires_at IS NULL OR expires_at > NOW())`;

  return { restamped, revived };
}

export function calculateExpiresAt(adExpiryDays: number): Date | null {
  if (adExpiryDays <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + adExpiryDays);
  return date;
}
