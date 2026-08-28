/**
 * Ad Limits Service
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
    // parseInt('') is NaN and NaN ?? default stays NaN, which crashed ad
    // creation with an Invalid Date whenever the setting row was missing.
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

/**
 * Check if a user is verified (business or individual)
 */
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

/**
 * Get the image limit for a specific user based on verification status
 */
export async function getImageLimitForUser(userId: number): Promise<number> {
  const [limits, verified] = await Promise.all([
    getAdLimits(),
    isUserVerified(userId),
  ]);
  return verified ? limits.maxImagesVerified : limits.maxImagesUnverified;
}

/**
 * Count user's active ads (not deleted, not expired)
 */
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
 * How many follower-service / subscription-login ads this seller already has
 * live. Titles are matched in JS rather than SQL because the rule is a keyword
 * list that changes often — see @thulobazaar/types.
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

/**
 * Fetch a single numeric setting from site_settings.
 * 0 is a valid stored value (Number.isFinite check, not ||) — e.g. a cap of 0 means "off".
 */
export async function getNumberSetting(key: string, defaultValue: number): Promise<number> {
  try {
    const setting = await prisma.site_settings.findUnique({
      where: { setting_key: key },
      select: { setting_value: true },
    });
    const parsed = parseInt(setting?.setting_value || '', 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Calculate expires_at date based on adExpiryDays setting
 * Returns null if adExpiryDays is 0 (no expiration)
 */
export function calculateExpiresAt(adExpiryDays: number): Date | null {
  if (adExpiryDays <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + adExpiryDays);
  return date;
}
