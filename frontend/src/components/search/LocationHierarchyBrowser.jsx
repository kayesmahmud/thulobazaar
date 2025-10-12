import { useState, useEffect, useCallback, useRef } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';
import axios from 'axios';

function LocationHierarchyBrowser({ onLocationSelect }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [expandedProvince, setExpandedProvince] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [expandedMunicipality, setExpandedMunicipality] = useState(null);
  const [expandedWard, setExpandedWard] = useState({});
  const [isLoadingProvince, setIsLoadingProvince] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // Track selected location

  // Search autocomplete states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch provinces list on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/areas/hierarchy`
      );

      if (response.data.success) {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching provinces:', error);
    }
  };

  const fetchProvinceDetails = async (provinceId) => {
    setIsLoadingProvince(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/areas/hierarchy`,
        { params: { province_id: provinceId } }
      );

      if (response.data.success) {
        setProvinceData(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching province details:', error);
    } finally {
      setIsLoadingProvince(false);
    }
  };

  const toggleProvince = (provinceId) => {
    if (expandedProvince === provinceId) {
      setExpandedProvince(null);
      setProvinceData(null);
      setExpandedDistrict(null);
      setExpandedMunicipality(null);
      setExpandedWard({});
    } else {
      setExpandedProvince(provinceId);
      setExpandedDistrict(null);
      setExpandedMunicipality(null);
      setExpandedWard({});
      fetchProvinceDetails(provinceId);
    }
  };

  const toggleDistrict = (districtId) => {
    setExpandedDistrict(expandedDistrict === districtId ? null : districtId);
    setExpandedMunicipality(null);
    setExpandedWard({});
  };

  const toggleMunicipality = (municipalityId) => {
    setExpandedMunicipality(expandedMunicipality === municipalityId ? null : municipalityId);
    setExpandedWard({});
  };

  const toggleWard = (wardKey) => {
    setExpandedWard(prev => ({
      ...prev,
      [wardKey]: !prev[wardKey]
    }));
  };

  // Handle selection at any level
  const handleProvinceSelect = (province) => {
    const selection = {
      type: 'province',
      id: province.id,
      name: province.name
    };
    setSelectedLocation(selection);
    if (onLocationSelect) {
      onLocationSelect(selection);
    }
  };

  const handleDistrictSelect = (district) => {
    const selection = {
      type: 'district',
      id: district.id,
      name: district.name
    };
    setSelectedLocation(selection);
    if (onLocationSelect) {
      onLocationSelect(selection);
    }
  };

  const handleMunicipalitySelect = (municipality) => {
    const selection = {
      type: 'municipality',
      id: municipality.id,
      name: municipality.name
    };
    setSelectedLocation(selection);
    if (onLocationSelect) {
      onLocationSelect(selection);
    }
  };

  const handleWardSelect = (ward, municipalityId) => {
    const selection = {
      type: 'ward',
      ward_number: ward.ward_number,
      municipality_id: municipalityId,
      name: `Ward ${ward.ward_number}`
    };
    setSelectedLocation(selection);
    if (onLocationSelect) {
      onLocationSelect(selection);
    }
  };

  const handleAreaSelect = (area) => {
    const selection = {
      type: 'area',
      id: area.id,
      name: area.name
    };
    setSelectedLocation(selection);
    if (onLocationSelect) {
      onLocationSelect(selection);
    }
  };

  const isLocationSelected = (type, id, wardNumber, municipalityId) => {
    if (!selectedLocation) return false;
    if (selectedLocation.type !== type) return false;

    switch (type) {
      case 'province':
      case 'district':
      case 'municipality':
      case 'area':
        return selectedLocation.id === id;
      case 'ward':
        return selectedLocation.ward_number === wardNumber &&
               selectedLocation.municipality_id === municipalityId;
      default:
        return false;
    }
  };

  // Search locations with debounce
  const searchLocations = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/locations/search-all`,
        { params: { q: query.trim() } }
      );

      if (response.data.success) {
        setSearchResults(response.data.data);
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
  const handleSearchChange = (e) => {
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
  const handleAutocompleteSelect = (result) => {
    console.log('🔍 Selected from autocomplete:', result);

    // Update search input
    setSearchTerm(result.name);
    setShowAutocomplete(false);

    // Build selection object based on type
    const selection = {
      type: result.type,
      id: result.id,
      name: result.name
    };

    // Add additional fields for ward type
    if (result.type === 'ward') {
      selection.ward_number = result.ward_number;
      selection.municipality_id = result.municipality_id;
    }

    // Update selected location
    setSelectedLocation(selection);

    // Notify parent component
    if (onLocationSelect) {
      onLocationSelect(selection);
    }

    // TODO: Auto-expand tree to show selected location
  };

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (provinces.length === 0) {
    return null;
  }

  return (
    <div style={{
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottom: `1px solid ${colors.border}`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
      }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${spacing.sm} 0`,
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <span style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            <span style={{
              fontSize: '12px',
              color: colors.text.secondary,
              transition: 'transform 0.2s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block'
            }}>
              ▶
            </span>
            📍 Browse by Location
          </span>
        </button>

        {selectedLocation && (
          <button
            onClick={() => {
              setSelectedLocation(null);
              if (onLocationSelect) {
                onLocationSelect(null);
              }
            }}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              background: colors.danger,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: typography.fontSize.xs,
              marginLeft: spacing.sm
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div style={{
          padding: spacing.sm,
          backgroundColor: colors.primaryLight,
          borderRadius: '6px',
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.primary,
          fontWeight: typography.fontWeight.semibold
        }}>
          📍 {selectedLocation.name}
        </div>
      )}

      {/* Search Input Box */}
      <div ref={searchInputRef} style={{
        marginBottom: spacing.sm,
        position: 'relative'
      }}>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search location (e.g., Thamel, Kathmandu, Ward 5)..."
          style={{
            width: '100%',
            padding: spacing.sm,
            fontSize: typography.fontSize.sm,
            border: `1px solid ${colors.border}`,
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
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}>
            {isSearching ? (
              <div style={{
                padding: spacing.md,
                textAlign: 'center',
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm
              }}>
                Searching...
              </div>
            ) : (
              searchResults.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${result.ward_number || ''}-${index}`}
                  onClick={() => handleAutocompleteSelect(result)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: 'none',
                    borderBottom: index < searchResults.length - 1 ? `1px solid ${colors.border}` : 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    marginBottom: '2px'
                  }}>
                    {result.name}
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary
                  }}>
                    {result.type === 'province' && 'Province'}
                    {result.type === 'district' && 'District'}
                    {result.type === 'municipality' && 'Municipality'}
                    {result.type === 'ward' && 'Ward'}
                    {result.type === 'area' && 'Area'}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Hierarchy */}
      <div style={{
        maxHeight: isExpanded ? '2000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out'
      }}>
        {/* Provinces */}
        {provinces.map((province) => {
          const isProvinceExpanded = expandedProvince === province.id;
          const isProvinceSelected = isLocationSelected('province', province.id);

          return (
            <div key={province.id} style={{ marginBottom: spacing.xs }}>
              {/* Province Header */}
              <div style={{
                display: 'flex',
                gap: spacing.xs
              }}>
                <button
                  onClick={() => toggleProvince(province.id)}
                  style={{
                    flex: 0,
                    padding: spacing.sm,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    color: colors.text.secondary
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    transition: 'transform 0.2s',
                    transform: isProvinceExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}>
                    ▶
                  </span>
                </button>
                <button
                  onClick={() => handleProvinceSelect(province)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.sm,
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: isProvinceSelected ? colors.primaryLight : 'transparent'
                  }}
                >
                  <span style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: isProvinceSelected ? colors.primary : colors.text.primary
                  }}>
                    {province.name}
                  </span>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary
                  }}>
                    {province.area_count || 0} areas
                  </span>
                </button>
              </div>

              {/* Districts */}
              {isProvinceExpanded && (
                <div style={{
                  marginTop: spacing.xs,
                  paddingLeft: spacing.lg
                }}>
                  {isLoadingProvince ? (
                    <div style={{ padding: spacing.md, textAlign: 'center', color: colors.text.secondary }}>
                      Loading...
                    </div>
                  ) : provinceData?.districts?.map((district) => {
                    const isDistrictExpanded = expandedDistrict === district.id;
                    const isDistrictSelected = isLocationSelected('district', district.id);

                    return (
                      <div key={district.id} style={{ marginBottom: spacing.xs }}>
                        {/* District Header */}
                        <div style={{ display: 'flex', gap: spacing.xs }}>
                          <button
                            onClick={() => toggleDistrict(district.id)}
                            style={{
                              flex: 0,
                              padding: `${spacing.xs} ${spacing.sm}`,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              color: colors.text.secondary
                            }}
                          >
                            <span style={{
                              display: 'inline-block',
                              transition: 'transform 0.2s',
                              transform: isDistrictExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}>
                              ▶
                            </span>
                          </button>
                          <button
                            onClick={() => handleDistrictSelect(district)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: `${spacing.xs} ${spacing.sm}`,
                              background: 'none',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              backgroundColor: isDistrictSelected ? colors.primaryLight : 'transparent'
                            }}
                          >
                            <span style={{
                              fontSize: typography.fontSize.sm,
                              color: isDistrictSelected ? colors.primary : colors.text.primary
                            }}>
                              {district.name}
                            </span>
                          </button>
                        </div>

                        {/* Municipalities */}
                        {isDistrictExpanded && district.municipalities && (
                          <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                            {district.municipalities.map((municipality) => {
                              const isMunicipalityExpanded = expandedMunicipality === municipality.id;
                              const isMunicipalitySelected = isLocationSelected('municipality', municipality.id);

                              return (
                                <div key={municipality.id} style={{ marginBottom: spacing.xs }}>
                                  {/* Municipality Header */}
                                  <div style={{ display: 'flex', gap: spacing.xs }}>
                                    <button
                                      onClick={() => toggleMunicipality(municipality.id)}
                                      style={{
                                        flex: 0,
                                        padding: `${spacing.xs} ${spacing.sm}`,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: colors.text.secondary
                                      }}
                                    >
                                      <span style={{
                                        display: 'inline-block',
                                        transition: 'transform 0.2s',
                                        transform: isMunicipalityExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                      }}>
                                        ▶
                                      </span>
                                    </button>
                                    <button
                                      onClick={() => handleMunicipalitySelect(municipality)}
                                      style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: `${spacing.xs} ${spacing.sm}`,
                                        background: 'none',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: isMunicipalitySelected ? colors.primaryLight : 'transparent'
                                      }}
                                    >
                                      <span style={{
                                        fontSize: typography.fontSize.sm,
                                        color: isMunicipalitySelected ? colors.primary : colors.text.primary
                                      }}>
                                        {municipality.name}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Wards */}
                                  {isMunicipalityExpanded && municipality.wards && (
                                    <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                                      {municipality.wards.map((ward) => {
                                        const wardKey = `${municipality.id}_${ward.ward_number}`;
                                        const isWardExpanded = expandedWard[wardKey];
                                        const isWardSelected = isLocationSelected('ward', null, ward.ward_number, municipality.id);

                                        return (
                                          <div key={wardKey} style={{ marginBottom: spacing.xs }}>
                                            {/* Ward Header */}
                                            <div style={{ display: 'flex', gap: spacing.xs }}>
                                              <button
                                                onClick={() => toggleWard(wardKey)}
                                                style={{
                                                  flex: 0,
                                                  padding: `${spacing.xs} ${spacing.sm}`,
                                                  background: 'none',
                                                  border: 'none',
                                                  cursor: 'pointer',
                                                  fontSize: '8px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  color: colors.text.secondary
                                                }}
                                              >
                                                <span style={{
                                                  display: 'inline-block',
                                                  transition: 'transform 0.2s',
                                                  transform: isWardExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                                                }}>
                                                  ▶
                                                </span>
                                              </button>
                                              <button
                                                onClick={() => handleWardSelect(ward, municipality.id)}
                                                style={{
                                                  flex: 1,
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  padding: `${spacing.xs} ${spacing.sm}`,
                                                  background: 'none',
                                                  border: 'none',
                                                  borderRadius: '6px',
                                                  cursor: 'pointer',
                                                  backgroundColor: isWardSelected ? colors.primaryLight : 'transparent'
                                                }}
                                              >
                                                <span style={{
                                                  fontSize: typography.fontSize.xs,
                                                  color: isWardSelected ? colors.primary : colors.text.primary
                                                }}>
                                                  Ward {ward.ward_number}
                                                </span>
                                                <span style={{
                                                  fontSize: typography.fontSize.xs,
                                                  color: colors.text.secondary
                                                }}>
                                                  {ward.areas?.length || 0} areas
                                                </span>
                                              </button>
                                            </div>

                                            {/* Areas */}
                                            {isWardExpanded && ward.areas && (
                                              <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                                                {ward.areas.map((area) => {
                                                  const isAreaSelected = isLocationSelected('area', area.id);

                                                  return (
                                                    <button
                                                      key={area.id}
                                                      onClick={() => handleAreaSelect(area)}
                                                      style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: `${spacing.xs} ${spacing.sm}`,
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        borderRadius: '6px',
                                                        backgroundColor: isAreaSelected ? colors.primaryLight : 'transparent',
                                                        marginBottom: '2px'
                                                      }}
                                                    >
                                                      <span style={{
                                                        fontSize: typography.fontSize.xs,
                                                        color: isAreaSelected ? colors.primary : colors.text.primary,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                      }}>
                                                        {area.is_popular && <span>⭐</span>}
                                                        {area.name}
                                                      </span>
                                                      {area.listing_count > 0 && (
                                                        <span style={{
                                                          backgroundColor: isAreaSelected ? colors.primary : colors.primaryLight,
                                                          color: isAreaSelected ? 'white' : colors.primary,
                                                          padding: '2px 6px',
                                                          borderRadius: '8px',
                                                          fontSize: typography.fontSize.xs,
                                                          fontWeight: typography.fontWeight.bold
                                                        }}>
                                                          {area.listing_count}
                                                        </span>
                                                      )}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LocationHierarchyBrowser;
