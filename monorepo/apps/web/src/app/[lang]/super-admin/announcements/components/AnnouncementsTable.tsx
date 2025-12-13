'use client';

import type { Announcement } from './types';
import { AUDIENCE_LABELS, AUDIENCE_COLORS, formatDate } from './types';

interface AnnouncementsTableProps {
  announcements: Announcement[];
  onViewDetails: (announcement: Announcement) => void;
  onToggleActive: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
}

export function AnnouncementsTable({
  announcements,
  onViewDetails,
  onToggleActive,
  onDelete,
}: AnnouncementsTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Announcement
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Target Audience
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reach / Read Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {announcements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No announcements yet. Create your first announcement to broadcast to users.
              </td>
            </tr>
          ) : (
            announcements.map((announcement) => (
              <tr key={announcement.id} className={!announcement.isActive ? 'opacity-60' : ''}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{announcement.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{announcement.content}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      AUDIENCE_COLORS[announcement.targetAudience] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {AUDIENCE_LABELS[announcement.targetAudience] || announcement.targetAudience}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className="font-medium">{announcement.stats.totalAudience.toLocaleString()}</span>
                    <span className="text-gray-500"> users</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {announcement.stats.readCount.toLocaleString()} read ({announcement.stats.readRate}%)
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {announcement.expiresAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expires: {formatDate(announcement.expiresAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{formatDate(announcement.createdAt)}</div>
                  <div className="text-xs">by {announcement.createdByName}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(announcement)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onToggleActive(announcement)}
                      className={`px-3 py-1 rounded text-white text-sm ${
                        announcement.isActive
                          ? 'bg-orange-500 hover:bg-orange-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {announcement.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => onDelete(announcement.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
