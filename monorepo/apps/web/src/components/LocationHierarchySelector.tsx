'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Location Hierarchy Selector - Hierarchical dropdowns for location selection
 * Province → District → Municipality cascade
 * Includes search functionality with autocomplete
 */

interface Location {
  id: number;
  name: string;
  type: 'province' | 'district' | 'municipality';
  parent_id: number | null;
}

interface LocationHierarchySelectorProps {
  onLocationSelect: (location: Location | null) => void;
  selectedLocationId?: number | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function LocationHierarchySelector({
  onLocationSelect,
  selectedLocationId,
  label = 'Select Location',
  placeholder = 'Search province, district, municipality...',
  required = false,
}: LocationHierarchySelectorProps) {
  // State for hierarchy data
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [municipalities, setMunicipalities] = useState<Location[]>([]);

  // State for selections
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // State for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // State for UI
  const [isLoading, setIsLoading] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Load hierarchy when selectedLocationId changes (for pre-population)
  useEffect(() => {
    if (selectedLocationId) {
      loadLocationHierarchy(selectedLocationId);
    }
  }, [selectedLocationId]);

  const fetchProvinces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations?type=province`);
      const data = await response.json();

      if (data.success && data.data) {
        setProvinces(data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching provinces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDistricts = async (provinceId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations?parent_id=${provinceId}&type=district`);
      const data = await response.json();

      if (data.success && data.data) {
        setDistricts(data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching districts:', error);
    }
  };

  const fetchMunicipalities = async (districtId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations?parent_id=${districtId}&type=municipality`);
      const data = await response.json();

      if (data.success && data.data) {
        setMunicipalities(data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching municipalities:', error);
    }
  };

  // Load full hierarchy for pre-population
  const loadLocationHierarchy = async (locationId: number) => {
    try {
      console.log('📍 Loading location hierarchy for ID:', locationId);

      // Fetch the location details
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations/${locationId}`);
      const data = await response.json();

      if (!data.success || !data.data) {
        console.error('❌ Failed to fetch location details');
        return;
      }

      const location = data.data;
      console.log('📍 Loaded location:', location);

      setSelectedLocation(location);
      setSearchTerm(location.name);

