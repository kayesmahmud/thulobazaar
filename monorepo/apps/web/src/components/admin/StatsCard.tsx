'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
  theme?: 'editor' | 'superadmin';
}

// Theme-specific colors
const themeColors = {
  editor: {
    primary: {
      gradient: 'from-emerald-50 to-green-50',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      iconShadow: 'shadow-lg shadow-emerald-500/30',
      borderColor: 'border-emerald-100',
      accentColor: 'bg-emerald-500',
    },
  },
  superadmin: {
    primary: {
      gradient: 'from-indigo-50 to-blue-50',
      iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
      iconShadow: 'shadow-lg shadow-indigo-500/30',
      borderColor: 'border-indigo-100',
      accentColor: 'bg-indigo-500',
    },
  },
};

// Universal color classes (same for both themes)
const colorClasses = {
  success: {
    gradient: 'from-teal-50 to-cyan-50',
    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    iconShadow: 'shadow-lg shadow-teal-500/30',
    borderColor: 'border-teal-100',
    accentColor: 'bg-teal-500',
  },
  warning: {
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
    iconShadow: 'shadow-lg shadow-amber-500/30',
    borderColor: 'border-amber-100',
    accentColor: 'bg-amber-500',
  },
  danger: {
    gradient: 'from-rose-50 to-red-50',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    iconShadow: 'shadow-lg shadow-rose-500/30',
    borderColor: 'border-rose-100',
    accentColor: 'bg-rose-500',
  },
};

export function StatsCard({ title, value, icon, trend, color = 'primary', theme = 'editor' }: StatsCardProps) {
  // Get colors based on color type and theme
  const colors = color === 'primary' ? themeColors[theme].primary : colorClasses[color];

  return (
    <div
      className={`
        relative overflow-hidden
        bg-white rounded-2xl
        border-2 ${colors.borderColor}
        shadow-sm hover:shadow-xl
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:-translate-y-1
        group
      `}
    >
      {/* Background Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`} />

      {/* Decorative Circle */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/30 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">
              {title}
            </p>
            <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
              {value}
            </h3>
          </div>

          <div
            className={`
              w-14 h-14 rounded-xl ${colors.iconBg} ${colors.iconShadow}
              flex items-center justify-center text-2xl
              transform transition-transform duration-300
              group-hover:scale-110 group-hover:rotate-3
            `}
          >
            <span className="text-white drop-shadow-sm">{icon}</span>
          </div>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-2">
            <div
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-sm
                ${trend.isPositive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
                }
              `}
            >
              <span className="text-base">
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span>{trend.value}</span>
            </div>
            {trend.label && (
              <span className="text-sm text-gray-600 font-medium">{trend.label}</span>
            )}
          </div>
        )}

        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div className={`h-full ${colors.accentColor} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
        </div>
      </div>
    </div>
  );
}
