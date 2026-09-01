'use client';

import { EditorSearchBar } from '@/components/editor';
import type { StatusFilter } from '../types';

interface FilterBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (filter: StatusFilter) => void;
}

export default function FilterBar({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <EditorSearchBar value={searchTerm} onSearch={onSearch} placeholder="Search by name or email...">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="min-h-[44px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:w-64"
        >
          <option value="all">All Users</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
          <option value="verified">Verified Only (All)</option>
          <option value="individual-verified">Individual Verified Only</option>
          <option value="business-verified">Business Verified Only</option>
        </select>
      </EditorSearchBar>
    </div>
  );
}
