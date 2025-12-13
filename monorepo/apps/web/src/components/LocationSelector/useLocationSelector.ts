import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { Province, District, Municipality, Location, SearchResult } from './types';

interface UseLocationSelectorProps {
  filterType: 'municipality' | 'all';
  onLocationSelect: (location: { id: number; name: string; type: string } | null) => void;
}

export function useLocationSelector({ filterType, onLocationSelect }: UseLocationSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Dropdown selection states
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);

  // Search autocomplete states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Fetch hierarchy on mount
  useEffect(() => {
    fetchHierarchy();
  }, []);

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

  const fetchHierarchy = async () => {
    try {
      setIsLoadingHierarchy(true);
      const response = await apiClient.getHierarchy();

      if (response.success && response.data) {
        setProvinces(response.data as Province[]);
      }
    } catch (error) {
      console.error('Error fetching location hierarchy:', error);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  const fetchProvinceData = async (provinceId: number) => {
    try {
      setIsLoadingHierarchy(true);
      const response = await apiClient.getHierarchy(provinceId);

      if (response.success && response.data) {
        const hierarchyData = response.data as any[];
        const provinceData = hierarchyData.find((p: any) => p.id === provinceId);

        if (provinceData) {
          const districts = (provinceData.children || []).map((district: any) => ({
            ...district,
            municipalities: district.children || []
          }));

          const updatedProvinces = provinces.map(province =>
            province.id === provinceId
              ? { ...province, districts }
              : province
          );
          setProvinces(updatedProvinces);

          const updatedProvince = updatedProvinces.find(p => p.id === provinceId);
          if (updatedProvince) {
            setSelectedProvince(updatedProvince);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching province data:', error);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    setSearchTerm(location.name);
    setShowAutocomplete(false);

    onLocationSelect({
      id: location.id,
      name: location.name,
      type: location.type
    });
  }, [onLocationSelect]);

  const clearSelection = useCallback(() => {
    setSelectedLocation(null);
    setSearchTerm('');
    onLocationSelect(null);
  }, [onLocationSelect]);

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
        let results = response.data as SearchResult[];

        if (filterType === 'municipality') {
          results = results.filter(item => item.type === 'municipality');
        }

        setSearchResults(results);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [filterType]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  }, [searchLocations]);

  const handleProvinceChange = useCallback(async (provinceId: number) => {
    const province = provinces.find(p => p.id === provinceId);
    setSelectedProvince(province || null);
    setSelectedDistrict(null);
    setSelectedMunicipality(null);

    if (province && !province.districts) {
      await fetchProvinceData(provinceId);
    }
  }, [provinces]);

  const handleDistrictChange = useCallback((districtId: number) => {
    if (!selectedProvince?.districts) return;
    const district = selectedProvince.districts.find(d => d.id === districtId);
    setSelectedDistrict(district || null);
    setSelectedMunicipality(null);
  }, [selectedProvince]);

  const handleMunicipalityChange = useCallback((municipalityId: number) => {
    if (!selectedDistrict?.municipalities) return;
    const municipality = selectedDistrict.municipalities.find(m => m.id === municipalityId);
    setSelectedMunicipality(municipality || null);
    if (municipality) {
      handleLocationSelect(municipality);
    }
  }, [selectedDistrict, handleLocationSelect]);

  const handleSearchFocus = useCallback(() => {
    if (searchResults.length > 0) {
      setShowAutocomplete(true);
    }
  }, [searchResults.length]);

  return {
    // State
    provinces,
    isLoadingHierarchy,
    selectedLocation,
    selectedProvince,
    selectedDistrict,
    selectedMunicipality,
    searchTerm,
    searchResults,
    isSearching,
    showAutocomplete,
    searchInputRef,

    // Handlers
    handleLocationSelect,
    clearSelection,
    handleSearchChange,
    handleProvinceChange,
    handleDistrictChange,
    handleMunicipalityChange,
    handleSearchFocus,
    setShowAutocomplete,
  };
}
