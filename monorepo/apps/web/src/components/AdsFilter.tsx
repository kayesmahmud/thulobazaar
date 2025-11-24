'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import FilterSection from '@/components/shared/FilterSection';
import RadioOption from '@/components/shared/RadioOption';
import { buildAdUrl } from '@/lib/urlParser';
import type { LocationHierarchyProvince } from '@/lib/locationHierarchy';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: { id: number; name: string; slug: string }[];
}

interface AdsFilterProps {
  lang: string;
  categories: Category[];
  locationHierarchy: LocationHierarchyProvince[];
  selectedCategorySlug?: string;
  selectedLocationSlug?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
  sortBy?: string;
  searchQuery?: string;
}

export default function AdsFilter({
  lang,
  categories,
  locationHierarchy,
  selectedCategorySlug,
  selectedLocationSlug,
  minPrice = '',
  maxPrice = '',
  condition,
  sortBy,
  searchQuery = '',
}: AdsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    location: true,
    price: true,
    condition: true,
  });

  // Track expanded categories (multiple can be expanded)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(() => {
    // Auto-expand parent category if a subcategory is selected
    if (selectedCategorySlug) {
      const selectedCategory = categories.find(cat =>
        cat.slug === selectedCategorySlug ||
        cat.subcategories?.some(sub => sub.slug === selectedCategorySlug)
      );
      if (selectedCategory && selectedCategory.subcategories?.some(sub => sub.slug === selectedCategorySlug)) {
        return new Set([selectedCategory.id]);
      }
    }
    return new Set();
  });

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

  /**
   * Navigate to new URL with updated filters
   * Uses path-based URLs: /ads/{location}/{category}?query=...
   */
  const updateFilters = (updates: {
    category?: string | null;
    location?: string | null;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
    sortBy?: string;
  }) => {
    // Determine new category and location (use existing if not updating)
    const newCategory = updates.category !== undefined ? updates.category : selectedCategorySlug;
    const newLocation = updates.location !== undefined ? updates.location : selectedLocationSlug;

    // Build query parameters (everything except category and location)
    const queryParams: Record<string, string> = {};

    if (searchQuery) {
      queryParams.query = searchQuery;
    }

    if (updates.minPrice !== undefined) {
      if (updates.minPrice) queryParams.minPrice = updates.minPrice;
    } else if (minPrice) {
      queryParams.minPrice = minPrice;
    }

    if (updates.maxPrice !== undefined) {
      if (updates.maxPrice) queryParams.maxPrice = updates.maxPrice;
    } else if (maxPrice) {
      queryParams.maxPrice = maxPrice;
    }

    if (updates.condition !== undefined) {
      if (updates.condition) queryParams.condition = updates.condition;
    } else if (condition) {
      queryParams.condition = condition;
    }

    if (updates.sortBy !== undefined) {
      if (updates.sortBy) queryParams.sortBy = updates.sortBy;
    } else if (sortBy) {
      queryParams.sortBy = sortBy;
    }

    // Build new URL using helper
    const url = buildAdUrl(lang, newLocation || null, newCategory || null, queryParams);
    router.push(url);
  };

  const clearAllFilters = () => {
    // Clear all filters except search query
    const queryParams = searchQuery ? { query: searchQuery } : {};
    const url = buildAdUrl(lang, null, null, queryParams);
    router.push(url);
  };

  // Count active filters
  const categoryCount = selectedCategorySlug ? 1 : 0;
  const locationCount = selectedLocationSlug ? 1 : 0;
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
            <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {totalActiveFilters}
            </span>
          )}
        </h3>
        {totalActiveFilters > 0 && (
          <button onClick={clearAllFilters} className="link text-sm font-semibold">
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
            checked={!selectedCategorySlug}
            onChange={() => updateFilters({ category: null })}
          />

          {categories.map((cat) => {
            const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedCategories.has(cat.id);
            const isSelected = selectedCategorySlug === cat.slug;

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
                        checked={selectedCategorySlug === subcat.slug}
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
          onLocationSelect={(locationSlug) => {
            updateFilters({ location: locationSlug || null });
          }}
          selectedLocationSlug={selectedLocationSlug || null}
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
            className="input flex-1 text-sm"
          />
          <span className="text-muted">-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
            className="input flex-1 text-sm"
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
