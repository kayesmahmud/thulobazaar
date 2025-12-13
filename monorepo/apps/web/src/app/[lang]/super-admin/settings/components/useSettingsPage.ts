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
          requireEmailVerification: db.require_email_verification !== 'false',
          maxAdsPerUser: parseInt(db.max_ads_per_user) || prev.maxAdsPerUser,
          adExpiryDays: parseInt(db.ad_expiry_days) || prev.adExpiryDays,
          freeAdsLimit: parseInt(db.free_ads_limit) || prev.freeAdsLimit,
          maxImagesPerAd: parseInt(db.max_images_per_ad) || prev.maxImagesPerAd,
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
        setSuccess('Settings saved successfully');
        setTimeout(() => setSuccess(''), 3000);
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
