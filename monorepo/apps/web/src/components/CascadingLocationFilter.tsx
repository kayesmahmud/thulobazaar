'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api';
import type {
  LocationHierarchyProvince,
  LocationHierarchyDistrict,
  LocationHierarchyMunicipality,
  LocationHierarchyArea,
} from '@/lib/locationHierarchy';

const EXPANDED_STATE_STORAGE_KEY = 'ads-location-filter-expanded';

type PersistedExpandedState = {
  provinces: number[];
  districts: number[];
  municipalities: number[];
};

const defaultExpandedState: PersistedExpandedState = {
  provinces: [],
  districts: [],
  municipalities: [],
};

const readExpandedState = (): PersistedExpandedState => {
  if (typeof window === 'undefined') {
    return defaultExpandedState;
  }

  try {
    const stored = window.sessionStorage.getItem(EXPANDED_STATE_STORAGE_KEY);
    if (!stored) {
      return defaultExpandedState;
    }

    const parsed = JSON.parse(stored);
    return {
      provinces: Array.isArray(parsed?.provinces) ? parsed.provinces : [],
      districts: Array.isArray(parsed?.districts) ? parsed.districts : [],
      municipalities: Array.isArray(parsed?.municipalities) ? parsed.municipalities : [],
    };
  } catch (error) {
    console.error('Failed to read expanded locations from storage:', error);
    return defaultExpandedState;
  }
};

const persistExpandedState = (state: PersistedExpandedState) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(EXPANDED_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist expanded locations:', error);
  }
};

type Province = LocationHierarchyProvince;
type District = LocationHierarchyDistrict;
type Municipality = LocationHierarchyMunicipality;
type Area = LocationHierarchyArea;

interface SearchResult {
  id: number;
  name: string;
  slug: string;
  type: 'province' | 'district' | 'municipality' | 'area';
  parent_id?: number | null;
  hierarchy_info?: string;
}

interface CascadingLocationFilterProps {
  onLocationSelect: (locationSlug: string | null) => void;
  selectedLocationSlug?: string | null;
  initialProvinces?: Province[];
}

