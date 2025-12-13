'use client';

import { use } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import { getSuperAdminNavSections } from '@/lib/navigation';
import {
  useSettingsPage,
  SETTINGS_TABS,
  GeneralSettingsTab,
  AdSettingsTab,
  UserSettingsTab,
  EmailSettingsTab,
  SmsSettingsTab,
} from './components';

export default function SettingsPage({
  params: paramsPromise,
}: {
  params: Promise<{ lang: string }>;
}) {
  const params = use(paramsPromise);
  const navSections = getSuperAdminNavSections(params.lang);

  const {
    staff,
    handleLogout,
    loading,
    saving,
    success,
    error,
    activeTab,
    setActiveTab,
    settings,
    updateSettings,
    handleSave,
    testEmail,
    setTestEmail,
    testingEmail,
    handleTestEmail,
    testPhone,
    setTestPhone,
    testingSms,
    handleTestSms,
  } = useSettingsPage(params.lang);

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
            <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
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
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralSettingsTab settings={settings} updateSettings={updateSettings} />
        )}

        {activeTab === 'ads' && (
          <AdSettingsTab settings={settings} updateSettings={updateSettings} />
        )}

        {activeTab === 'users' && (
          <UserSettingsTab settings={settings} updateSettings={updateSettings} />
        )}

        {activeTab === 'email' && (
          <EmailSettingsTab
            settings={settings}
            updateSettings={updateSettings}
            testEmail={testEmail}
            setTestEmail={setTestEmail}
            testingEmail={testingEmail}
            onTestEmail={handleTestEmail}
          />
        )}

        {activeTab === 'sms' && (
          <SmsSettingsTab
            settings={settings}
            updateSettings={updateSettings}
            testPhone={testPhone}
            setTestPhone={setTestPhone}
            testingSms={testingSms}
            onTestSms={handleTestSms}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
