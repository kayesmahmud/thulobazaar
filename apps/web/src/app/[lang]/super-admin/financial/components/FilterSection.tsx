'use client';

import { PERIOD_OPTIONS, type PeriodType, type FilterMode } from '../types';

interface FilterSectionProps {
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
}

export default function FilterSection({
  filterMode,
  onFilterModeChange,
  period,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onApply,
}: FilterSectionProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onFilterModeChange('preset')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filterMode === 'preset'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Quick Filters
        </button>
        <button
          onClick={() => onFilterModeChange('custom')}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            filterMode === 'custom'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Custom Date Range
        </button>
      </div>

      {/* Preset Periods */}
      {filterMode === 'preset' && (
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodChange(p.value)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                period === p.value
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom Date Range */}
      {filterMode === 'custom' && (
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={onApply}
            disabled={!startDate && !endDate}
            className={`px-8 py-2 rounded-lg font-semibold transition-all ${
              startDate || endDate
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Apply
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
              }}
              className="px-6 py-2 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
