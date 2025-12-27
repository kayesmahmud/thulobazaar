'use client';

import type { SystemSettings } from './types';

interface AdSettingsTabProps {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
}

export function AdSettingsTab({ settings, updateSettings }: AdSettingsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Ads Per User</label>
          <input
            type="number"
            value={settings.maxAdsPerUser}
            onChange={(e) => updateSettings({ maxAdsPerUser: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum number of active ads per user</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Expiry (Days)</label>
          <input
            type="number"
            value={settings.adExpiryDays}
            onChange={(e) => updateSettings({ adExpiryDays: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Days until an ad expires automatically</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Free Ads Limit</label>
          <input
            type="number"
            value={settings.freeAdsLimit}
            onChange={(e) => updateSettings({ freeAdsLimit: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Number of free ads allowed per month</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Images Per Ad</label>
          <input
            type="number"
            value={settings.maxImagesPerAd}
            onChange={(e) => updateSettings({ maxImagesPerAd: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum images allowed per ad</p>
        </div>
      </div>
    </div>
  );
}
