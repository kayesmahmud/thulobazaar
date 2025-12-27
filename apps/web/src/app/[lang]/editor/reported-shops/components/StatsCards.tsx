'use client';

import type { ReportedShop, TabCounts } from './types';

interface StatsCardsProps {
  tabCounts: TabCounts;
  filteredReports: ReportedShop[];
}

export function StatsCards({ tabCounts, filteredReports }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-orange-700 mb-1">Pending Reports</div>
            <div className="text-3xl font-bold text-orange-900">{tabCounts.pending}</div>
          </div>
          <div className="text-4xl">🏪</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red-700 mb-1">Fraud/Scam</div>
            <div className="text-3xl font-bold text-red-900">
              {filteredReports.filter((r) => r.reason.toLowerCase() === 'fraud').length}
            </div>
          </div>
          <div className="text-4xl">⚠️</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-700 mb-1">Harassment</div>
            <div className="text-3xl font-bold text-purple-900">
              {filteredReports.filter((r) => r.reason.toLowerCase() === 'harassment').length}
            </div>
          </div>
          <div className="text-4xl">🚫</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">Total Resolved</div>
            <div className="text-3xl font-bold text-green-900">{tabCounts.resolved + tabCounts.dismissed}</div>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>
    </div>
  );
}
