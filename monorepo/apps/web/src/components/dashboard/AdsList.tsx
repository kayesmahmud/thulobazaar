'use client';

import { EmptyAds } from '@/components/ui';
import { AdItem } from './AdItem';
import type { Ad, AdTab } from './types';

interface AdsListProps {
  userAds: Ad[];
  filteredAds: Ad[];
  activeTab: AdTab;
  lang: string;
  onTabChange: (tab: AdTab) => void;
  onDelete: (adId: number) => Promise<void>;
  onMarkAsSold: (adId: number) => Promise<void>;
}

const TAB_CONFIG: Array<{
  id: AdTab;
  label: string;
  activeGradient: string;
  activeShadow: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'active',
    label: 'Active',
    activeGradient: 'from-green-500 to-emerald-600',
    activeShadow: 'shadow-green-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'pending',
    label: 'Pending',
    activeGradient: 'from-amber-500 to-orange-600',
    activeShadow: 'shadow-amber-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'rejected',
    label: 'Rejected',
    activeGradient: 'from-red-500 to-rose-600',
    activeShadow: 'shadow-red-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  {
    id: 'sold',
    label: 'Sold',
    activeGradient: 'from-indigo-500 to-purple-600',
    activeShadow: 'shadow-indigo-500/30',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

function getAdCountByStatus(ads: Ad[], status: AdTab): number {
  return ads.filter((ad) => ad.status === status).length;
}

export function AdsList({
  userAds,
  filteredAds,
  activeTab,
  lang,
  onTabChange,
  onDelete,
  onMarkAsSold,
}: AdsListProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header Section */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">My Listings</h2>
            <p className="text-gray-600">Manage and track all your advertisements</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-medium">{userAds.length} Total Ads</span>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow-lg ${tab.activeShadow}`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label} ({getAdCountByStatus(userAds, tab.id)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ads Grid */}
      <div className="p-6">
        {filteredAds.length === 0 ? (
          <EmptyAds lang={lang} />
        ) : (
          <div className="space-y-4">
            {filteredAds.map((ad) => (
              <AdItem
                key={ad.id}
                ad={ad}
                lang={lang}
                onDelete={onDelete}
                onMarkAsSold={onMarkAsSold}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
