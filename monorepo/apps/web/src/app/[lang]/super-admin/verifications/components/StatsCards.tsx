'use client';

import type { TabType, TabConfig } from '../types';

interface StatsCardsProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function StatsCards({ tabs, activeTab, onTabChange }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            activeTab === tab.id
              ? `border-${tab.color}-500 bg-${tab.color}-50 shadow-lg`
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{tab.icon}</span>
            <span className={`text-2xl font-bold ${activeTab === tab.id ? `text-${tab.color}-600` : 'text-gray-900'}`}>
              {tab.count}
            </span>
          </div>
          <div className={`text-sm font-medium ${activeTab === tab.id ? `text-${tab.color}-700` : 'text-gray-600'}`}>
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
}