      if (location.type === 'province') {
        // Selected location is a province
        setSelectedProvince(location.id);
        setSelectedDistrict(null);
        setSelectedMunicipality(null);

        // Load districts for this province
        await fetchDistricts(location.id);
      } else if (location.type === 'district') {
        // Selected location is a district - need to load province first
        setSelectedDistrict(location.id);
        setSelectedMunicipality(null);

        if (location.parent_id) {
          setSelectedProvince(location.parent_id);

          // Load districts for the province
          await fetchDistricts(location.parent_id);

          // Load municipalities for this district
          await fetchMunicipalities(location.id);
        }
      } else if (location.type === 'municipality') {
        // Selected location is a municipality - need to load province and district
        setSelectedMunicipality(location.id);

        if (location.parent_id) {
          // First get the district
          const districtRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations/${location.parent_id}`);
          const districtData = await districtRes.json();

          if (districtData.success && districtData.data) {
            const district = districtData.data;
            setSelectedDistrict(district.id);

            if (district.parent_id) {
              // Then get the province
              setSelectedProvince(district.parent_id);

              // Load districts for the province
              await fetchDistricts(district.parent_id);

              // Load municipalities for the district
              await fetchMunicipalities(district.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading location hierarchy:', error);
    }
  };

  // Handle province selection
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = parseInt(e.target.value);

    if (!provinceId) {
      // Reset all selections
      setSelectedProvince(null);
      setSelectedDistrict(null);
      setSelectedMunicipality(null);
      setDistricts([]);
      setMunicipalities([]);
      setSelectedLocation(null);
      setSearchTerm('');
      onLocationSelect(null);
      return;
    }

    setSelectedProvince(provinceId);
    setSelectedDistrict(null);
    setSelectedMunicipality(null);
    setMunicipalities([]);

    // Find province object
    const province = provinces.find(p => p.id === provinceId);
    if (province) {
      setSelectedLocation(province);
      setSearchTerm(province.name);
      onLocationSelect(province);
    }

    // Fetch districts for this province
    await fetchDistricts(provinceId);
  };

  // Handle district selection
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = parseInt(e.target.value);

    if (!districtId) {
      setSelectedDistrict(null);
      setSelectedMunicipality(null);
      setMunicipalities([]);

      // Reset to province selection
      const province = provinces.find(p => p.id === selectedProvince);
      if (province) {
        setSelectedLocation(province);
        setSearchTerm(province.name);
        onLocationSelect(province);
      }
      return;
    }

    setSelectedDistrict(districtId);
    setSelectedMunicipality(null);

    // Find district object
    const district = districts.find(d => d.id === districtId);
    if (district) {
      setSelectedLocation(district);
      setSearchTerm(district.name);
      onLocationSelect(district);
    }

    // Fetch municipalities for this district
    await fetchMunicipalities(districtId);
  };

  // Handle municipality selection
  const handleMunicipalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const municipalityId = parseInt(e.target.value);

    if (!municipalityId) {
      setSelectedMunicipality(null);

      // Reset to district selection
      const district = districts.find(d => d.id === selectedDistrict);
      if (district) {
        setSelectedLocation(district);
        setSearchTerm(district.name);
        onLocationSelect(district);
      }
      return;
    }

    setSelectedMunicipality(municipalityId);

    // Find municipality object
    const municipality = municipalities.find(m => m.id === municipalityId);
    if (municipality) {
      setSelectedLocation(municipality);
      setSearchTerm(municipality.name);
      onLocationSelect(municipality);
    }
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/locations/search-all?q=${encodeURIComponent(query.trim())}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSearchResults(data.data);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('❌ Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300); // 300ms debounce
  };

  // Handle selection from autocomplete
  const handleAutocompleteSelect = async (result: Location) => {
    console.log('🔍 Selected from autocomplete:', result);

    setSearchTerm(result.name);
    setShowAutocomplete(false);
    setSelectedLocation(result);
    onLocationSelect(result);

    // Load full hierarchy for this selection
    await loadLocationHierarchy(result.id);
  };

  // Clear selection
  const handleClear = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedMunicipality(null);
    setSelectedLocation(null);
    setSearchTerm('');
    setDistricts([]);
    setMunicipalities([]);
    onLocationSelect(null);
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

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1f2937'
        }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </h3>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#ede9fe',
          borderRadius: '6px',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          color: '#667eea',
          fontWeight: '600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>📍 {selectedLocation.name}</span>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Search Input Box */}
      <div ref={searchInputRef} style={{
        marginBottom: '0.75rem',
        position: 'relative'
      }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.875rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowAutocomplete(true);
            }
          }}
        />

        {/* Autocomplete Dropdown */}
        {showAutocomplete && (searchResults.length > 0 || isSearching) && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}>
            {isSearching ? (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Searching...
              </div>
            ) : (
              searchResults.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  type="button"
                  onClick={() => handleAutocompleteSelect(result)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: 'none',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ede9fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    {result.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    textTransform: 'capitalize'
                  }}>
                    {result.type}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hierarchical Dropdowns */}
      {isLoading ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
          Loading locations...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Province Dropdown */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Select Province
            </label>
              <select
                value={selectedProvince || ''}
                onChange={handleProvinceChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  outline: 'none',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province.id} value={province.id}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown - Only show if province selected */}
            {selectedProvince && districts.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  District
                </label>
                <select
                  value={selectedDistrict || ''}
                  onChange={handleDistrictChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Municipality Dropdown - Only show if district selected */}
            {selectedDistrict && municipalities.length > 0 && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.25rem'
                }}>
                  Municipality
                </label>
                <select
                  value={selectedMunicipality || ''}
                  onChange={handleMunicipalityChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.875rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    outline: 'none',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select Municipality</option>
                  {municipalities.map((municipality) => (
                    <option key={municipality.id} value={municipality.id}>
                      {municipality.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

      <small style={{
        display: 'block',
        marginTop: '0.75rem',
        color: '#6b7280',
        fontSize: '0.75rem'
      }}>
        Select a location or use the search box above
      </small>
    </div>
  );
}
