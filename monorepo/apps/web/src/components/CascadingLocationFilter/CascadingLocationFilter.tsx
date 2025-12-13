'use client';

import { useEffect, useRef } from 'react';
import type { CascadingLocationFilterProps, SearchResult } from './types';
import { useCascadingLocationFilter } from './useCascadingLocationFilter';
import { getLocationTypeLabel, buildFullPath, buildReversedPath } from './helpers';

export default function CascadingLocationFilter({
  onLocationSelect,
  selectedLocationSlug,
  selectedLocationName,
  initialProvinces,
}: CascadingLocationFilterProps) {
  const {
    provinces,
    expanded,
    caches,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    showAutocomplete,
    setShowAutocomplete,
    toggleProvince,
    toggleDistrict,
    toggleMunicipality,
    handleSearchChange,
    fetchAreas,
  } = useCascadingLocationFilter({
    initialProvinces,
    selectedLocationSlug,
    selectedLocationName,
  });

  const searchInputRef = useRef<HTMLDivElement>(null);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowAutocomplete]);

  const handleAutocompleteSelect = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowAutocomplete(false);
    const reversedPath = buildReversedPath(result);
    onLocationSelect(result.slug, result.name, reversedPath);
  };

  const selectLocation = (slug: string, name: string, fullPath: string) => {
    setSearchTerm(name);
    onLocationSelect(slug, name, fullPath);
  };

  return (
    <div className="flex flex-col">
      {/* Search Input */}
      <div ref={searchInputRef} className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search location..."
          className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
            selectedLocationSlug
              ? 'border-rose-500 text-rose-600 font-semibold bg-rose-50'
              : 'border-gray-300'
          }`}
          aria-label="Search location"
          aria-autocomplete="list"
          aria-controls="location-autocomplete"
          aria-expanded={showAutocomplete}
          onFocus={() => {
            if (searchResults.length > 0) setShowAutocomplete(true);
          }}
        />

        {/* Autocomplete Dropdown */}
        {showAutocomplete && (searchResults.length > 0 || isSearching) && (
          <div
            id="location-autocomplete"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto shadow-lg z-50"
          >
            {isSearching ? (
              <div className="px-3 py-2 text-sm text-gray-600 text-center">Searching...</div>
            ) : (
              searchResults.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedLocationSlug === result.slug}
                  onClick={() => handleAutocompleteSelect(result)}
                  className={`w-full px-3 py-2 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                    selectedLocationSlug === result.slug ? 'bg-indigo-50 text-rose-500 font-semibold' : 'text-gray-800'
                  }`}
                >
                  <div className="text-sm font-medium">{result.name}</div>
                  <div className="text-xs text-gray-500">{getLocationTypeLabel(result.type)}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-500">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Hierarchical Location Filter */}
      {provinces.map((province) => (
        <div key={province.id} className="border-b border-gray-200">
          {/* Province */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => toggleProvince(province.id)}
              className="p-2.5 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
            >
              <span className={`text-xs inline-block transition-transform ${expanded.provinces.has(province.id) ? 'rotate-90' : 'rotate-0'}`}>
                ▶
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectLocation(province.slug, province.name, buildFullPath(province.name))}
              className={`flex-1 flex items-center gap-2 py-2.5 px-2 pl-0 border-none cursor-pointer text-sm text-left transition-all ${
                selectedLocationSlug === province.slug
                  ? 'bg-indigo-50 text-rose-500 font-semibold'
                  : 'bg-transparent text-gray-800 font-medium hover:bg-gray-50'
              }`}
            >
              <span>{province.name}</span>
            </button>
          </div>

          {/* Districts */}
          {expanded.provinces.has(province.id) && caches.districts[province.id] && (
            <div>
              {(caches.districts[province.id] || []).map((district) => (
                <div key={district.id}>
                  <div className="flex items-center border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleDistrict(district.id)}
                      className="p-2.5 pl-6 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
                    >
                      <span className={`text-xs inline-block transition-transform ${expanded.districts.has(district.id) ? 'rotate-90' : 'rotate-0'}`}>
                        ▶
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selectLocation(district.slug, district.name, buildFullPath(province.name, district.name))}
                      className={`flex-1 flex items-center gap-2 py-2 px-2 pl-0 border-none cursor-pointer text-[0.8125rem] text-left transition-all ${
                        selectedLocationSlug === district.slug
                          ? 'bg-indigo-50 text-rose-500 font-semibold'
                          : 'bg-transparent text-gray-600 font-normal hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <span>{district.name}</span>
                    </button>
                  </div>

                  {/* Municipalities */}
                  {expanded.districts.has(district.id) && caches.municipalities[district.id] && (
                    <div>
                      {(caches.municipalities[district.id] || []).map((municipality) => (
                        <div key={municipality.id}>
                          <div className="flex items-center border-t border-gray-100">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!caches.areas[municipality.id]) {
                                  await fetchAreas(municipality.id);
                                }
                                toggleMunicipality(municipality.id);
                              }}
                              className="p-2.5 pl-12 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
                            >
                              <span className={`text-xs inline-block transition-transform ${expanded.municipalities.has(municipality.id) ? 'rotate-90' : 'rotate-0'}`}>
                                ▶
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => selectLocation(municipality.slug, municipality.name, buildFullPath(province.name, district.name, municipality.name))}
                              className={`flex-1 flex items-center gap-2 py-2 px-2 pl-0 border-none cursor-pointer text-[0.8125rem] text-left transition-all ${
                                selectedLocationSlug === municipality.slug
                                  ? 'bg-indigo-50 text-rose-500 font-semibold'
                                  : 'bg-transparent text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-800'
                              }`}
                            >
                              <span>{municipality.name}</span>
                            </button>
                          </div>

                          {/* Areas */}
                          {expanded.municipalities.has(municipality.id) && (caches.areas[municipality.id]?.length ?? 0) > 0 && (
                            <div className="max-h-64 overflow-y-auto overflow-x-hidden">
                              {(caches.areas[municipality.id] || []).map((area) => (
                                <button
                                  type="button"
                                  key={area.id}
                                  onClick={() => selectLocation(area.slug, area.name, buildFullPath(province.name, district.name, municipality.name, area.name))}
                                  className={`w-full flex items-center gap-2 py-2 px-2 pl-20 border-none border-t border-gray-100 cursor-pointer text-[0.8125rem] text-left transition-all ${
                                    selectedLocationSlug === area.slug
                                      ? 'bg-indigo-50 text-rose-500 font-semibold'
                                      : 'bg-transparent text-gray-400 font-normal hover:bg-gray-50 hover:text-gray-800'
                                  }`}
                                >
                                  <span>{area.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
