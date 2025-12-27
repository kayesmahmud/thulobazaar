'use client';

import { formatCurrency } from './types';
import type { AnalyticsData } from './types';

interface RevenueTableProps {
  revenueByType: AnalyticsData['revenueByType'];
}

export function RevenueTable({ revenueByType }: RevenueTableProps) {
  if (revenueByType.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Revenue by Type</h3>
      <p className="text-sm text-gray-500 mb-6">Payment breakdown by transaction type</p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transactions
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {revenueByType.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                  {item.type || 'Other'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.count}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-600">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
