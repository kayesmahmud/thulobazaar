'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CascadingLocationFilter from '@/components/CascadingLocationFilter';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: { id: number; name: string; slug: string }[];
}

interface Location {
  id: number;
  name: string;
  type: string | null;
}

interface SearchFiltersProps {
  lang: string;
  categories: Category[];
  locations: Location[];
  selectedCategory?: string; // Changed to string (slug) for SEO-friendly URLs
  selectedLocation?: string; // Changed to string (slug) for SEO-friendly URLs
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used';
  sortBy?: string;
}

export default function SearchFilters({
  lang,
  categories,
  locations,
  selectedCategory,
  selectedLocation,
  minPrice = '',
  maxPrice = '',
  condition,
  sortBy,
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
          onLocationSelect={(locationSlug) => {
            updateFilters({ location: locationSlug || undefined });
          }}
          selectedLocationSlug={selectedLocation || null}
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

// Helper Components
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
        className="w-full flex justify-between items-center py-3 text-left"
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

interface RadioOptionProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function RadioOption({ label, checked, onChange }: RadioOptionProps) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer p-2 rounded-md transition-colors ${
        checked ? 'bg-primary-light' : 'hover:bg-gray-50'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="cursor-pointer"
      />
      <span className={`text-sm ${checked ? 'text-primary font-semibold' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );
}
