'use client';

import Link from 'next/link';

interface Activity {
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'primary' | 'warning' | 'danger';
}

interface RecentActivityProps {
  activities: Activity[];
  showViewAll?: boolean;
  viewAllHref?: string;
}

const typeColors = {
  success: {
    bg: 'bg-gradient-to-br from-emerald-500 to-green-600',
    border: 'border-emerald-100',
    dotBg: 'bg-emerald-500',
  },
  primary: {
    bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    border: 'border-blue-100',
    dotBg: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    border: 'border-amber-100',
    dotBg: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-gradient-to-br from-rose-500 to-red-600',
    border: 'border-rose-100',
    dotBg: 'bg-rose-500',
  },
};

export function RecentActivity({
  activities,
  showViewAll = true,
  viewAllHref = '#',
}: RecentActivityProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">⚡</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
        </div>
        {showViewAll && (
          <Link
            href={viewAllHref}
            className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 hover:underline transition-colors"
          >
            View All →
          </Link>
        )}
      </div>

      {/* Activity List */}
      <div className="relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-200 via-gray-200 to-transparent" />

        <div className="space-y-4">
          {activities.map((activity, index) => {
            const colors = typeColors[activity.type];
            return (
              <div
                key={index}
                className="relative flex gap-4 group"
              >
                {/* Icon with pulse effect */}
                <div className="relative z-10">
                  <div
                    className={`
                      w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center text-white text-lg flex-shrink-0 shadow-lg
                      transform transition-all duration-200 group-hover:scale-110 group-hover:rotate-3
                    `}
                  >
                    {activity.icon}
                  </div>
                  {/* Pulse ring */}
                  <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 group-hover:opacity-20 animate-ping`} />
                </div>

                {/* Content Card */}
                <div className={`flex-1 min-w-0 p-4 rounded-xl border-2 ${colors.border} bg-white hover:shadow-md transition-all duration-200`}>
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {activity.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 line-clamp-2">{activity.description}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {activities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-500 font-medium">No recent activity</div>
          <div className="text-sm text-gray-400 mt-1">Activity will appear here</div>
        </div>
      )}
    </div>
  );
}
