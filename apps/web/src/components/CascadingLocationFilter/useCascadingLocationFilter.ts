import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { Province, District, Municipality, Area, SearchResult, LocationCaches, ExpandedState } from './types';
import { readExpandedState, persistExpandedState } from './helpers';

interface UseCascadingLocationFilterProps {
  initialProvinces?: Province[];
  selectedLocationSlug?: string | null;
  selectedLocationName?: string | null;
}

export function useCascadingLocationFilter({
  initialProvinces,
  selectedLocationSlug,
  selectedLocationName,
}: UseCascadingLocationFilterProps) {
  const [provinces, setProvinces] = useState<Province[]>(initialProvinces || []);
  const [expanded, setExpanded] = useState<ExpandedState>({
    provinces: new Set(),
    districts: new Set(),
    municipalities: new Set(),
  });
  const [caches, setCaches] = useState<LocationCaches>({
    districts: {},
    municipalities: {},
    areas: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  // Search states
  const [searchTerm, setSearchTerm] = useState(selectedLocationName || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update search term when selected location name changes
  useEffect(() => {
    if (selectedLocationName) {
      setSearchTerm(selectedLocationName);
    } else if (!selectedLocationSlug) {
      setSearchTerm('');
    }
  }, [selectedLocationName, selectedLocationSlug]);

  // Hydrate caches from initial hierarchy data
  const hydrateCachesFromHierarchy = useCallback((hierarchy: Province[]) => {
    if (!hierarchy || hierarchy.length === 0) return;

    const nextCaches: LocationCaches = { districts: {}, municipalities: {}, areas: {} };

    hierarchy.forEach((province) => {
      if (province.districts?.length) {
        nextCaches.districts[province.id] = province.districts;

        province.districts.forEach((district) => {
          if (district.municipalities?.length) {
            nextCaches.municipalities[district.id] = district.municipalities;

            district.municipalities.forEach((municipality) => {
              if (municipality.areas?.length) {
                nextCaches.areas[municipality.id] = municipality.areas;
              }
            });
          }
        });
      }
    });

    setCaches(nextCaches);
  }, []);

  // Restore expanded state on mount
  useEffect(() => {
    const persisted = readExpandedState();
    setExpanded({
      provinces: new Set(persisted.provinces),
      districts: new Set(persisted.districts),
      municipalities: new Set(persisted.municipalities),
    });
  }, []);

  // Persist expanded state
  useEffect(() => {
    persistExpandedState({
      provinces: Array.from(expanded.provinces),
      districts: Array.from(expanded.districts),
      municipalities: Array.from(expanded.municipalities),
    });
  }, [expanded]);

  // Fetch functions
  const fetchProvinces = useCallback(async () => {
    if (initialProvinces?.length) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getHierarchy();
      if (response.success && response.data) {
        const fetched = response.data as unknown as Province[];
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
    if (caches.districts[provinceId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: provinceId });
      if (response.success && response.data) {
        setCaches(prev => ({
          ...prev,
          districts: { ...prev.districts, [provinceId]: response.data as unknown as District[] },
        }));
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [caches.districts]);

  const fetchMunicipalities = useCallback(async (districtId: number) => {
    if (caches.municipalities[districtId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: districtId });
      if (response.success && response.data) {
        setCaches(prev => ({
          ...prev,
          municipalities: { ...prev.municipalities, [districtId]: response.data as unknown as Municipality[] },
        }));
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [caches.municipalities]);

  const fetchAreas = useCallback(async (municipalityId: number) => {
    if (caches.areas[municipalityId]) return;

    try {
      setIsLoading(true);
      const response = await apiClient.getLocations({ parent_id: municipalityId });
      if (response.success && response.data) {
        setCaches(prev => ({
          ...prev,
          areas: { ...prev.areas, [municipalityId]: response.data as unknown as Area[] },
        }));
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [caches.areas]);

  // Initialize provinces
  useEffect(() => {
    if (initialProvinces?.length) {
      setProvinces(initialProvinces);
      hydrateCachesFromHierarchy(initialProvinces);
    } else {
      fetchProvinces();
    }
  }, [initialProvinces, hydrateCachesFromHierarchy, fetchProvinces]);

  // Load children for expanded nodes
  useEffect(() => {
    expanded.provinces.forEach((id) => {
      if (!caches.districts[id]) fetchDistricts(id);
    });
  }, [expanded.provinces, caches.districts, fetchDistricts]);

  useEffect(() => {
    expanded.districts.forEach((id) => {
      if (!caches.municipalities[id]) fetchMunicipalities(id);
    });
  }, [expanded.districts, caches.municipalities, fetchMunicipalities]);

  useEffect(() => {
    expanded.municipalities.forEach((id) => {
      if (!caches.areas[id]) fetchAreas(id);
    });
  }, [expanded.municipalities, caches.areas, fetchAreas]);

  // Toggle functions
  const toggleProvince = async (provinceId: number) => {
    const newProvinces = new Set(expanded.provinces);
    if (newProvinces.has(provinceId)) {
      newProvinces.delete(provinceId);
    } else {
      newProvinces.add(provinceId);
      await fetchDistricts(provinceId);
    }
    setExpanded(prev => ({ ...prev, provinces: newProvinces }));
  };

  const toggleDistrict = async (districtId: number) => {
    const newDistricts = new Set(expanded.districts);
    if (newDistricts.has(districtId)) {
      newDistricts.delete(districtId);
    } else {
      newDistricts.add(districtId);
      await fetchMunicipalities(districtId);
    }
    setExpanded(prev => ({ ...prev, districts: newDistricts }));
  };

  const toggleMunicipality = async (municipalityId: number) => {
    const newMunicipalities = new Set(expanded.municipalities);
    if (newMunicipalities.has(municipalityId)) {
      newMunicipalities.delete(municipalityId);
    } else {
      newMunicipalities.add(municipalityId);
      await fetchAreas(municipalityId);
    }
    setExpanded(prev => ({ ...prev, municipalities: newMunicipalities }));
  };

  // Search functions
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  return {
    provinces,
    expanded,
    caches,
    isLoading,
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
  };
}
