'use client';

import type { FreeVerificationSettings } from '../types';
import { DURATION_LABELS } from '../types';

interface FreeVerificationCardProps {
  settings: FreeVerificationSettings;
  saving: boolean;
  onToggle: () => void;
}

export default function FreeVerificationCard({
  settings,
  saving,
  onToggle,
}: FreeVerificationCardProps) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🎁</div>
          <div>
            <h2 className="text-xl font-bold text-green-800">Free Verification Promotion</h2>
            <p className="text-green-700">
              When enabled, new users get <strong>{DURATION_LABELS[settings.durationDays] || `${settings.durationDays} days`}</strong> free verification
            </p>
            <p className="text-sm text-green-600 mt-1">
              Applies to: {settings.types.map(t => t === 'individual' ? 'Individual' : 'Business').join(' & ')} verification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            settings.enabled
              ? 'bg-green-200 text-green-800'
              : 'bg-gray-200 text-gray-600'
          }`}>
            {settings.enabled ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <button
            onClick={onToggle}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              settings.enabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } disabled:opacity-50`}
          >
            {saving ? 'Saving...' : settings.enabled ? 'Disable Promotion' : 'Enable Promotion'}
          </button>
        </div>
      </div>
    </div>
  );
}
