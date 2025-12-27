'use client';

interface TimeFilterProps {
  monthLabel?: string;
  pendingMonth: number | null;
  setPendingMonth: (value: number | null) => void;
  pendingYear: number | null;
  setPendingYear: (value: number | null) => void;
  monthOptions: { month: number; label: string }[];
  yearOptions: { year: number; label: string }[];
  onApply: () => void;
}

export function TimeFilter({
  monthLabel,
  pendingMonth,
  setPendingMonth,
  pendingYear,
  setPendingYear,
  monthOptions,
  yearOptions,
  onApply,
}: TimeFilterProps) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Time Filter</h2>
        <p className="text-sm text-gray-600">
          View activities for a specific month or all time.
          {monthLabel ? ` Showing: ${monthLabel}` : ' Showing: All time.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={pendingMonth ?? ''}
          onChange={(e) => setPendingMonth(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
        >
          <option value="">Month</option>
          {monthOptions.map((opt) => (
            <option key={opt.month} value={opt.month}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={pendingYear ?? ''}
          onChange={(e) => setPendingYear(e.target.value ? parseInt(e.target.value, 10) : null)}
          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
        >
          <option value="">Year</option>
          {yearOptions.map((opt) => (
            <option key={opt.year} value={opt.year}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={onApply}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
