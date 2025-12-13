'use client';

import ReportCard from './ReportCard';
import type { ReportedAd, TabStatus } from '../types';

interface ReportsListProps {
  reports: ReportedAd[];
  loading: boolean;
  activeTab: TabStatus;
  lang: string;
  actionLoading: boolean;
  onDeleteAd: (adId: number, reason: string) => void;
  onDismissReport: (reportId: number) => void;
  onRestoreAd: (adId: number, title: string) => void;
}

export default function ReportsList({
  reports,
  loading,
  activeTab,
  lang,
  actionLoading,
  onDeleteAd,
  onDismissReport,
  onRestoreAd,
}: ReportsListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-4 animate-bounce">⏳</div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">
          {activeTab === 'pending' ? '✅' : activeTab === 'resolved' ? '🗑️' : '📋'}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {activeTab === 'pending'
            ? 'No pending reports'
            : activeTab === 'resolved'
            ? 'No deleted ads yet'
            : 'No dismissed reports'}
        </h3>
        <p className="text-gray-600">
          {activeTab === 'pending'
            ? 'All reported ads have been reviewed'
            : activeTab === 'resolved'
            ? 'Deleted ads from reports will appear here'
            : 'Dismissed reports will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard
          key={report.reportId}
          report={report}
          activeTab={activeTab}
          lang={lang}
          actionLoading={actionLoading}
          onDeleteAd={onDeleteAd}
          onDismissReport={onDismissReport}
          onRestoreAd={onRestoreAd}
        />
      ))}
    </div>
  );
}
