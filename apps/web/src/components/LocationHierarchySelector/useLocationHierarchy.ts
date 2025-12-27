'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Location, LocationState, SearchState } from './types';

export function useLocationHierarchy(
  selectedLocationId: number | null | undefined,
  onLocationSelect: (location: Location | null) => void
) {
  const [locationState, setLocationState] = useState<LocationState>({
    provinces: [],
    districts: [],
    municipalities: [],
    selectedProvince: null,
    selectedDistrict: null,
    selectedMunicipality: null,
    selectedLocation: null,
  });

  const [searchState, setSearchState] = useState<SearchState>({
    searchTerm: '',
    searchResults: [],
    isSearching: false,
    showAutocomplete: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Load hierarchy when selectedLocationId changes
  useEffect(() => {
    if (selectedLocationId) {
      loadLocationHierarchy(selectedLocationId);
    }
  }, [selectedLocationId]);

  const fetchProvinces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/locations?type=province`);
      const data = await response.json();

      if (data.success && data.data) {
        setLocationState((prev) => ({ ...prev, provinces: data.data }));
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const response = await fetch(`/api/locations?parent_id=${provinceId}&type=district`);
      const data = await response.json();

      if (data.success && data.data) {
        setLocationState((prev) => ({ ...prev, districts: data.data }));
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchMunicipalities = async (districtId: number) => {
    try {
      const response = await fetch(`/api/locations?parent_id=${districtId}&type=municipality`);
      const data = await response.json();

      if (data.success && data.data) {
        setLocationState((prev) => ({ ...prev, municipalities: data.data }));
      }
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    }
  };

  const loadLocationHierarchy = async (locationId: number) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`);
      const data = await response.json();

      if (!data.success || !data.data) return;

      const location = data.data;
      setLocationState((prev) => ({ ...prev, selectedLocation: location }));
      setSearchState((prev) => ({ ...prev, searchTerm: location.name }));

      if (location.type === 'province') {
        setLocationState((prev) => ({
          ...prev,
          selectedProvince: location.id,
          selectedDistrict: null,
          selectedMunicipality: null,
        }));
        await fetchDistricts(location.id);
      } else if (location.type === 'district') {
        setLocationState((prev) => ({
          ...prev,
          selectedDistrict: location.id,
          selectedMunicipality: null,
        }));

        if (location.parent_id) {
          setLocationState((prev) => ({ ...prev, selectedProvince: location.parent_id }));
          await fetchDistricts(location.parent_id);
          await fetchMunicipalities(location.id);
        }
      } else if (location.type === 'municipality') {
        setLocationState((prev) => ({ ...prev, selectedMunicipality: location.id }));

        if (location.parent_id) {
          const districtRes = await fetch(`/api/locations/${location.parent_id}`);
          const districtData = await districtRes.json();

          if (districtData.success && districtData.data) {
            const district = districtData.data;
            setLocationState((prev) => ({ ...prev, selectedDistrict: district.id }));

            if (district.parent_id) {
              setLocationState((prev) => ({ ...prev, selectedProvince: district.parent_id }));
              await fetchDistricts(district.parent_id);
              await fetchMunicipalities(district.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading location hierarchy:', error);
    }
  };

  const handleProvinceChange = async (provinceId: number | null) => {
    if (!provinceId) {
      setLocationState((prev) => ({
        ...prev,
        selectedProvince: null,
        selectedDistrict: null,
        selectedMunicipality: null,
        districts: [],
        municipalities: [],
        selectedLocation: null,
      }));
      setSearchState((prev) => ({ ...prev, searchTerm: '' }));
      onLocationSelect(null);
      return;
    }

    setLocationState((prev) => ({
      ...prev,
      selectedProvince: provinceId,
      selectedDistrict: null,
      selectedMunicipality: null,
      municipalities: [],
    }));

    const province = locationState.provinces.find((p) => p.id === provinceId);
    if (province) {
      setLocationState((prev) => ({ ...prev, selectedLocation: province }));
      setSearchState((prev) => ({ ...prev, searchTerm: province.name }));
      onLocationSelect(province);
    }

    await fetchDistricts(provinceId);
  };

  const handleDistrictChange = async (districtId: number | null) => {
    if (!districtId) {
      setLocationState((prev) => ({
        ...prev,
        selectedDistrict: null,
        selectedMunicipality: null,
        municipalities: [],
      }));

      const province = locationState.provinces.find((p) => p.id === locationState.selectedProvince);
      if (province) {
        setLocationState((prev) => ({ ...prev, selectedLocation: province }));
        setSearchState((prev) => ({ ...prev, searchTerm: province.name }));
        onLocationSelect(province);
      }
      return;
    }

    setLocationState((prev) => ({
      ...prev,
      selectedDistrict: districtId,
      selectedMunicipality: null,
    }));

    const district = locationState.districts.find((d) => d.id === districtId);
    if (district) {
      setLocationState((prev) => ({ ...prev, selectedLocation: district }));
      setSearchState((prev) => ({ ...prev, searchTerm: district.name }));
      onLocationSelect(district);
    }

    await fetchMunicipalities(districtId);
  };

  const handleMunicipalityChange = (municipalityId: number | null) => {
    if (!municipalityId) {
      setLocationState((prev) => ({ ...prev, selectedMunicipality: null }));

      const district = locationState.districts.find((d) => d.id === locationState.selectedDistrict);
      if (district) {
        setLocationState((prev) => ({ ...prev, selectedLocation: district }));
        setSearchState((prev) => ({ ...prev, searchTerm: district.name }));
        onLocationSelect(district);
      }
      return;
    }

    setLocationState((prev) => ({ ...prev, selectedMunicipality: municipalityId }));

    const municipality = locationState.municipalities.find((m) => m.id === municipalityId);
    if (municipality) {
      setLocationState((prev) => ({ ...prev, selectedLocation: municipality }));
      setSearchState((prev) => ({ ...prev, searchTerm: municipality.name }));
      onLocationSelect(municipality);
    }
  };

  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchState((prev) => ({ ...prev, searchResults: [], showAutocomplete: false }));
      return;
    }

    setSearchState((prev) => ({ ...prev, isSearching: true }));
    try {
      const response = await fetch(`/api/locations/search-all?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (data.success && data.data) {
        setSearchState((prev) => ({ ...prev, searchResults: data.data, showAutocomplete: true }));
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchState((prev) => ({ ...prev, searchResults: [] }));
    } finally {
      setSearchState((prev) => ({ ...prev, isSearching: false }));
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchState((prev) => ({ ...prev, searchTerm: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  const handleAutocompleteSelect = async (result: Location) => {
    setSearchState((prev) => ({
      ...prev,
      searchTerm: result.name,
      showAutocomplete: false,
    }));
    setLocationState((prev) => ({ ...prev, selectedLocation: result }));
    onLocationSelect(result);
    await loadLocationHierarchy(result.id);
  };

  const handleClear = () => {
    setLocationState({
      ...locationState,
      selectedProvince: null,
      selectedDistrict: null,
      selectedMunicipality: null,
      selectedLocation: null,
      districts: [],
      municipalities: [],
    });
    setSearchState((prev) => ({ ...prev, searchTerm: '' }));
    onLocationSelect(null);
  };

  const setShowAutocomplete = (show: boolean) => {
    setSearchState((prev) => ({ ...prev, showAutocomplete: show }));
  };

  return {
    ...locationState,
    ...searchState,
    isLoading,
    handleProvinceChange,
    handleDistrictChange,
    handleMunicipalityChange,
    handleSearchChange,
    handleAutocompleteSelect,
    handleClear,
    setShowAutocomplete,
  };
}
