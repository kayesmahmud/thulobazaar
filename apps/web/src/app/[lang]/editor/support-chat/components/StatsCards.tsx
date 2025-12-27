'use client';

import type { TicketStats } from './types';

interface StatsCardsProps {
  stats: TicketStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700 mb-1">Open</div>
            <div className="text-3xl font-bold text-green-900">{stats.open}</div>
          </div>
          <div className="text-4xl">📬</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-yellow-700 mb-1">In Progress</div>
            <div className="text-3xl font-bold text-yellow-900">{stats.inProgress}</div>
          </div>
          <div className="text-4xl">⏳</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red-700 mb-1">Urgent</div>
            <div className="text-3xl font-bold text-red-900">{stats.urgent}</div>
          </div>
          <div className="text-4xl">🚨</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-700 mb-1">Resolved</div>
            <div className="text-3xl font-bold text-blue-900">{stats.resolved}</div>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>
    </div>
  );
}
