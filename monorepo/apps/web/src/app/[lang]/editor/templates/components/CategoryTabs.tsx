'use client';

import type { CategoryType, CategoryConfig } from '../types';

interface CategoryTabsProps {
  categories: CategoryConfig[];
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1 flex-wrap">
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategoryChange(category.value as CategoryType)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeCategory === category.value
              ? 'bg-teal-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {category.icon} {category.label}
        </button>
      ))}
    </div>
  );
}
