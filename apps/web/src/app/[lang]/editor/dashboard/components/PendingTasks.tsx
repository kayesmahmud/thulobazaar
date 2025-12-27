'use client';

export default function PendingTasks() {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">📋</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Pending Tasks</h3>
        </div>
        <a href="#" className="text-emerald-600 text-sm font-semibold hover:text-emerald-700 hover:underline transition-colors">
          View All →
        </a>
      </div>

      <div className="space-y-3">
        <TaskItem
          icon="⚠️"
          title="Urgent: Scam Report"
          description="User reported potential scam ad"
          time="25 mins ago"
          priority="High Priority"
          colorScheme="rose"
        />

        <TaskItem
          icon="🏢"
          title="Business Verification"
          description="TechNepal - Documents submitted"
          time="Waiting 2 days"
          priority="Medium"
          colorScheme="emerald"
        />

        <TaskItem
          icon="📢"
          title="Ad Review Batch"
          description="15 electronics ads pending review"
          time="Electronics"
          priority="Medium"
          colorScheme="blue"
        />
      </div>
    </div>
  );
}

interface TaskItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  priority: string;
  colorScheme: 'rose' | 'emerald' | 'blue';
}

function TaskItem({ icon, title, description, time, priority, colorScheme }: TaskItemProps) {
  const colorClasses = {
    rose: {
      bg: 'from-rose-50 to-red-50',
      border: 'border-rose-100 hover:border-rose-200',
      iconBg: 'from-rose-500 to-red-600',
      priorityBg: 'bg-rose-600',
    },
    emerald: {
      bg: 'from-emerald-50 to-green-50',
      border: 'border-emerald-100 hover:border-emerald-200',
      iconBg: 'from-emerald-500 to-green-600',
      priorityBg: 'bg-amber-500',
    },
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-100 hover:border-blue-200',
      iconBg: 'from-blue-500 to-cyan-600',
      priorityBg: 'bg-amber-500',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <div className={`group flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br ${colors.bg} border-2 ${colors.border} hover:shadow-md transition-all duration-200 cursor-pointer`}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
        <span className="text-white text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 text-sm mb-1">{title}</div>
        <div className="text-sm text-gray-600 mb-2">{description}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {time}
          </span>
          <span className={`text-xs px-2.5 py-1 ${colors.priorityBg} text-white rounded-lg font-bold shadow-sm`}>
            {priority}
          </span>
        </div>
      </div>
    </div>
  );
}
