'use client';

import type { AuditData } from '../types';
import { getActionTypeColor } from '../types';

interface ActivityLogsTabProps {
  auditData: AuditData;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function ActivityLogsTab({ auditData, currentPage, onPageChange }: ActivityLogsTabProps) {
  const { activityLogs, activityPagination } = auditData;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Admin Activity Logs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Admin</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Target</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IP Address</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activityLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{log.adminName}</div>
                    <div className="text-xs text-gray-500">{log.adminEmail}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getActionTypeColor(log.actionType)}`}>
                    {log.actionType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.targetType} #{log.targetId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {log.ipAddress || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {activityPagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {activityPagination.page} of {activityPagination.totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= activityPagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
