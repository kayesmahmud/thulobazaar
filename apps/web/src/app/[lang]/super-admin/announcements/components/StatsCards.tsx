'use client';

interface StatsCardsProps {
  total: number;
  active: number;
  totalReach: number;
  totalReads: number;
}

export function StatsCards({ total, active, totalReach, totalReads }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total Announcements</div>
        <div className="text-2xl font-bold text-gray-800">{total}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Active</div>
        <div className="text-2xl font-bold text-green-600">{active}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total Reach</div>
        <div className="text-2xl font-bold text-blue-600">{totalReach.toLocaleString()}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm text-gray-600">Total Reads</div>
        <div className="text-2xl font-bold text-purple-600">{totalReads.toLocaleString()}</div>
      </div>
    </div>
  );
}
