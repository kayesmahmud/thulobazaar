'use client';

import { BarChart } from './Charts';
import { CATEGORY_COLORS } from './types';
import type { AnalyticsData } from './types';

interface TopChartsProps {
  topCategories: AnalyticsData['topCategories'];
  topLocations: AnalyticsData['topLocations'];
}

export function TopCharts({ topCategories, topLocations }: TopChartsProps) {
  return (
    <>
      {/* Top Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Top Categories</h3>
        <p className="text-sm text-gray-500 mb-6">Most popular categories by ad count</p>
        <BarChart
          data={topCategories.map((cat, index) => ({
            label: cat.name,
            value: cat.adCount,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
          }))}
        />
      </div>

      {/* Top Locations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Top Locations</h3>
        <p className="text-sm text-gray-500 mb-6">Most active locations by ad count</p>
        <BarChart
          data={topLocations.map((loc, index) => ({
            label: loc.name,
            value: loc.adCount,
            color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? 'bg-gray-500',
          }))}
        />
      </div>
    </>
  );
}
