'use client';

import {
  AdminTheme,
  getStatsCardPrimaryColors,
  sharedColorClasses,
} from '@/lib/themes';

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
  theme?: AdminTheme;
}

export function StatsCard({ title, value, icon, trend, color = 'primary', theme = 'editor' }: StatsCardProps) {
  // Get colors based on color type and theme
  const colors = color === 'primary'
    ? getStatsCardPrimaryColors(theme)
    : sharedColorClasses[color];

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
