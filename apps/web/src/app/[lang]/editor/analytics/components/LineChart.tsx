'use client';

interface DailyStats {
  date: string;
  approved: number;
  rejected: number;
}

interface LineChartProps {
  data: DailyStats[];
}

export default function LineChart({ data }: LineChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => d.approved),
    ...data.map((d) => d.rejected)
  );
  const chartHeight = 200;

  return (
    <div className="relative">
      <div className="flex items-end justify-between h-[200px] px-2">
        {data.map((item, index) => {
          const approvedHeight = (item.approved / maxValue) * chartHeight;
          const rejectedHeight = (item.rejected / maxValue) * chartHeight;
          return (
            <div key={index} className="flex flex-col items-center flex-1 gap-1">
              <div className="flex items-end gap-1 w-full justify-center">
                <div
                  className="bg-green-500 rounded-t w-6 transition-all duration-500 hover:bg-green-600"
                  style={{ height: `${approvedHeight}px` }}
                  title={`Approved: ${item.approved}`}
                />
                <div
                  className="bg-red-500 rounded-t w-6 transition-all duration-500 hover:bg-red-600"
                  style={{ height: `${rejectedHeight}px` }}
                  title={`Rejected: ${item.rejected}`}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-sm text-gray-600">Rejected</span>
        </div>
      </div>
    </div>
  );
}
