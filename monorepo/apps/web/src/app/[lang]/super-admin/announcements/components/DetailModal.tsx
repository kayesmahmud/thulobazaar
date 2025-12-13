'use client';

import type { AnnouncementDetail } from './types';
import { AUDIENCE_LABELS, formatDate } from './types';

interface DetailModalProps {
  announcement: AnnouncementDetail | null;
  loading: boolean;
  onClose: () => void;
}

export function DetailModal({ announcement, loading, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading details...</p>
          </div>
        ) : announcement ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{announcement.title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600">Target Audience</div>
                <div className="font-medium">{AUDIENCE_LABELS[announcement.targetAudience]}</div>
                <div className="text-2xl font-bold text-blue-700">
                  {announcement.stats.totalAudience.toLocaleString()} users
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600">Read Rate</div>
                <div className="text-2xl font-bold text-green-700">
                  {announcement.stats.readRate}%
                </div>
                <div className="text-sm text-green-600">
                  {announcement.stats.readCount.toLocaleString()} of{' '}
                  {announcement.stats.totalAudience.toLocaleString()} read
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span> {formatDate(announcement.createdAt)}
              </div>
              <div>
                <span className="text-gray-500">Expires:</span> {formatDate(announcement.expiresAt)}
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    announcement.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {announcement.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Created by:</span> {announcement.createdByName}
              </div>
            </div>

            {/* Read Timeline */}
            {announcement.timeline && announcement.timeline.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Read Activity (Last 7 Days)</h3>
                <div className="flex items-end gap-1 h-24">
                  {announcement.timeline.map((day, idx) => {
                    const maxCount = Math.max(...announcement.timeline.map((d) => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-teal-500 rounded-t"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                          title={`${day.count} reads`}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">Failed to load details</p>
        )}
      </div>
    </div>
  );
}
