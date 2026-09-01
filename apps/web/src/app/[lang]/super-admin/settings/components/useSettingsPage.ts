'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import type { SystemSettings, SettingsTab } from './types';
import { DEFAULT_SETTINGS } from './types';

export function useSettingsPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  // Test states
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        const db = data.data;
        setSettings((prev) => ({
          ...prev,
          siteName: db.site_name || prev.siteName,
          siteDescription: db.site_description || prev.siteDescription,
          contactEmail: db.contact_email || prev.contactEmail,
          supportPhone: db.support_phone || prev.supportPhone,
          maintenanceMode: db.maintenance_mode === 'true',
          allowRegistration: db.allow_registration !== 'false',
          requirePhoneVerification: db.require_phone_verification !== 'false',
          maxAdsPerUser: parseInt(db.max_ads_per_user) || prev.maxAdsPerUser,
          // 0 = expiry disabled (ads permanent), so || would wrongly fall back
          adExpiryDays: Number.isFinite(parseInt(db.ad_expiry_days))
            ? parseInt(db.ad_expiry_days)
            : prev.adExpiryDays,
          freeAdsLimit: parseInt(db.free_ads_limit) || prev.freeAdsLimit,
          maxImagesPerAd: parseInt(db.max_images_per_ad) || prev.maxImagesPerAd,
          maxImagesVerified: parseInt(db.max_images_verified) || prev.maxImagesVerified,
          maxImagesUnverified: parseInt(db.max_images_unverified) || prev.maxImagesUnverified,
          smtpEnabled: db.smtp_enabled === 'true',
          smtpHost: db.smtp_host || prev.smtpHost,
          smtpPort: parseInt(db.smtp_port) || prev.smtpPort,
          smtpUser: db.smtp_user || prev.smtpUser,
          smtpPass: db.smtp_pass || prev.smtpPass,
          smtpFromEmail: db.smtp_from_email || prev.smtpFromEmail,
          smtpFromName: db.smtp_from_name || prev.smtpFromName,
          smsEnabled: db.sms_enabled !== 'false',
          notifyOnVerificationApproved: db.notify_on_verification_approved !== 'false',
          notifyOnVerificationRejected: db.notify_on_verification_rejected !== 'false',
          notifyOnAccountSuspended: db.notify_on_account_suspended !== 'false',
          notifyOnAdApproved: db.notify_on_ad_approved === 'true',
          notifyOnAdRejected: db.notify_on_ad_rejected !== 'false',
          smsBusinessApproved: db.sms_business_approved || prev.smsBusinessApproved,
          smsBusinessRejected: db.sms_business_rejected || prev.smsBusinessRejected,
          smsIndividualApproved: db.sms_individual_approved || prev.smsIndividualApproved,
          smsIndividualRejected: db.sms_individual_rejected || prev.smsIndividualRejected,
          smsAccountSuspended: db.sms_account_suspended || prev.smsAccountSuspended,
          smsAccountUnsuspended: db.sms_account_unsuspended || prev.smsAccountUnsuspended,
          smsAdApproved: db.sms_ad_approved || prev.smsAdApproved,
          smsAdRejected: db.sms_ad_rejected || prev.smsAdRejected,
          smsBroadcastAll: db.sms_broadcast_all || prev.smsBroadcastAll,
          smsBroadcastRegular: db.sms_broadcast_regular || prev.smsBroadcastRegular,
          smsBroadcastBusiness: db.sms_broadcast_business || prev.smsBroadcastBusiness,
          smsBroadcastIndividual: db.sms_broadcast_individual || prev.smsBroadcastIndividual,
          // Google Ads
          googleAdsEnabled: db.google_ads_enabled === 'true',
          adsenseClientId: db.adsense_client_id || prev.adsenseClientId,
          adSlotHomeHeroBanner: db.ad_slot_home_hero_banner || prev.adSlotHomeHeroBanner,
          adSlotHomeHeroBannerMobile: db.ad_slot_home_hero_banner_mobile || prev.adSlotHomeHeroBannerMobile,
          adSlotHomeLeft: db.ad_slot_home_left || prev.adSlotHomeLeft,
          adSlotHomeRight: db.ad_slot_home_right || prev.adSlotHomeRight,
          adSlotHomeInFeed: db.ad_slot_home_in_feed || prev.adSlotHomeInFeed,
          adSlotHomeBottom: db.ad_slot_home_bottom || prev.adSlotHomeBottom,
          adSlotAdDetailTop: db.ad_slot_ad_detail_top || prev.adSlotAdDetailTop,
          adSlotAdDetailTopMobile: db.ad_slot_ad_detail_top_mobile || prev.adSlotAdDetailTopMobile,
          adSlotAdDetailLeft: db.ad_slot_ad_detail_left || prev.adSlotAdDetailLeft,
          adSlotAdDetailRight: db.ad_slot_ad_detail_right || prev.adSlotAdDetailRight,
          adSlotAdDetailBottom: db.ad_slot_ad_detail_bottom || prev.adSlotAdDetailBottom,
          adSlotAdsListingTop: db.ad_slot_ads_listing_top || prev.adSlotAdsListingTop,
          adSlotAdsListingTopMobile: db.ad_slot_ads_listing_top_mobile || prev.adSlotAdsListingTopMobile,
          adSlotAdsListingSidebar: db.ad_slot_ads_listing_sidebar || prev.adSlotAdsListingSidebar,
          adSlotAdsListingInFeed: db.ad_slot_ads_listing_in_feed || prev.adSlotAdsListingInFeed,
          adSlotAdsListingBottom: db.ad_slot_ads_listing_bottom || prev.adSlotAdsListingBottom,
          adSlotSearchTop: db.ad_slot_search_top || prev.adSlotSearchTop,
          adSlotSearchTopMobile: db.ad_slot_search_top_mobile || prev.adSlotSearchTopMobile,
          adSlotSearchSidebar: db.ad_slot_search_sidebar || prev.adSlotSearchSidebar,
          adSlotSearchInResults: db.ad_slot_search_in_results || prev.adSlotSearchInResults,
          adSlotSearchBottom: db.ad_slot_search_bottom || prev.adSlotSearchBottom,
          adSlotDashboardSidebar: db.ad_slot_dashboard_sidebar || prev.adSlotDashboardSidebar,
          adSlotProfileSidebar: db.ad_slot_profile_sidebar || prev.adSlotProfileSidebar,
          admobAppIdAndroid: db.admob_app_id_android || prev.admobAppIdAndroid,
          admobAppIdIos: db.admob_app_id_ios || prev.admobAppIdIos,
          admobBannerAndroid: db.admob_banner_android || prev.admobBannerAndroid,
          admobBannerIos: db.admob_banner_ios || prev.admobBannerIos,
          admobInterstitialAndroid: db.admob_interstitial_android || prev.admobInterstitialAndroid,
          admobInterstitialIos: db.admob_interstitial_ios || prev.admobInterstitialIos,
          admobInterstitialInterval: db.admob_interstitial_interval ? parseInt(db.admob_interstitial_interval) : prev.admobInterstitialInterval,
          // Financial reports (empty string is a valid value = exclude nobody)
          financialExcludedUserIds: db.financial_excluded_user_ids ?? prev.financialExcludedUserIds,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${lang}/super-admin/login`);
      return;
    }
    if (staff && isSuperAdmin) {
      loadSettings();
    }
  }, [authLoading, staff, isSuperAdmin, lang, router, loadSettings]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${lang}/super-admin/login`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || 'Settings saved successfully');
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTestingEmail(true);
    try {
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: testEmail, settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Test email sent successfully!');
      } else {
        setError(data.message || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Test email error:', err);
      setError('Failed to send test email');
    } finally {
      setTestingEmail(false);
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) return;
    setTestingSms(true);
    try {
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Test SMS sent successfully!');
      } else {
        setError(data.message || 'Failed to send test SMS');
      }
    } catch (err) {
      console.error('Test SMS error:', err);
      setError('Failed to send test SMS');
    } finally {
      setTestingSms(false);
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
    }
  };

  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return {
    // Auth
    staff,
    handleLogout,
    // State
    loading,
    saving,
    success,
    error,
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    // Actions
    handleSave,
    // Test email
    testEmail,
    setTestEmail,
    testingEmail,
    handleTestEmail,
    // Test SMS
    testPhone,
    setTestPhone,
    testingSms,
    handleTestSms,
  };
}
