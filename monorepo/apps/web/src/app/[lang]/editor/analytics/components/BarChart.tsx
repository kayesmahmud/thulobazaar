'use client';

import type { BarChartData } from '../types';

interface BarChartProps {
  data: BarChartData[];
}

export default function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">{item.label}</span>
            <span className="text-gray-600">{item.value}</span>
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
