'use client';

import type { SystemSettings } from './types';
import { ToggleSwitch } from './ToggleSwitch';

interface SmsSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  testPhone: string;
  setTestPhone: (phone: string) => void;
  testingSms: boolean;
  onTestSms: () => void;
}

export function SmsSettingsTab({
  settings,
  updateSettings,
  testPhone,
  setTestPhone,
  testingSms,
  onTestSms,
}: SmsSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* SMS Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SMS Notifications (Aakash SMS)</h2>
            <p className="text-sm text-gray-600">Send SMS to users with Nepali phone numbers</p>
          </div>
          <ToggleSwitch
            checked={settings.smsEnabled}
            onChange={(checked) => updateSettings({ smsEnabled: checked })}
            label={settings.smsEnabled ? 'Enabled' : 'Disabled'}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> SMS is configured via the{' '}
            <code className="bg-blue-100 px-1 rounded">AAKASH_SMS_TOKEN</code> environment variable.
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
              onClick={onTestSms}
              disabled={testingSms || !settings.smsEnabled}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {testingSms ? 'Sending...' : 'Send Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter a valid Nepali phone number (97XXXXXXXX or 98XXXXXXXX)
          </p>
        </div>
      </div>

      {/* SMS Message Templates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">SMS Message Templates</h2>
          <p className="text-sm text-gray-600">
            Customize the SMS messages sent to users. Use{' '}
            <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> for user name and{' '}
            <code className="bg-gray-100 px-1 rounded">{'{reason}'}</code> for rejection reason.
          </p>
        </div>

        <div className="space-y-4">
          {/* Business Verification */}
          <TemplateSection
            title="Business Verification"
            templates={[
              {
                label: 'Approved Message',
                value: settings.smsBusinessApproved,
                onChange: (v) => updateSettings({ smsBusinessApproved: v }),
              },
              {
                label: 'Rejected Message',
                value: settings.smsBusinessRejected,
                onChange: (v) => updateSettings({ smsBusinessRejected: v }),
              },
            ]}
          />

          {/* Individual Verification */}
          <TemplateSection
            title="Individual Verification"
            templates={[
              {
                label: 'Approved Message',
                value: settings.smsIndividualApproved,
                onChange: (v) => updateSettings({ smsIndividualApproved: v }),
              },
              {
                label: 'Rejected Message',
                value: settings.smsIndividualRejected,
                onChange: (v) => updateSettings({ smsIndividualRejected: v }),
              },
            ]}
          />

          {/* Account Status */}
          <TemplateSection
            title="Account Status"
            templates={[
              {
                label: 'Suspended Message',
                value: settings.smsAccountSuspended,
                onChange: (v) => updateSettings({ smsAccountSuspended: v }),
              },
              {
                label: 'Restored Message',
                value: settings.smsAccountUnsuspended,
                onChange: (v) => updateSettings({ smsAccountUnsuspended: v }),
              },
            ]}
          />

          {/* Ad Status */}
          <TemplateSection
            title="Ad Status"
            templates={[
              {
                label: 'Approved Message',
                value: settings.smsAdApproved,
                onChange: (v) => updateSettings({ smsAdApproved: v }),
              },
              {
                label: 'Rejected Message',
                value: settings.smsAdRejected,
                onChange: (v) => updateSettings({ smsAdRejected: v }),
              },
            ]}
            isLast
          />
        </div>
      </div>

      {/* Custom Broadcast Messages */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom Broadcast Messages</h2>
          <p className="text-sm text-gray-600">
            Templates for sending bulk SMS to different user groups. Use{' '}
            <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> for user name and{' '}
            <code className="bg-gray-100 px-1 rounded">{'{message}'}</code> for your custom message.
          </p>
        </div>

        <div className="space-y-4">
          <BroadcastTemplate
            icon="👥"
            label="All Users"
            value={settings.smsBroadcastAll}
            onChange={(v) => updateSettings({ smsBroadcastAll: v })}
            color="blue"
          />
          <BroadcastTemplate
            icon="👤"
            label="Regular Users (Unverified)"
            value={settings.smsBroadcastRegular}
            onChange={(v) => updateSettings({ smsBroadcastRegular: v })}
            color="gray"
          />
          <BroadcastTemplate
            icon="🏢"
            label="Verified Business"
            value={settings.smsBroadcastBusiness}
            onChange={(v) => updateSettings({ smsBroadcastBusiness: v })}
            color="purple"
          />
          <BroadcastTemplate
            icon="✓"
            label="Verified Individual"
            value={settings.smsBroadcastIndividual}
            onChange={(v) => updateSettings({ smsBroadcastIndividual: v })}
            color="green"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> To send broadcast messages, go to <strong>Announcements</strong>{' '}
            section where you can compose and send SMS to selected user groups.
          </p>
        </div>
      </div>
    </div>
  );
}

interface TemplateSectionProps {
  title: string;
  templates: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
  }>;
  isLast?: boolean;
}

function TemplateSection({ title, templates, isLast }: TemplateSectionProps) {
  return (
    <div className={isLast ? '' : 'border-b border-gray-200 pb-4'}>
      <h3 className="font-medium text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">
        {templates.map((template, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{template.label}</label>
            <textarea
              value={template.value}
              onChange={(e) => template.onChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface BroadcastTemplateProps {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  color: 'blue' | 'gray' | 'purple' | 'green';
}

function BroadcastTemplate({ icon, label, value, onChange, color }: BroadcastTemplateProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900 border-blue-300 focus:ring-blue-500',
    gray: 'bg-gray-50 border-gray-200 text-gray-900 border-gray-300 focus:ring-gray-500',
    purple: 'bg-purple-50 border-purple-200 text-purple-900 border-purple-300 focus:ring-purple-500',
    green: 'bg-green-50 border-green-200 text-green-900 border-green-300 focus:ring-green-500',
  };

  const [bgBorder, textColor, inputBorder] = colorClasses[color].split(' ');

  return (
    <div className={`p-4 ${bgBorder} border rounded-lg`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-${color}-600 text-lg`}>{icon}</span>
        <label className={`block text-sm font-medium ${textColor}`}>{label}</label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={`Message template for ${label.toLowerCase()}...`}
        className={`w-full px-3 py-2 border ${inputBorder} rounded-lg focus:ring-2 focus:border-transparent text-sm`}
      />
    </div>
  );
}
