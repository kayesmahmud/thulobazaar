import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@thulobazaar/database';
import { requireSuperAdmin } from '@/lib/auth';
import { applyExpirySettingToAllAds } from '@/lib/services/adLimits.service';

// Empty, or comma-separated positive integers with optional whitespace ("14, 27")
const EXCLUDED_USER_IDS_PATTERN = /^\s*$|^\s*[1-9]\d*\s*(,\s*[1-9]\d*\s*)*$/;

/**
 * GET /api/admin/settings
 * Get all system settings
 * Requires: Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const settings = await prisma.site_settings.findMany();

    // Convert to key-value object
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.setting_key] = setting.setting_value || '';
    }

    return NextResponse.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Save system settings
 * Requires: Super Admin role
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Map of setting keys to types
    const settingTypes: Record<string, string> = {
      smtp_enabled: 'boolean',
      smtp_host: 'string',
      smtp_port: 'number',
      smtp_user: 'string',
      smtp_pass: 'string',
      smtp_from_email: 'string',
      smtp_from_name: 'string',
      sms_enabled: 'boolean',
      notify_on_verification_approved: 'boolean',
      notify_on_verification_rejected: 'boolean',
      notify_on_account_suspended: 'boolean',
      notify_on_ad_approved: 'boolean',
      notify_on_ad_rejected: 'boolean',
      site_name: 'string',
      site_description: 'string',
      contact_email: 'string',
      support_phone: 'string',
      maintenance_mode: 'boolean',
      allow_registration: 'boolean',
      require_phone_verification: 'boolean',
      max_ads_per_user: 'number',
      ad_expiry_days: 'number',
      free_ads_limit: 'number',
      max_images_per_ad: 'number',
      max_images_verified: 'number',
      max_images_unverified: 'number',
      // SMS Message Templates
      sms_business_approved: 'string',
      sms_business_rejected: 'string',
      sms_individual_approved: 'string',
      sms_individual_rejected: 'string',
      sms_account_suspended: 'string',
      sms_account_unsuspended: 'string',
      sms_ad_approved: 'string',
      sms_ad_rejected: 'string',
      // Broadcast Message Templates
      sms_broadcast_all: 'string',
      sms_broadcast_regular: 'string',
      sms_broadcast_business: 'string',
      sms_broadcast_individual: 'string',
      // Google Ads
      google_ads_enabled: 'boolean',
      adsense_client_id: 'string',
      ad_slot_home_hero_banner: 'string',
      ad_slot_home_hero_banner_mobile: 'string',
      ad_slot_home_left: 'string',
      ad_slot_home_right: 'string',
      ad_slot_home_in_feed: 'string',
      ad_slot_home_bottom: 'string',
      ad_slot_ad_detail_top: 'string',
      ad_slot_ad_detail_top_mobile: 'string',
      ad_slot_ad_detail_left: 'string',
      ad_slot_ad_detail_right: 'string',
      ad_slot_ad_detail_bottom: 'string',
      ad_slot_ads_listing_top: 'string',
      ad_slot_ads_listing_top_mobile: 'string',
      ad_slot_ads_listing_sidebar: 'string',
      ad_slot_ads_listing_in_feed: 'string',
      ad_slot_ads_listing_bottom: 'string',
      ad_slot_search_top: 'string',
      ad_slot_search_top_mobile: 'string',
      ad_slot_search_sidebar: 'string',
      ad_slot_search_in_results: 'string',
      ad_slot_search_bottom: 'string',
      ad_slot_dashboard_sidebar: 'string',
      ad_slot_profile_sidebar: 'string',
      admob_app_id_android: 'string',
      admob_app_id_ios: 'string',
      admob_banner_android: 'string',
      admob_banner_ios: 'string',
      admob_interstitial_android: 'string',
      admob_interstitial_ios: 'string',
      admob_interstitial_interval: 'number',
      // Financial reports
      financial_excluded_user_ids: 'string',
    };

    if (
      settings.financialExcludedUserIds !== undefined &&
      !EXCLUDED_USER_IDS_PATTERN.test(String(settings.financialExcludedUserIds))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Excluded test accounts must be a comma-separated list of positive user IDs (e.g. "14, 27") or empty',
        },
        { status: 400 }
      );
    }

    // Expiry changes must propagate to existing ads, so capture the old value
    const previousExpiry = await prisma.site_settings.findUnique({
      where: { setting_key: 'ad_expiry_days' },
      select: { setting_value: true },
    });

    // Upsert all settings
    for (const [key, value] of Object.entries(settings)) {
      const snakeCaseKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      const settingType = settingTypes[snakeCaseKey] || 'string';

      await prisma.site_settings.upsert({
        where: { setting_key: snakeCaseKey },
        update: {
          setting_value: String(value),
          setting_type: settingType,
          updated_at: new Date(),
        },
        create: {
          setting_key: snakeCaseKey,
          setting_value: String(value),
          setting_type: settingType,
        },
      });
    }

    // If ad_expiry_days changed, restamp ALL existing ads (and revive
    // previously approved ones that fall inside the new window)
    let message = 'Settings saved successfully';
    if (
      settings.adExpiryDays !== undefined &&
      String(settings.adExpiryDays) !== (previousExpiry?.setting_value ?? '')
    ) {
      const days = parseInt(String(settings.adExpiryDays), 10) || 0;
      const { restamped, revived } = await applyExpirySettingToAllAds(days);
      message = `Settings saved. Expiry ${days > 0 ? `(${days} days)` : '(off)'} applied to ${restamped} ads${revived > 0 ? `, ${revived} revived` : ''}`;
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Save settings error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message?.includes('Forbidden')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
