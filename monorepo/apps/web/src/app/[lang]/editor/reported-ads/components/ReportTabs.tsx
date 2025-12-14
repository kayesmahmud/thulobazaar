'use client';

import type { TabStatus, TabConfig, TabCounts } from '../types';

interface ReportTabsProps {
  tabs: TabConfig[];
  activeTab: TabStatus;
  tabCounts: TabCounts;
  onTabChange: (tab: TabStatus) => void;
}

export default function ReportTabs({ tabs, activeTab, tabCounts, onTabChange }: ReportTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === tab.id
              ? tab.id === 'pending'
                ? 'bg-red-500 text-white shadow-md'
                : tab.id === 'resolved'
                ? 'bg-green-500 text-white shadow-md'
                : tab.id === 'restored'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === tab.id
              ? 'bg-white/20 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}>
            {tabCounts[tab.id]}
          </span>
        </button>
      ))}
    </div>
  );
}
