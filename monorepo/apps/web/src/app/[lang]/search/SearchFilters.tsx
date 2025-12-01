'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import FilterSection from '@/components/shared/FilterSection';
import RadioOption from '@/components/shared/RadioOption';
import type { LocationHierarchyProvince } from '@/lib/locationHierarchy';
import type { CategoryWithSubcategories } from '@/lib/categories';

interface SearchFiltersProps {
  lang: string;
  categories: CategoryWithSubcategories[];
  locationHierarchy: LocationHierarchyProvince[];
  selectedCategory?: string; // Changed to string (slug) for SEO-friendly URLs
  selectedLocation?: string; // Changed to string (slug) for SEO-friendly URLs
  selectedLocationName?: string; // Location name to display in input
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
}

export default function SearchFilters({
  lang,
  categories,
  locationHierarchy,
  selectedCategory,
  selectedLocation,
  selectedLocationName,
  minPrice = '',
  maxPrice = '',
  condition,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    location: true,
    price: true,
    condition: true,
  });

  // Track expanded categories
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
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

    router.push(`/${lang}/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    // Preserve only the search query if it exists
    const query = searchParams.get('q');
    if (query) params.set('q', query);

    router.push(`/${lang}/search?${params.toString()}`);
  };

  // Count active filters
  const categoryCount = selectedCategory ? 1 : 0;
  const locationCount = selectedLocation ? 1 : 0;
  const priceCount = minPrice || maxPrice ? 1 : 0;
  const conditionCount = condition ? 1 : 0;
  const totalActiveFilters = categoryCount + locationCount + priceCount + conditionCount;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Filters
          {totalActiveFilters > 0 && (
            <span className="bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalActiveFilters}
            </span>
          )}
        </h3>
        {totalActiveFilters > 0 && (
          <button onClick={clearAllFilters} className="text-rose-500 hover:text-rose-600 transition-colors text-sm font-semibold">
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection
        title="Category"
        count={categoryCount}
        isExpanded={expandedSections.category}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-1">
          <RadioOption
            label="All Categories"
            checked={!selectedCategory}
            onChange={() => updateFilters({ category: undefined })}
          />

          {categories.map((cat) => {
            const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedCategory === cat.id;
            const isSelected = selectedCategory === cat.slug;

            return (
              <div key={cat.id}>
                {/* Main Category */}
                <div className="flex items-center gap-1">
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <span
                        className="text-xs transition-transform inline-block"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      >
                        ▶
                      </span>
                    </button>
                  )}
                  {!hasSubcategories && <span className="w-6" />}
                  <RadioOption
                    label={`${cat.icon} ${cat.name}`}
                    checked={isSelected}
                    onChange={() => updateFilters({ category: cat.slug })}
                  />
                </div>

                {/* Subcategories */}
                {hasSubcategories && isExpanded && (
                  <div className="ml-6 space-y-1 mt-1">
                    {cat.subcategories.map((subcat) => (
                      <RadioOption
                        key={subcat.id}
                        label={subcat.name}
                        checked={selectedCategory === subcat.slug}
                        onChange={() => updateFilters({ category: subcat.slug })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection
        title="Location"
        count={locationCount}
        isExpanded={expandedSections.location}
        onToggle={() => toggleSection('location')}
      >
        <CascadingLocationFilter
          onLocationSelect={(locationSlug, _locationName) => {
            updateFilters({ location: locationSlug || undefined });
          }}
          selectedLocationSlug={selectedLocation || null}
          selectedLocationName={selectedLocationName || null}
          initialProvinces={locationHierarchy}
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
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
            className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
          />
        </div>
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection
        title="Condition"
        count={conditionCount}
        isExpanded={expandedSections.condition}
        onToggle={() => toggleSection('condition')}
      >
        <div className="space-y-1">
          <RadioOption
            label="Any Condition"
            checked={!condition}
            onChange={() => updateFilters({ condition: undefined })}
          />
          <RadioOption
            label="✨ New"
            checked={condition === 'new'}
            onChange={() => updateFilters({ condition: 'new' })}
          />
          <RadioOption
            label="♻️ Used"
            checked={condition === 'used'}
            onChange={() => updateFilters({ condition: 'used' })}
          />
        </div>
      </FilterSection>
    </div>
  );
}
