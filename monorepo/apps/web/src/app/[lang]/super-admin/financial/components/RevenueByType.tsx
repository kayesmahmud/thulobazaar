'use client';

import { formatCurrency, type TypeRevenue } from '../types';

interface RevenueByTypeProps {
  data: TypeRevenue[];
}

export default function RevenueByType({ data }: RevenueByTypeProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Revenue by Payment Type</h3>
      </div>
      <div className="p-6">
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-4">
            {data.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 capitalize">{type.type.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-500">{type.transactions} transactions</div>
                </div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(type.revenue)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
