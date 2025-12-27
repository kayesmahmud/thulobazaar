'use client';

import type { SystemSettings } from './types';
import { ToggleSwitch, ToggleRow } from './ToggleSwitch';

interface EmailSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  testEmail: string;
  setTestEmail: (email: string) => void;
  testingEmail: boolean;
  onTestEmail: () => void;
}

export function EmailSettingsTab({
  settings,
  updateSettings,
  testEmail,
  setTestEmail,
  testingEmail,
  onTestEmail,
}: EmailSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* SMTP Email Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Email Settings (SMTP)</h2>
          <ToggleSwitch
            checked={settings.smtpEnabled}
            onChange={(checked) => updateSettings({ smtpEnabled: checked })}
            label={settings.smtpEnabled ? 'Enabled' : 'Disabled'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => updateSettings({ smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => updateSettings({ smtpPort: parseInt(e.target.value) || 587 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">587 for TLS, 465 for SSL</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
            <input
              type="text"
              value={settings.smtpUser}
              onChange={(e) => updateSettings({ smtpUser: e.target.value })}
              placeholder="your-email@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
            <input
              type="password"
              value={settings.smtpPass}
              onChange={(e) => updateSettings({ smtpPass: e.target.value })}
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
              onChange={(e) => updateSettings({ smtpFromEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
            <input
              type="text"
              value={settings.smtpFromName}
              onChange={(e) => updateSettings({ smtpFromName: e.target.value })}
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
              onClick={onTestEmail}
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
        <p className="text-sm text-gray-600">
          Choose when to send email notifications to users (requires SMTP to be configured)
        </p>

        <div className="space-y-4">
          <ToggleRow
            title="Verification Approved"
            description="Send email when business/individual verification is approved"
            checked={settings.notifyOnVerificationApproved}
            onChange={(checked) => updateSettings({ notifyOnVerificationApproved: checked })}
          />
          <ToggleRow
            title="Verification Rejected"
            description="Send email when business/individual verification is rejected"
            checked={settings.notifyOnVerificationRejected}
            onChange={(checked) => updateSettings({ notifyOnVerificationRejected: checked })}
          />
          <ToggleRow
            title="Account Suspended"
            description="Send email when user account is suspended or restored"
            checked={settings.notifyOnAccountSuspended}
            onChange={(checked) => updateSettings({ notifyOnAccountSuspended: checked })}
          />
          <ToggleRow
            title="Ad Approved"
            description="Send email when user's ad is approved"
            checked={settings.notifyOnAdApproved}
            onChange={(checked) => updateSettings({ notifyOnAdApproved: checked })}
          />
          <ToggleRow
            title="Ad Rejected"
            description="Send email when user's ad is rejected"
            checked={settings.notifyOnAdRejected}
            onChange={(checked) => updateSettings({ notifyOnAdRejected: checked })}
          />
        </div>
      </div>
    </div>
  );
}
