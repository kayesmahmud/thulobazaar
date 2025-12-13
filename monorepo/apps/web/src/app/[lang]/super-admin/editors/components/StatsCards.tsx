'use client';

interface StatsCardsProps {
  totalEditors: number;
  activeCount: number;
  suspendedCount: number;
  totalAdsApproved: number;
}

export default function StatsCards({ totalEditors, activeCount, suspendedCount, totalAdsApproved }: StatsCardsProps) {
  const stats = [
    { icon: '👨‍💼', value: totalEditors, label: 'Total Editors', borderColor: 'border-indigo-100', iconBg: 'from-indigo-500 to-blue-600' },
    { icon: '✅', value: activeCount, label: 'Active Editors', borderColor: 'border-emerald-100', iconBg: 'from-emerald-500 to-green-600' },
    { icon: '🚫', value: suspendedCount, label: 'Suspended', borderColor: 'border-rose-100', iconBg: 'from-rose-500 to-red-600' },
    { icon: '📊', value: totalAdsApproved, label: 'Total Ads Approved', borderColor: 'border-amber-100', iconBg: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className={`bg-white rounded-2xl shadow-md border-2 ${stat.borderColor} p-6 hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-lg`}>
              <span className="text-white text-2xl">{stat.icon}</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
          </div>
          <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
