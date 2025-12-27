'use client';

import type { PromotionPricing } from '../types';

interface StatsCardsProps {
  pricings: PromotionPricing[];
  groupedPricings: Record<string, PromotionPricing[]>;
}

export default function StatsCards({ pricings, groupedPricings }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total Pricing Rules</div>
        <div className="text-2xl font-bold text-gray-800">{pricings.length}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Active Rules</div>
        <div className="text-2xl font-bold text-green-600">
          {pricings.filter((p) => p.is_active).length}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Inactive Rules</div>
        <div className="text-2xl font-bold text-gray-400">
          {pricings.filter((p) => !p.is_active).length}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Promotion Types</div>
        <div className="text-2xl font-bold text-blue-600">
          {Object.keys(groupedPricings).length}
        </div>
      </div>
    </div>
  );
}
