'use client';

import AdCard from './AdCard';
import type { Ad, TabStatus } from '../types';

interface AdsListProps {
  ads: Ad[];
  activeTab: TabStatus;
  searchTerm: string;
  lang: string;
  actions: {
    loading: boolean;
    handleApprove: (id: number) => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
    handleUnsuspend: (id: number) => Promise<void>;
    handleRestore: (id: number) => Promise<void>;
  };
  onReject: (ad: Ad) => void;
  onSuspend: (ad: Ad) => void;
  onPermanentDelete: (ad: Ad) => void;
}

export default function AdsList({
  ads,
  activeTab,
  searchTerm,
  lang,
  actions,
  onReject,
  onSuspend,
  onPermanentDelete,
}: AdsListProps) {
  if (ads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads found</h3>
        <p className="text-gray-600">
          {searchTerm
            ? 'Try adjusting your search terms'
            : `No ${activeTab === 'all' ? '' : activeTab} ads at the moment`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          lang={lang}
          actions={actions}
          onReject={onReject}
          onSuspend={onSuspend}
          onPermanentDelete={onPermanentDelete}
        />
      ))}
    </div>
  );
}
