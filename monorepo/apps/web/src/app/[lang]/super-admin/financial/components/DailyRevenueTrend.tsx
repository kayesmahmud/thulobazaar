'use client';

import { formatCurrency, type DailyRevenue } from '../types';

interface DailyRevenueTrendProps {
  data: DailyRevenue[];
}

export default function DailyRevenueTrend({ data }: DailyRevenueTrendProps) {
  if (data.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Daily Revenue Trend (Last 30 Days)</h3>
      </div>
      <div className="p-6">
        <div className="space-y-2">
          {data.map((day, index) => {
            const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;

            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full flex items-center px-3"
                      style={{ width: `${percentage}%` }}
                    >
                      {day.revenue > 0 && (
                        <span className="text-white text-sm font-semibold">{formatCurrency(day.revenue)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-500 text-right">{day.transactions} txn</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
