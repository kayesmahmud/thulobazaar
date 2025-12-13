'use client';

import type { TimeRange } from '../types';
import { TIME_RANGE_OPTIONS } from '../types';

interface SecurityHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  onRefresh: () => void;
}

export default function SecurityHeader({ timeRange, onTimeRangeChange, onRefresh }: SecurityHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security & Audit</h1>
        <p className="text-gray-600 mt-1">
          Monitor login attempts, admin activities, and security events
        </p>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
