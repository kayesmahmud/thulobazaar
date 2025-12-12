'use client';

import { formatNumber } from './types';

interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface DatasetItem {
  data: number[];
  color: string;
  label: string;
}

// Bar Chart
export function BarChart({ data }: { data: ChartDataItem[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-700 truncate">{item.label}</span>
            <span className="text-gray-600 ml-2">{formatNumber(item.value)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${item.color} h-3 rounded-full transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Area/Line Chart
export function AreaChart({
  labels,
  datasets,
}: {
  labels: string[];
  datasets: DatasetItem[];
}) {
  const allValues = datasets.flatMap((d) => d.data);
  const maxValue = Math.max(...allValues, 1);
  const chartHeight = 200;

  return (
    <div className="relative">
      <div className="flex items-end justify-between h-[200px] px-2 gap-1">
        {labels.map((label, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="flex items-end gap-0.5 w-full justify-center h-full">
              {datasets.map((dataset, dIndex) => {
                const value = dataset.data[index] || 0;
                const height = (value / maxValue) * chartHeight;
                return (
                  <div
                    key={dIndex}
                    className={`${dataset.color} rounded-t w-full max-w-[20px] transition-all duration-300 hover:opacity-80`}
                    style={{ height: `${Math.max(height, 2)}px` }}
                    title={`${dataset.label}: ${formatNumber(value)}`}
                  />
                );
              })}
            </div>
            {index % Math.ceil(labels.length / 10) === 0 && (
              <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">{label}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        {datasets.map((dataset, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-4 h-4 ${dataset.color} rounded`} />
            <span className="text-sm text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut Chart
export function DonutChart({ data }: { data: ChartDataItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <div className="text-center text-gray-400 py-8">No data available</div>;
  }

  let currentAngle = 0;
  const paths = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const largeArcFlag = angle > 180 ? 1 : 0;

    const outerX1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const outerY1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const outerX2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const outerY2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
    const innerX1 = 50 + 25 * Math.cos((startAngle * Math.PI) / 180);
    const innerY1 = 50 + 25 * Math.sin((startAngle * Math.PI) / 180);
    const innerX2 = 50 + 25 * Math.cos((endAngle * Math.PI) / 180);
    const innerY2 = 50 + 25 * Math.sin((endAngle * Math.PI) / 180);

    const path = `
      M ${outerX1} ${outerY1}
      A 40 40 0 ${largeArcFlag} 1 ${outerX2} ${outerY2}
      L ${innerX2} ${innerY2}
      A 25 25 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}
      Z
    `;

    const colors: Record<string, string> = {
      'bg-blue-500': '#3B82F6',
      'bg-green-500': '#22C55E',
      'bg-purple-500': '#A855F7',
      'bg-orange-500': '#F97316',
      'bg-teal-500': '#14B8A6',
      'bg-pink-500': '#EC4899',
      'bg-yellow-500': '#EAB308',
      'bg-red-500': '#EF4444',
      'bg-indigo-500': '#6366F1',
      'bg-cyan-500': '#06B6D4',
    };

    return (
      <path
        key={index}
        d={path}
        fill={colors[item.color] || '#9CA3AF'}
        className="hover:opacity-80 transition-opacity cursor-pointer"
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {paths}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatNumber(total)}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${item.color}`} />
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm text-gray-500">({formatNumber(item.value)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
