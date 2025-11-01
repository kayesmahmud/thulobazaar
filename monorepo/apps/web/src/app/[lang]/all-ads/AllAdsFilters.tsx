'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LocationSelector from '@/components/LocationSelector';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  other_categories: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  }[];
}

interface AllAdsFiltersProps {
  lang: string;
  categories: Category[];
  selectedCategory?: string; // Changed to string (slug) for SEO-friendly URLs
  selectedLocation?: number;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
}

export default function AllAdsFilters({
  lang,
  categories,
  selectedCategory,
  selectedLocation,
  minPrice = '',
  maxPrice = '',
  sortBy,
}: AllAdsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    location: true,
    price: true,
  });

  // Track which parent categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset page when filters change
    params.delete('page');

    router.push(`/${lang}/all-ads?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(`/${lang}/all-ads`);
  };

  // Count active filters
  const categoryCount = selectedCategory ? 1 : 0;
  const locationCount = selectedLocation ? 1 : 0;
  const priceCount = minPrice || maxPrice ? 1 : 0;
  const totalActiveFilters = categoryCount + locationCount + priceCount;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Filters
          {totalActiveFilters > 0 && (
            <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalActiveFilters}
            </span>
          )}
        </h3>
        {totalActiveFilters > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-primary text-sm font-semibold cursor-pointer border-none bg-transparent hover:text-primary-dark transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <FilterSection
        title="Categories"
        count={categoryCount}
        isExpanded={expandedSections.categories}
        onToggle={() => toggleSection('categories')}
      >
        <div className="flex flex-col">
          {categories.map((category) => (
            <div key={category.id} className="border-b border-gray-200">
              {/* Parent Category */}
              <div className="flex items-center">
                {/* Expand/Collapse Arrow */}
                {category.other_categories && category.other_categories.length > 0 && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-2.5 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
                  >
                    <span className={`text-xs inline-block transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : 'rotate-0'}`}>
                      ▶
                    </span>
                  </button>
                )}

                {/* Category Name */}
                <button
                  onClick={() => {
                    updateFilters({
                      category: selectedCategory === category.slug ? undefined : category.slug,
                    });
                  }}
                  className={`flex-1 flex items-center gap-2 py-2.5 px-2 border-none cursor-pointer text-sm text-left transition-all ${
                    category.other_categories && category.other_categories.length > 0 ? 'pl-0' : 'pl-2.5'
                  } ${
                    selectedCategory === category.slug
                      ? 'bg-indigo-50 text-primary font-semibold'
                      : 'bg-transparent text-gray-800 font-medium hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              </div>

              {/* Subcategories - Collapsible */}
              {category.other_categories && category.other_categories.length > 0 && expandedCategories.has(category.id) && (
                <div>
                  {category.other_categories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => {
                        updateFilters({
                          category: selectedCategory === subcategory.slug ? undefined : subcategory.slug,
                        });
                      }}
                      className={`w-full flex items-center gap-2 py-2 px-2 pl-10 border-none border-t border-gray-100 cursor-pointer text-[0.8125rem] text-left transition-all ${
                        selectedCategory === subcategory.slug
                          ? 'bg-indigo-50 text-primary font-semibold'
                          : 'bg-transparent text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <span>{subcategory.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection
        title="Location"
        count={locationCount}
        isExpanded={expandedSections.location}
        onToggle={() => toggleSection('location')}
      >
        <LocationSelector
          onLocationSelect={(location) => {
            updateFilters({ location: location ? location.id.toString() : undefined });
          }}
          selectedLocationId={selectedLocation || null}
          filterType="all"
          label=""
          placeholder="Search province, district, area..."
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price Range"
        count={priceCount}
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice}
            onBlur={(e) => updateFilters({ minPrice: e.target.value || undefined })}
            className="flex-1 px-2 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
            className="flex-1 px-2 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </FilterSection>
    </div>
  );
}

// Helper Component
interface FilterSectionProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, count, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="mb-4 border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-3 text-left border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
      >
        <span className="font-semibold flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="bg-primary text-white rounded-full px-2 py-0.5 text-xs font-bold">
              {count}
            </span>
          )}
        </span>
        <span
          className={`text-lg transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
        >
          ▼
        </span>
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
          isExpanded ? 'max-h-[1000px] pb-4' : 'max-h-0 pb-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
