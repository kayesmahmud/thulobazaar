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
  success: 'bg-success',
  primary: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-red-500',
};

export function RecentActivity({
  activities,
  showViewAll = true,
  viewAllHref = '#',
}: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {showViewAll && (
          <Link
            href={viewAllHref}
            className="text-primary text-sm font-medium hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`
              flex gap-4 py-4
              ${index !== activities.length - 1 ? 'border-b border-gray-100' : ''}
            `}
          >
            {/* Icon */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-white text-base flex-shrink-0
                ${typeColors[activity.type]}
              `}
            >
              {activity.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 mb-1">
                {activity.title}
              </div>
              <div className="text-sm text-gray-600 mb-1">{activity.description}</div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
