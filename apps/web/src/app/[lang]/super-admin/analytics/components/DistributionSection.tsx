'use client';

import { DonutChart } from './Charts';
import { STATUS_COLORS, CATEGORY_COLORS } from './types';
import type { AnalyticsData } from './types';

interface DistributionSectionProps {
  adsByStatus: AnalyticsData['adsByStatus'];
  usersByType: AnalyticsData['usersByType'];
}

export function DistributionSection({ adsByStatus, usersByType }: DistributionSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ad Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ad Status Distribution</h3>
        <p className="text-sm text-gray-500 mb-6">Breakdown of ads by current status</p>
        <DonutChart
          data={adsByStatus.map((item, index) => ({
            label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
            value: item.count,
            color:
              STATUS_COLORS[item.status] ??
              CATEGORY_COLORS[index % CATEGORY_COLORS.length] ??
              'bg-gray-500',
          }))}
        />
      </div>

      {/* User Types */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">User Types</h3>
        <p className="text-sm text-gray-500 mb-6">Distribution by account type</p>
        <DonutChart
          data={usersByType.map((item, index) => ({
            label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
            value: item.count,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
          }))}
        />
      </div>
    </div>
  );
}
