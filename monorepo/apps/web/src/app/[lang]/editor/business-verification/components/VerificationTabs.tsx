'use client';

import type { TabStatus } from './types';

interface VerificationTabsProps {
  activeTab: TabStatus;
  setActiveTab: (tab: TabStatus) => void;
  count: number;
}

export function VerificationTabs({ activeTab, setActiveTab, count }: VerificationTabsProps) {
  const tabs: { key: TabStatus; label: string; activeStyle: string }[] = [
    { key: 'pending', label: 'Pending', activeStyle: 'from-blue-500 to-blue-600' },
    { key: 'rejected', label: 'Rejected', activeStyle: 'from-red-500 to-red-600' },
    { key: 'approved', label: 'Verified', activeStyle: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === tab.key
                ? `bg-gradient-to-r ${tab.activeStyle} text-white shadow-lg`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{count}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
