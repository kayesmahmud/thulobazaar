'use client';

interface HourlyActivity {
  hour: number;
  count: number;
}

interface HeatmapProps {
  data: HourlyActivity[];
}

export default function Heatmap({ data }: HeatmapProps) {
  const maxValue = Math.max(...data.map((d) => d.count));

  return (
    <div className="grid grid-cols-12 gap-2">
      {data.map((item) => {
        const intensity = (item.count / maxValue) * 100;
        const bgColor =
          intensity > 75
            ? 'bg-teal-700'
            : intensity > 50
            ? 'bg-teal-500'
            : intensity > 25
            ? 'bg-teal-300'
            : 'bg-teal-100';
        return (
          <div
            key={item.hour}
            className={`${bgColor} rounded p-2 text-center transition-all hover:scale-110 cursor-pointer`}
            title={`${item.hour}:00 - ${item.count} activities`}
          >
            <div className="text-xs font-bold text-white">{item.hour}</div>
            <div className="text-xs text-white opacity-90">{item.count}</div>
          </div>
        );
      })}
    </div>
  );
}
