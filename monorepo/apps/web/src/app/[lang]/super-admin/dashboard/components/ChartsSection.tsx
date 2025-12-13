'use client';

import { LineChart, BarChart } from '@/components/admin/charts';
import type { ChartRange } from '../types';

interface ChartsSectionProps {
  chartLabels: string[];
  revenueSeries: number[];
  userSeries: number[];
  chartLoading: boolean;
  chartRange: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}

export default function ChartsSection({
  chartLabels,
  revenueSeries,
  userSeries,
  chartLoading,
  chartRange,
  onRangeChange,
}: ChartsSectionProps) {
  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRangeChange(e.target.value as ChartRange);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">💰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Revenue Analytics</h3>
          </div>
          <select
            value={chartRange}
            onChange={handleRangeChange}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <LineChart
          labels={chartLabels}
          data={revenueSeries}
          label="Revenue (NPR)"
          color="#6366f1"
          fillColor="rgba(99, 102, 241, 0.1)"
          height={250}
          loading={chartLoading}
        />
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">📈</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">User Growth</h3>
          </div>
          <select
            value={chartRange}
            onChange={handleRangeChange}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <BarChart
          labels={chartLabels}
          data={userSeries}
          label="New Users"
          color="#6366f1"
          hoverColor="#4f46e5"
          height={250}
          loading={chartLoading}
        />
      </div>
    </div>
  );
}
