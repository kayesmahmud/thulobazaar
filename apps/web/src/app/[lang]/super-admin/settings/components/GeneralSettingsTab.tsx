'use client';

import type { SystemSettings } from './types';
import { ToggleRow } from './ToggleSwitch';

interface GeneralSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

export function GeneralSettingsTab({ settings, updateSettings }: GeneralSettingsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => updateSettings({ siteName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => updateSettings({ contactEmail: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
          <input
            type="text"
            value={settings.supportPhone}
            onChange={(e) => updateSettings({ supportPhone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
          <textarea
            value={settings.siteDescription}
            onChange={(e) => updateSettings({ siteDescription: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-4">System Status</h3>
        <ToggleRow
          title="Maintenance Mode"
          description="When enabled, only admins can access the site"
          checked={settings.maintenanceMode}
          onChange={(checked) => updateSettings({ maintenanceMode: checked })}
        />
      </div>
    </div>
  );
}
