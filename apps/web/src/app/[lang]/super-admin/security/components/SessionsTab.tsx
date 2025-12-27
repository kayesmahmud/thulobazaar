'use client';

import type { ActiveSession } from '../types';

interface SessionsTabProps {
  sessions: ActiveSession[];
}

export default function SessionsTab({ sessions }: SessionsTabProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Active Sessions (Last 30 minutes)</h2>
      </div>
      <div className="p-6">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No active sessions in the last 30 minutes
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <div key={session.userId} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  {session.avatar ? (
                    <img
                      src={`${apiUrl}/uploads/avatars/${session.avatar}`}
                      alt={session.fullName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {session.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">{session.fullName}</div>
                    <div className="text-xs text-gray-500">{session.email}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                    {session.role}
                  </span>
                  <span>{new Date(session.lastActivity).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
