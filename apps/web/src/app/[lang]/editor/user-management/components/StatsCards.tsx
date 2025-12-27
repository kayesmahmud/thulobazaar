'use client';

interface StatsCardsProps {
  total: number;
  active: number;
  suspended: number;
  verified: number;
}

export default function StatsCards({ total, active, suspended, verified }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-700 mb-1">Total Users</div>
            <div className="text-3xl font-bold text-blue-900">{total}</div>
          </div>
          <div className="text-4xl">👥</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">Active Users</div>
            <div className="text-3xl font-bold text-green-900">{active}</div>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red-700 mb-1">Suspended</div>
            <div className="text-3xl font-bold text-red-900">{suspended}</div>
          </div>
          <div className="text-4xl">🚫</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-purple-700 mb-1">Verified</div>
            <div className="text-3xl font-bold text-purple-900">{verified}</div>
          </div>
          <div className="text-4xl">✓</div>
        </div>
      </div>
    </div>
  );
}
