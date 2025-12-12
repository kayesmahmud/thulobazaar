'use client';

import type { TimeRange, PeriodMode } from './types';
import { MONTHS, YEARS } from './types';

interface PeriodSelectorProps {
  periodMode: PeriodMode;
  setPeriodMode: (mode: PeriodMode) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

export function PeriodSelector({
  periodMode,
  setPeriodMode,
  timeRange,
  setTimeRange,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
}: PeriodSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Period Mode Toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {(['quick', 'monthly', 'yearly'] as PeriodMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPeriodMode(mode)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                mode !== 'quick' ? 'border-l border-gray-300' : ''
              } ${
                periodMode === mode
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {mode === 'quick' ? 'Quick Range' : mode === 'monthly' ? 'Monthly' : 'Yearly'}
            </button>
          ))}
        </div>

        {/* Quick Range Buttons */}
        {periodMode === 'quick' && (
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        )}

        {/* Monthly Selection */}
        {periodMode === 'monthly' && (
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Yearly Selection */}
        {periodMode === 'yearly' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Period Display */}
        <div className="ml-auto text-sm text-gray-500">
          {periodMode === 'quick' && (
            <span>
              Showing last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
            </span>
          )}
          {periodMode === 'monthly' && (
            <span>
              Showing {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
          )}
          {periodMode === 'yearly' && <span>Showing full year {selectedYear}</span>}
        </div>
      </div>
    </div>
  );
}
