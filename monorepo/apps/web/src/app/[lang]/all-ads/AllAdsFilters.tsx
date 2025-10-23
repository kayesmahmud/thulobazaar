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
    <div style={{
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Filters
          {totalActiveFilters > 0 && (
            <span style={{
              background: '#667eea',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              {totalActiveFilters}
            </span>
          )}
        </h3>
        {totalActiveFilters > 0 && (
          <button
            onClick={clearAllFilters}
            style={{
              color: '#667eea',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: 'none'
            }}
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {categories.map((category) => (
            <div key={category.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              {/* Parent Category */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Expand/Collapse Arrow */}
                {category.other_categories && category.other_categories.length > 0 && (
                  <button
                    onClick={() => toggleCategory(category.id)}
                    style={{
                      padding: '0.625rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <span style={{
                      fontSize: '0.75rem',
                      transform: expandedCategories.has(category.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                    }}>
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
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.5rem',
                    paddingLeft: category.other_categories && category.other_categories.length > 0 ? '0' : '0.625rem',
                    border: 'none',
                    background: selectedCategory === category.slug ? '#f0f0ff' : 'transparent',
                    color: selectedCategory === category.slug ? '#667eea' : '#1f2937',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: selectedCategory === category.slug ? '600' : '500',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.slug) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.slug) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.125rem' }}>{category.icon}</span>
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
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                        border: 'none',
                        borderTop: '1px solid #f3f4f6',
                        background: selectedCategory === subcategory.slug ? '#f0f0ff' : 'transparent',
                        color: selectedCategory === subcategory.slug ? '#667eea' : '#6b7280',
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                        fontWeight: selectedCategory === subcategory.slug ? '600' : '400',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== subcategory.slug) {
                          e.currentTarget.style.background = '#f9fafb';
                          e.currentTarget.style.color = '#1f2937';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== subcategory.slug) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }
                      }}
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
          label=""
          placeholder="Search province, district, area..."
          filterType="all"
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price Range"
        count={priceCount}
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection('price')}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice}
            onBlur={(e) => updateFilters({ minPrice: e.target.value || undefined })}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
          <span style={{ color: '#6b7280' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            onBlur={(e) => updateFilters({ maxPrice: e.target.value || undefined })}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
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
    <div style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 0',
          textAlign: 'left',
          border: 'none',
          background: 'none',
          cursor: 'pointer'
        }}
      >
        <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
          {count > 0 && (
            <span style={{
              background: '#667eea',
              color: 'white',
              borderRadius: '50%',
              padding: '0.125rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '700'
            }}>
              {count}
            </span>
          )}
        </span>
        <span
          style={{
            fontSize: '1.125rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </button>

      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-out',
          maxHeight: isExpanded ? '1000px' : '0',
          paddingBottom: isExpanded ? '1rem' : '0'
        }}
      >
        {children}
      </div>
    </div>
  );
}