export default function CascadingLocationFilter({
  onLocationSelect,
  selectedLocationSlug,
  initialProvinces,
}: CascadingLocationFilterProps) {
  const [provinces, setProvinces] = useState<Province[]>(initialProvinces || []);
  const [expandedProvinces, setExpandedProvinces] = useState<Set<number>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set());
  const [expandedMunicipalities, setExpandedMunicipalities] = useState<Set<number>>(new Set());
  const [districtsCache, setDistrictsCache] = useState<Record<number, District[]>>({});
  const [municipalitiesCache, setMunicipalitiesCache] = useState<Record<number, Municipality[]>>({});
  const [areasCache, setAreasCache] = useState<Record<number, Area[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  const hydrateCachesFromHierarchy = useCallback((hierarchy: Province[]) => {
    if (!hierarchy || hierarchy.length === 0) {
      return;
    }

    const nextDistricts: Record<number, District[]> = {};
    const nextMunicipalities: Record<number, Municipality[]> = {};
    const nextAreas: Record<number, Area[]> = {};

    hierarchy.forEach((province) => {
      if (province.districts && province.districts.length > 0) {
        nextDistricts[province.id] = province.districts;

        province.districts.forEach((district) => {
          if (district.municipalities && district.municipalities.length > 0) {
            nextMunicipalities[district.id] = district.municipalities;

            district.municipalities.forEach((municipality) => {
              if (municipality.areas && municipality.areas.length > 0) {
                nextAreas[municipality.id] = municipality.areas;
              }
            });
          }
        });
      }
    });

    setDistrictsCache(nextDistricts);
    setMunicipalitiesCache(nextMunicipalities);
    setAreasCache(nextAreas);
  }, []);

  // Restore expanded state when the component mounts
  useEffect(() => {
    const persisted = readExpandedState();
    if (persisted.provinces.length > 0) {
      setExpandedProvinces(new Set(persisted.provinces));
    }
    if (persisted.districts.length > 0) {
      setExpandedDistricts(new Set(persisted.districts));
    }
    if (persisted.municipalities.length > 0) {
      setExpandedMunicipalities(new Set(persisted.municipalities));
    }
  }, []);

  // Persist expanded IDs so the UI survives navigation
  useEffect(() => {
    persistExpandedState({
      provinces: Array.from(expandedProvinces),
      districts: Array.from(expandedDistricts),
      municipalities: Array.from(expandedMunicipalities),
    });
  }, [expandedProvinces, expandedDistricts, expandedMunicipalities]);

  const fetchProvinces = useCallback(async () => {
    if (initialProvinces && initialProvinces.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.getHierarchy();
      if (response.success && response.data) {
        const fetched = response.data as Province[];
        setProvinces(fetched);
        hydrateCachesFromHierarchy(fetched);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setIsLoading(false);
    }
  }, [hydrateCachesFromHierarchy, initialProvinces]);

  const fetchDistricts = useCallback(async (provinceId: number) => {
    if (districtsCache[provinceId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: provinceId });
      if (response.success && response.data) {
        setDistrictsCache(prev => ({
          ...prev,
          [provinceId]: response.data as District[]
        }));
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [districtsCache]);

  const fetchMunicipalities = useCallback(async (districtId: number) => {
    if (municipalitiesCache[districtId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: districtId });
      if (response.success && response.data) {
        setMunicipalitiesCache(prev => ({
          ...prev,
          [districtId]: response.data as Municipality[]
        }));
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [municipalitiesCache]);

  const fetchAreas = useCallback(async (municipalityId: number) => {
    if (areasCache[municipalityId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: municipalityId });
      if (response.success && response.data) {
        setAreasCache(prev => ({
          ...prev,
          [municipalityId]: response.data as Area[]
        }));
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [areasCache]);

  useEffect(() => {
    if (initialProvinces && initialProvinces.length > 0) {
      setProvinces(initialProvinces);
      hydrateCachesFromHierarchy(initialProvinces);
    } else {
      fetchProvinces();
    }
  }, [initialProvinces, hydrateCachesFromHierarchy, fetchProvinces]);

  // Ensure children data is loaded for any restored expanded nodes
  useEffect(() => {
    expandedProvinces.forEach((provinceId) => {
      if (!districtsCache[provinceId]) {
        fetchDistricts(provinceId);
      }
    });
  }, [expandedProvinces, districtsCache, fetchDistricts]);

  useEffect(() => {
    expandedDistricts.forEach((districtId) => {
      if (!municipalitiesCache[districtId]) {
        fetchMunicipalities(districtId);
      }
    });
  }, [expandedDistricts, municipalitiesCache, fetchMunicipalities]);

  useEffect(() => {
    expandedMunicipalities.forEach((municipalityId) => {
      if (!areasCache[municipalityId]) {
        fetchAreas(municipalityId);
      }
    });
  }, [expandedMunicipalities, areasCache, fetchAreas]);

  // Get location type label with brackets
  const getLocationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      province: '(Province)',
      district: '(District)',
      municipality: '(Municipality)',
      area: '(Area)'
    };
    return labels[type] || `(${type})`;
  };

  // Search locations with debounce
  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.searchAllLocations(query.trim());
      if (response.success && response.data) {
        setSearchResults(response.data as SearchResult[]);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Handle autocomplete selection
  const handleAutocompleteSelect = (result: SearchResult) => {
    setSearchTerm(result.name);
    setShowAutocomplete(false);
    onLocationSelect(result.slug);
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProvince = async (provinceId: number) => {
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(provinceId)) {
      newExpanded.delete(provinceId);
    } else {
      newExpanded.add(provinceId);
      await fetchDistricts(provinceId);
    }
    setExpandedProvinces(newExpanded);
  };

  const toggleDistrict = async (districtId: number) => {
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(districtId)) {
      newExpanded.delete(districtId);
    } else {
      newExpanded.add(districtId);
      await fetchMunicipalities(districtId);
    }
    setExpandedDistricts(newExpanded);
  };

  const toggleMunicipality = async (municipalityId: number) => {
    const newExpanded = new Set(expandedMunicipalities);
    if (newExpanded.has(municipalityId)) {
      newExpanded.delete(municipalityId);
    } else {
      newExpanded.add(municipalityId);
      await fetchAreas(municipalityId);
    }
    setExpandedMunicipalities(newExpanded);
  };

  return (
    <div className="flex flex-col">
      {/* Search Input */}
      <div ref={searchInputRef} className="relative mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search location..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          aria-label="Search location"
          aria-autocomplete="list"
          aria-controls="location-autocomplete"
          aria-expanded={showAutocomplete}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowAutocomplete(true);
            }
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
              <div className="px-3 py-2 text-sm text-gray-600 text-center">
                Searching...
              </div>
            ) : (
              searchResults.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={selectedLocationSlug === result.slug}
                  onClick={() => handleAutocompleteSelect(result)}
                  className={`w-full px-3 py-2 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                    selectedLocationSlug === result.slug ? 'bg-indigo-50 text-primary font-semibold' : 'text-gray-800'
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
            {/* Expand/Collapse Arrow */}
            <button
              onClick={() => toggleProvince(province.id)}
              className="p-2.5 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
            >
              <span className={`text-xs inline-block transition-transform ${expandedProvinces.has(province.id) ? 'rotate-90' : 'rotate-0'}`}>
                ▶
              </span>
            </button>

            {/* Province Name */}
            <button
              onClick={() => {
                onLocationSelect(province.slug);
              }}
              className={`flex-1 flex items-center gap-2 py-2.5 px-2 pl-0 border-none cursor-pointer text-sm text-left transition-all ${
                selectedLocationSlug === province.slug
                  ? 'bg-indigo-50 text-primary font-semibold'
                  : 'bg-transparent text-gray-800 font-medium hover:bg-gray-50'
              }`}
            >
              <span>{province.name}</span>
            </button>
          </div>

          {/* Districts - Collapsible */}
          {expandedProvinces.has(province.id) && districtsCache[province.id] && (
            <div>
              {districtsCache[province.id].map((district) => (
                <div key={district.id}>
                  {/* District */}
                  <div className="flex items-center border-t border-gray-100">
                    {/* Expand/Collapse Arrow */}
                    <button
                      onClick={() => toggleDistrict(district.id)}
                      className="p-2.5 pl-6 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
                    >
                      <span className={`text-xs inline-block transition-transform ${expandedDistricts.has(district.id) ? 'rotate-90' : 'rotate-0'}`}>
                        ▶
                      </span>
                    </button>

                    {/* District Name */}
                    <button
                      onClick={() => {
                        onLocationSelect(district.slug);
                      }}
                      className={`flex-1 flex items-center gap-2 py-2 px-2 pl-0 border-none cursor-pointer text-[0.8125rem] text-left transition-all ${
                        selectedLocationSlug === district.slug
                          ? 'bg-indigo-50 text-primary font-semibold'
                          : 'bg-transparent text-gray-600 font-normal hover:bg-gray-50 hover:text-gray-800'
                      }`}
                    >
                      <span>{district.name}</span>
                    </button>
                  </div>

                  {/* Municipalities - Collapsible */}
                  {expandedDistricts.has(district.id) && municipalitiesCache[district.id] && (
                    <div>
                      {municipalitiesCache[district.id].map((municipality) => (
                        <div key={municipality.id}>
                          {/* Municipality */}
                          <div className="flex items-center border-t border-gray-100">
                            {/* Expand/Collapse Arrow - Always show for all municipalities */}
                            <button
                              onClick={async () => {
                                // Fetch areas if not already fetched
                                if (!areasCache[municipality.id]) {
                                  await fetchAreas(municipality.id);
                                }
                                // Then toggle expansion
                                toggleMunicipality(municipality.id);
                              }}
                              className="p-2.5 pl-12 border-none bg-transparent cursor-pointer flex items-center justify-center text-gray-500 transition-transform"
                            >
                              <span className={`text-xs inline-block transition-transform ${expandedMunicipalities.has(municipality.id) ? 'rotate-90' : 'rotate-0'}`}>
                                ▶
                              </span>
                            </button>

                            {/* Municipality Name */}
                            <button
                              onClick={() => {
                                onLocationSelect(municipality.slug);
                              }}
                              className={`flex-1 flex items-center gap-2 py-2 px-2 pl-0 border-none cursor-pointer text-[0.8125rem] text-left transition-all ${
                                selectedLocationSlug === municipality.slug
                                  ? 'bg-indigo-50 text-primary font-semibold'
                                  : 'bg-transparent text-gray-500 font-normal hover:bg-gray-50 hover:text-gray-800'
                              }`}
                            >
                              <span>{municipality.name}</span>
                            </button>
                          </div>

                          {/* Areas - Collapsible */}
                          {expandedMunicipalities.has(municipality.id) && areasCache[municipality.id] && areasCache[municipality.id].length > 0 && (
                            <div className="max-h-64 overflow-y-auto overflow-x-hidden">
                              {areasCache[municipality.id].map((area) => (
                                <button
                                  key={area.id}
                                  onClick={() => {
                                    onLocationSelect(area.slug);
                                  }}
                                  className={`w-full flex items-center gap-2 py-2 px-2 pl-20 border-none border-t border-gray-100 cursor-pointer text-[0.8125rem] text-left transition-all ${
                                    selectedLocationSlug === area.slug
                                      ? 'bg-indigo-50 text-primary font-semibold'
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
