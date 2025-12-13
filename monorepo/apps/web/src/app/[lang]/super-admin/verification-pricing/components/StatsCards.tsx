'use client';

interface StatsCardsProps {
  total: number;
  individual: number;
  business: number;
  active: number;
}

export default function StatsCards({ total, individual, business, active }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total Pricing Rules</div>
        <div className="text-2xl font-bold text-gray-800">{total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Individual Plans</div>
        <div className="text-2xl font-bold text-blue-600">{individual}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Business Plans</div>
        <div className="text-2xl font-bold text-yellow-600">{business}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Active Rules</div>
        <div className="text-2xl font-bold text-green-600">{active}</div>
      </div>
    </div>
  );
}
