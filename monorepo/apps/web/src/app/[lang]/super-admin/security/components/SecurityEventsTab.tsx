'use client';

import type { SecurityEvent } from '../types';
import { getActionTypeColor, getEventIcon } from '../types';

interface SecurityEventsTabProps {
  events: SecurityEvent[];
}

export default function SecurityEventsTab({ events }: SecurityEventsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Security Events</h2>
      </div>
      <div className="p-6">
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No security events in this time range
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{getEventIcon(event.actionType)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm px-2 py-1 rounded font-medium ${getActionTypeColor(event.actionType)}`}>
                        {event.actionType}
                      </span>
                      <span className="text-sm text-gray-600">by {event.adminName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()} • IP: {event.ipAddress || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
