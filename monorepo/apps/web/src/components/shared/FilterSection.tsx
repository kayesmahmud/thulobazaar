import React from 'react';

interface FilterSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * Reusable collapsible filter section component
 * Used by all filter panels (AdsFilter, SearchFilters, AllAdsFilters)
 */
export default function FilterSection({ title, count, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="mb-4 border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 text-left border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span className="font-semibold flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="bg-rose-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
              {count}
            </span>
          )}
        </span>
        <span
          className="text-lg transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-normal"
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          paddingBottom: isExpanded ? '1rem' : '0',
        }}
      >
        {children}
      </div>
    </div>
  );
}
