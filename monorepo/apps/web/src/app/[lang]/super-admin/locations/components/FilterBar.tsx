'use client';

import type { Location } from '../types';

interface FilterBarProps {
  locations: Location[];
  filterType: string;
  onFilterChange: (type: string) => void;
}

export default function FilterBar({ locations, filterType, onFilterChange }: FilterBarProps) {
  const filters = [
    { type: 'all', label: 'All', count: locations.length, activeClass: 'bg-indigo-600 text-white', inactiveClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { type: 'province', label: 'Provinces', count: locations.filter(l => l.type === 'province').length, activeClass: 'bg-purple-600 text-white', inactiveClass: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    { type: 'district', label: 'Districts', count: locations.filter(l => l.type === 'district').length, activeClass: 'bg-blue-600 text-white', inactiveClass: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { type: 'municipality', label: 'Municipalities', count: locations.filter(l => l.type === 'municipality').length, activeClass: 'bg-green-600 text-white', inactiveClass: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { type: 'area', label: 'Areas', count: locations.filter(l => l.type === 'area').length, activeClass: 'bg-yellow-600 text-white', inactiveClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map(({ type, label, count, activeClass, inactiveClass }) => (
        <button
          key={type}
          onClick={() => onFilterChange(type)}
          className={`px-4 py-2 rounded-lg ${filterType === type ? activeClass : inactiveClass}`}
        >
          {label} ({count})
        </button>
      ))}
    </div>
  );
}
