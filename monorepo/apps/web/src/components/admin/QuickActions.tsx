'use client';

interface QuickAction {
  icon: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  badge?: number;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
  theme?: 'editor' | 'superadmin';
}

// Theme-specific primary colors
const themePrimaryColors = {
  editor: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: 'bg-gradient-to-br from-emerald-500 to-green-600',
    hoverBorder: 'hover:border-emerald-300',
    hoverBg: 'hover:bg-emerald-50',
  },
  superadmin: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: 'bg-gradient-to-br from-indigo-500 to-blue-600',
    hoverBorder: 'hover:border-indigo-300',
    hoverBg: 'hover:bg-indigo-50',
  },
};

// Universal color classes (same for both themes)
const colorClasses = {
  success: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    icon: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    hoverBorder: 'hover:border-teal-300',
    hoverBg: 'hover:bg-teal-50',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-600',
    hoverBorder: 'hover:border-amber-300',
    hoverBg: 'hover:bg-amber-50',
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: 'bg-gradient-to-br from-rose-500 to-red-600',
    hoverBorder: 'hover:border-rose-300',
    hoverBg: 'hover:bg-rose-50',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    icon: 'bg-gradient-to-br from-gray-500 to-slate-600',
    hoverBorder: 'hover:border-gray-300',
    hoverBg: 'hover:bg-gray-50',
  },
};

export function QuickActions({ actions, theme = 'editor' }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {actions.map((action, index) => {
        // Get colors based on action color and theme
        const colors = action.color === 'primary' ? themePrimaryColors[theme] : colorClasses[action.color];
        return (
          <button
            key={index}
            onClick={action.onClick}
            className={`
              relative overflow-hidden
              bg-white rounded-xl
              border-2 border-gray-100 ${colors.hoverBorder}
              p-6
              transition-all duration-300 ease-out
              hover:shadow-lg hover:scale-[1.03] hover:-translate-y-1
              group
              cursor-pointer
            `}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-900 to-transparent" />
            </div>

            <div className="relative flex flex-col items-center text-center gap-4">
              {/* Icon Container */}
              <div className="relative">
                <div
                  className={`
                    w-16 h-16 rounded-2xl ${colors.icon}
                    flex items-center justify-center text-2xl
                    shadow-lg
                    transform transition-all duration-300
                    group-hover:scale-110 group-hover:rotate-6
                  `}
                >
                  <span className="text-white drop-shadow-sm">{action.icon}</span>
                </div>

                {/* Badge */}
                {action.badge !== undefined && action.badge > 0 && (
                  <div
                    className="
                      absolute -top-2 -right-2
                      min-w-[28px] h-7 px-2
                      bg-gradient-to-r from-amber-500 to-orange-500
                      text-white text-xs font-bold
                      rounded-full
                      flex items-center justify-center
                      shadow-lg shadow-orange-500/50
                      animate-pulse
                    "
                  >
                    {action.badge}
                  </div>
                )}
              </div>

              {/* Label */}
              <div>
                <span className="font-semibold text-gray-800 text-base group-hover:text-gray-900 transition-colors">
                  {action.label}
                </span>
              </div>

              {/* Hover Arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 right-0 h-1">
              <div className={`h-full ${colors.icon} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
