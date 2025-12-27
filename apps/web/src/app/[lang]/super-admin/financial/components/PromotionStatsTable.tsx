'use client';

import { formatCurrency, type PromotionStat } from '../types';

interface PromotionStatsTableProps {
  data: PromotionStat[];
}

export default function PromotionStatsTable({ data }: PromotionStatsTableProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Promotion Revenue</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Promotion Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Total Promotions</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Active</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((promo, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900 capitalize">{promo.promotionType}</td>
                <td className="px-6 py-4 text-gray-600">{promo.totalPromotions}</td>
                <td className="px-6 py-4 text-gray-600">{promo.activePromotions}</td>
                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(promo.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
