'use client';

import type { PieChartData } from '../types';

interface PieChartProps {
  data: PieChartData[];
}

export default function PieChart({ data }: PieChartProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-64 h-64">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.reduce((acc, item, index) => {
            const startAngle = acc.angle;
            const angle = (item.percentage / 100) * 360;
            const endAngle = startAngle + angle;
            const largeArcFlag = angle > 180 ? 1 : 0;

            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

            const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            acc.paths.push(
              <path
                key={index}
                d={path}
                fill={item.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => alert(`${item.category}: ${item.percentage}%`)}
              />
            );

            acc.angle = endAngle;
            return acc;
          }, { paths: [] as React.JSX.Element[], angle: 0 }).paths}
        </svg>
      </div>
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span className="text-sm text-gray-700">
              {item.category} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
