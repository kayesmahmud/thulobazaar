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
}

const colorClasses = {
  primary: {
    border: 'border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  success: {
    border: 'border-l-success',
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  warning: {
    border: 'border-l-warning',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
  },
  danger: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
  },
};

export function StatsCard({ title, value, icon, trend, color = 'primary' }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md p-6
        border-l-4 ${colors.border}
        relative overflow-hidden
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} ${colors.iconColor} flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 mb-2">{value}</div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1 text-sm font-medium">
          <span className={trend.isPositive ? 'text-success' : 'text-red-500'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-gray-600">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
