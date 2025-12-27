'use client';

import type { StatusFilter } from '../types';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  totalEditors: number;
  activeCount: number;
  suspendedCount: number;
}

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  totalEditors,
  activeCount,
  suspendedCount,
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search editors by name or email..."
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange('all')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({totalEditors})
          </button>
          <button
            onClick={() => onStatusChange('active')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              statusFilter === 'active' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => onStatusChange('suspended')}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
              statusFilter === 'suspended' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Suspended ({suspendedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
