'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { getSuperAdminNavSections } from '@/lib/superAdminNavigation';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxAdsPerUser: number;
  adExpiryDays: number;
  freeAdsLimit: number;
  maxImagesPerAd: number;
  // SMTP Settings
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFromEmail: string;
  smtpFromName: string;
  // SMS Settings
  smsEnabled: boolean;
  // Notification Preferences
  notifyOnVerificationApproved: boolean;
  notifyOnVerificationRejected: boolean;
  notifyOnAccountSuspended: boolean;
  notifyOnAdApproved: boolean;
  notifyOnAdRejected: boolean;
  // SMS Message Templates
  smsBusinessApproved: string;
  smsBusinessRejected: string;
  smsIndividualApproved: string;
  smsIndividualRejected: string;
  smsAccountSuspended: string;
  smsAccountUnsuspended: string;
  smsAdApproved: string;
  smsAdRejected: string;
  // Custom Broadcast Messages
  smsBroadcastAll: string;
  smsBroadcastRegular: string;
  smsBroadcastBusiness: string;
  smsBroadcastIndividual: string;
}

export default function SettingsPage({ params: paramsPromise }: { params: Promise<{ lang: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { staff, isLoading: authLoading, isSuperAdmin, logout } = useStaffAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'ads' | 'users' | 'email' | 'sms'>('general');

  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'ThuluBazaar',
    siteDescription: 'Nepal\'s Leading Marketplace',
    contactEmail: 'support@thulobazaar.com',
    supportPhone: '+977-1-1234567',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    maxAdsPerUser: 50,
    adExpiryDays: 30,
    freeAdsLimit: 5,
    maxImagesPerAd: 10,
    // SMTP
    smtpEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFromEmail: 'noreply@thulobazaar.com',
    smtpFromName: 'Thulo Bazaar',
    // SMS
    smsEnabled: true,
    // Notifications
    notifyOnVerificationApproved: true,
    notifyOnVerificationRejected: true,
    notifyOnAccountSuspended: true,
    notifyOnAdApproved: false,
    notifyOnAdRejected: true,
    // SMS Templates (use {name} and {reason} as placeholders)
    smsBusinessApproved: 'Congratulations {name}! Your business verification on Thulo Bazaar has been approved. You can now enjoy all business seller benefits.',
    smsBusinessRejected: 'Dear {name}, your business verification on Thulo Bazaar was not approved. Reason: {reason}. Please submit a new request with correct documents.',
    smsIndividualApproved: 'Congratulations {name}! Your identity verification on Thulo Bazaar has been approved.',
    smsIndividualRejected: 'Dear {name}, your identity verification on Thulo Bazaar was not approved. Reason: {reason}.',
    smsAccountSuspended: 'Dear {name}, your Thulo Bazaar account has been suspended. Reason: {reason}. Contact support for assistance.',
    smsAccountUnsuspended: 'Good news {name}! Your Thulo Bazaar account has been restored. You can now access all features.',
    smsAdApproved: 'Great news {name}! Your ad on Thulo Bazaar has been approved and is now live.',
    smsAdRejected: 'Dear {name}, your ad on Thulo Bazaar was not approved. Reason: {reason}.',
    // Custom Broadcast Messages
    smsBroadcastAll: 'Dear {name}, this is an important announcement from Thulo Bazaar. {message}',
    smsBroadcastRegular: 'Dear {name}, get verified on Thulo Bazaar to unlock more features! {message}',
    smsBroadcastBusiness: 'Dear Business Partner {name}, {message} - Thulo Bazaar',
    smsBroadcastIndividual: 'Dear Verified Seller {name}, {message} - Thulo Bazaar',
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    if (!authLoading && (!staff || !isSuperAdmin)) {
      router.push(`/${params.lang}/super-admin/login`);
      return;
    }

    if (staff && isSuperAdmin) {
      loadSettings();
    }
  }, [authLoading, staff, isSuperAdmin, params.lang, router]);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        // Map snake_case DB keys to camelCase state
        const dbSettings = data.data;
        setSettings((prev) => ({
          ...prev,
          siteName: dbSettings.site_name || prev.siteName,
          siteDescription: dbSettings.site_description || prev.siteDescription,
          contactEmail: dbSettings.contact_email || prev.contactEmail,
          supportPhone: dbSettings.support_phone || prev.supportPhone,
          maintenanceMode: dbSettings.maintenance_mode === 'true',
          allowRegistration: dbSettings.allow_registration !== 'false',
          requireEmailVerification: dbSettings.require_email_verification !== 'false',
          maxAdsPerUser: parseInt(dbSettings.max_ads_per_user) || prev.maxAdsPerUser,
          adExpiryDays: parseInt(dbSettings.ad_expiry_days) || prev.adExpiryDays,
          freeAdsLimit: parseInt(dbSettings.free_ads_limit) || prev.freeAdsLimit,
          maxImagesPerAd: parseInt(dbSettings.max_images_per_ad) || prev.maxImagesPerAd,
          smtpEnabled: dbSettings.smtp_enabled === 'true',
          smtpHost: dbSettings.smtp_host || prev.smtpHost,
          smtpPort: parseInt(dbSettings.smtp_port) || prev.smtpPort,
          smtpUser: dbSettings.smtp_user || prev.smtpUser,
          smtpPass: dbSettings.smtp_pass || prev.smtpPass,
          smtpFromEmail: dbSettings.smtp_from_email || prev.smtpFromEmail,
          smtpFromName: dbSettings.smtp_from_name || prev.smtpFromName,
          smsEnabled: dbSettings.sms_enabled !== 'false',
          notifyOnVerificationApproved: dbSettings.notify_on_verification_approved !== 'false',
          notifyOnVerificationRejected: dbSettings.notify_on_verification_rejected !== 'false',
          notifyOnAccountSuspended: dbSettings.notify_on_account_suspended !== 'false',
          notifyOnAdApproved: dbSettings.notify_on_ad_approved === 'true',
          notifyOnAdRejected: dbSettings.notify_on_ad_rejected !== 'false',
          // SMS Templates
          smsBusinessApproved: dbSettings.sms_business_approved || prev.smsBusinessApproved,
          smsBusinessRejected: dbSettings.sms_business_rejected || prev.smsBusinessRejected,
          smsIndividualApproved: dbSettings.sms_individual_approved || prev.smsIndividualApproved,
          smsIndividualRejected: dbSettings.sms_individual_rejected || prev.smsIndividualRejected,
          smsAccountSuspended: dbSettings.sms_account_suspended || prev.smsAccountSuspended,
          smsAccountUnsuspended: dbSettings.sms_account_unsuspended || prev.smsAccountUnsuspended,
          smsAdApproved: dbSettings.sms_ad_approved || prev.smsAdApproved,
          smsAdRejected: dbSettings.sms_ad_rejected || prev.smsAdRejected,
          // Broadcast Templates
          smsBroadcastAll: dbSettings.sms_broadcast_all || prev.smsBroadcastAll,
          smsBroadcastRegular: dbSettings.sms_broadcast_regular || prev.smsBroadcastRegular,
          smsBroadcastBusiness: dbSettings.sms_broadcast_business || prev.smsBroadcastBusiness,
          smsBroadcastIndividual: dbSettings.sms_broadcast_individual || prev.smsBroadcastIndividual,
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${params.lang}/super-admin/login`);
  };

  const navSections = getSuperAdminNavSections(params.lang);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('editorToken');
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

  if (loading) {
    return (
      <DashboardLayout
        lang={params.lang}
        userName={staff?.fullName}
        userEmail={staff?.email}
        navSections={navSections}
        theme="superadmin"
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      lang={params.lang}
      userName={staff?.fullName}
      userEmail={staff?.email}
      navSections={navSections}
      theme="superadmin"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure platform settings and preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'ads', label: 'Ad Settings', icon: '📢' },
              { id: 'users', label: 'User Settings', icon: '👥' },
              { id: 'email', label: 'Email', icon: '📧' },
              { id: 'sms', label: 'SMS (Aakash)', icon: '📱' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-4">System Status</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Maintenance Mode</div>
                  <div className="text-sm text-gray-600">When enabled, only admins can access the site</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Ad Settings */}
        {activeTab === 'ads' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Ads Per User</label>
                <input
                  type="number"
                  value={settings.maxAdsPerUser}
                  onChange={(e) => setSettings({ ...settings, maxAdsPerUser: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum number of active ads per user</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Expiry (Days)</label>
                <input
                  type="number"
                  value={settings.adExpiryDays}
                  onChange={(e) => setSettings({ ...settings, adExpiryDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Days until an ad expires automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Free Ads Limit</label>
                <input
                  type="number"
                  value={settings.freeAdsLimit}
                  onChange={(e) => setSettings({ ...settings, freeAdsLimit: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Number of free ads allowed per month</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Images Per Ad</label>
                <input
                  type="number"
                  value={settings.maxImagesPerAd}
                  onChange={(e) => setSettings({ ...settings, maxImagesPerAd: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum images allowed per ad</p>
              </div>
            </div>
          </div>
        )}

        {/* User Settings */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Allow User Registration</div>
                  <div className="text-sm text-gray-600">Enable or disable new user registrations</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistration}
                    onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Require Email Verification</div>
                  <div className="text-sm text-gray-600">New users must verify their email before posting ads</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* SMTP Email Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Email Settings (SMTP)</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smtpEnabled}
                    onChange={(e) => setSettings({ ...settings, smtpEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600">{settings.smtpEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">587 for TLS, 465 for SSL</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    placeholder="App Password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">For Gmail, use App Password</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                  <input
                    type="email"
                    value={settings.smtpFromEmail}
                    onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                  <input
                    type="text"
                    value={settings.smtpFromName}
                    onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Test Email */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Test Email</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      if (!testEmail) return;
                      setTestingEmail(true);
                      try {
                        const token = localStorage.getItem('editorToken');
                        const res = await fetch('/api/admin/settings/test-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ email: testEmail, settings }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setSuccess('Test email sent successfully!');
                        } else {
                          setError(data.message || 'Failed to send test email');
                        }
                      } catch {
                        setError('Failed to send test email');
                      } finally {
                        setTestingEmail(false);
                        setTimeout(() => { setSuccess(''); setError(''); }, 3000);
                      }
                    }}
                    disabled={testingEmail || !settings.smtpEnabled}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {testingEmail ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Notification Triggers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Email Notification Triggers</h2>
              <p className="text-sm text-gray-600">Choose when to send email notifications to users (requires SMTP to be configured)</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Verification Approved</div>
                    <div className="text-sm text-gray-600">Send email when business/individual verification is approved</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnVerificationApproved}
                      onChange={(e) => setSettings({ ...settings, notifyOnVerificationApproved: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Verification Rejected</div>
                    <div className="text-sm text-gray-600">Send email when business/individual verification is rejected</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnVerificationRejected}
                      onChange={(e) => setSettings({ ...settings, notifyOnVerificationRejected: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Account Suspended</div>
                    <div className="text-sm text-gray-600">Send email when user account is suspended or restored</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnAccountSuspended}
                      onChange={(e) => setSettings({ ...settings, notifyOnAccountSuspended: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Ad Approved</div>
                    <div className="text-sm text-gray-600">Send email when user's ad is approved</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnAdApproved}
                      onChange={(e) => setSettings({ ...settings, notifyOnAdApproved: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Ad Rejected</div>
                    <div className="text-sm text-gray-600">Send email when user's ad is rejected</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnAdRejected}
                      onChange={(e) => setSettings({ ...settings, notifyOnAdRejected: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMS Settings Tab */}
        {activeTab === 'sms' && (
          <div className="space-y-6">
            {/* SMS Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">SMS Notifications (Aakash SMS)</h2>
                  <p className="text-sm text-gray-600">Send SMS to users with Nepali phone numbers</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.smsEnabled}
                    onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600">{settings.smsEnabled ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> SMS is configured via the <code className="bg-blue-100 px-1 rounded">AAKASH_SMS_TOKEN</code> environment variable.
                  Contact your administrator to update the API token.
                </p>
              </div>

              {/* Test SMS */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Test SMS</h3>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="98XXXXXXXX"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={async () => {
                      if (!testPhone) return;
                      setTestingSms(true);
                      try {
                        const token = localStorage.getItem('editorToken');
                        const res = await fetch('/api/admin/settings/test-sms', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({ phone: testPhone }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setSuccess('Test SMS sent successfully!');
                        } else {
                          setError(data.message || 'Failed to send test SMS');
                        }
                      } catch {
                        setError('Failed to send test SMS');
                      } finally {
                        setTestingSms(false);
                        setTimeout(() => { setSuccess(''); setError(''); }, 3000);
                      }
                    }}
                    disabled={testingSms || !settings.smsEnabled}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {testingSms ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter a valid Nepali phone number (97XXXXXXXX or 98XXXXXXXX)</p>
              </div>
            </div>

            {/* SMS Message Templates */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">SMS Message Templates</h2>
                <p className="text-sm text-gray-600">Customize the SMS messages sent to users. Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> for user name and <code className="bg-gray-100 px-1 rounded">{'{reason}'}</code> for rejection reason.</p>
              </div>

              <div className="space-y-4">
                {/* Business Verification */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Business Verification</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved Message</label>
                      <textarea
                        value={settings.smsBusinessApproved}
                        onChange={(e) => setSettings({ ...settings, smsBusinessApproved: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejected Message</label>
                      <textarea
                        value={settings.smsBusinessRejected}
                        onChange={(e) => setSettings({ ...settings, smsBusinessRejected: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Individual Verification */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Individual Verification</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved Message</label>
                      <textarea
                        value={settings.smsIndividualApproved}
                        onChange={(e) => setSettings({ ...settings, smsIndividualApproved: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejected Message</label>
                      <textarea
                        value={settings.smsIndividualRejected}
                        onChange={(e) => setSettings({ ...settings, smsIndividualRejected: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Account Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Suspended Message</label>
                      <textarea
                        value={settings.smsAccountSuspended}
                        onChange={(e) => setSettings({ ...settings, smsAccountSuspended: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Restored Message</label>
                      <textarea
                        value={settings.smsAccountUnsuspended}
                        onChange={(e) => setSettings({ ...settings, smsAccountUnsuspended: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Ad Status */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-3">Ad Status</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approved Message</label>
                      <textarea
                        value={settings.smsAdApproved}
                        onChange={(e) => setSettings({ ...settings, smsAdApproved: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejected Message</label>
                      <textarea
                        value={settings.smsAdRejected}
                        onChange={(e) => setSettings({ ...settings, smsAdRejected: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Broadcast Messages */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Custom Broadcast Messages</h2>
                <p className="text-sm text-gray-600">
                  Templates for sending bulk SMS to different user groups. Use <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> for user name and <code className="bg-gray-100 px-1 rounded">{'{message}'}</code> for your custom message.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 text-lg">👥</span>
                    <label className="block text-sm font-medium text-blue-900">All Users</label>
                  </div>
                  <textarea
                    value={settings.smsBroadcastAll}
                    onChange={(e) => setSettings({ ...settings, smsBroadcastAll: e.target.value })}
                    rows={2}
                    placeholder="Message template for all users..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-600 text-lg">👤</span>
                    <label className="block text-sm font-medium text-gray-900">Regular Users (Unverified)</label>
                  </div>
                  <textarea
                    value={settings.smsBroadcastRegular}
                    onChange={(e) => setSettings({ ...settings, smsBroadcastRegular: e.target.value })}
                    rows={2}
                    placeholder="Message template for unverified users..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600 text-lg">🏢</span>
                    <label className="block text-sm font-medium text-purple-900">Verified Business</label>
                  </div>
                  <textarea
                    value={settings.smsBroadcastBusiness}
                    onChange={(e) => setSettings({ ...settings, smsBroadcastBusiness: e.target.value })}
                    rows={2}
                    placeholder="Message template for verified business accounts..."
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <label className="block text-sm font-medium text-green-900">Verified Individual</label>
                  </div>
                  <textarea
                    value={settings.smsBroadcastIndividual}
                    onChange={(e) => setSettings({ ...settings, smsBroadcastIndividual: e.target.value })}
                    rows={2}
                    placeholder="Message template for verified individual accounts..."
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> To send broadcast messages, go to <strong>Announcements</strong> section where you can compose and send SMS to selected user groups.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
