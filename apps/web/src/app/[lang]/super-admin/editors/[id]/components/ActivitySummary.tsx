'use client';

import type { EditorDetail } from './types';

interface ActivitySummaryProps {
  timeBuckets: EditorDetail['timeBuckets'];
}

export function ActivitySummary({ timeBuckets }: ActivitySummaryProps) {
  if (!timeBuckets) return null;

  const rows = [
    { label: 'Last 24 hours', key: 'daily' as const },
    { label: 'Last 7 days', key: 'weekly' as const },
    { label: 'Last 30 days', key: 'monthly' as const },
  ];

  return (
    <div className="mb-8 bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>📅</span> Activity Summary
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="px-4 py-3 text-left">Period</th>
              <th className="px-4 py-3 text-left">Ads</th>
              <th className="px-4 py-3 text-left">Business Verifications</th>
              <th className="px-4 py-3 text-left">Individual Verifications</th>
              <th className="px-4 py-3 text-left">Support Tickets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const bucket = timeBuckets[row.key];
              return (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-gray-700">{bucket?.ads ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{bucket?.business ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{bucket?.individual ?? 0}</td>
                  <td className="px-4 py-3 text-gray-700">{bucket?.supportTickets ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
