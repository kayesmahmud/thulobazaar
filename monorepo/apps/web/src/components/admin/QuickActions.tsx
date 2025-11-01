interface QuickAction {
  icon: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  badge?: number;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-red-100 text-red-500',
  gray: 'bg-gray-100 text-gray-600',
};

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg
                     hover:border-primary/50 hover:bg-primary/5 transition-all duration-200
                     group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center text-base
                  ${colorClasses[action.color]}
                  group-hover:scale-110 transition-transform
                `}
              >
                {action.icon}
              </div>
              <span className="font-medium text-gray-800">{action.label}</span>
            </div>

            {action.badge !== undefined && action.badge > 0 && (
              <span className="bg-warning text-white text-xs font-semibold px-2 py-1 rounded-full">
                {action.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
