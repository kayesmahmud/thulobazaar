'use client';

import { CheckCircle, XCircle, Clock, PauseCircle, Trash2 } from 'lucide-react';
import type { TabStatus } from '../types';
import { TAB_LIST } from '../types';

interface AdTabsProps {
  activeTab: TabStatus;
  onTabChange: (tab: TabStatus) => void;
}

const tabConfig: Record<TabStatus, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock size={16} />, color: 'yellow' },
  approved: { icon: <CheckCircle size={16} />, color: 'green' },
  rejected: { icon: <XCircle size={16} />, color: 'red' },
  suspended: { icon: <PauseCircle size={16} />, color: 'orange' },
  deleted: { icon: <Trash2 size={16} />, color: 'gray' },
  all: { icon: null, color: 'blue' },
};

export default function AdTabs({ activeTab, onTabChange }: AdTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1 flex-wrap">
      {TAB_LIST.map((tab) => {
        const config = tabConfig[tab];
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isActive
                ? `bg-${config.color}-500 text-white shadow-md`
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {config.icon}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
