import { useState, useEffect, useCallback, useRef } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';
import axios from 'axios';

/**
 * Location Selector for PostAd - requires area selection
 * Similar to LocationHierarchyBrowser but optimized for posting ads
 */
function LocationSelector({ onAreaSelect, selectedAreaId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [expandedProvince, setExpandedProvince] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [expandedMunicipality, setExpandedMunicipality] = useState(null);
  const [expandedWard, setExpandedWard] = useState({});
  const [isLoadingProvince, setIsLoadingProvince] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);

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

  // Handle area selection
  const handleAreaSelect = (area) => {
    console.log('📍 Area selected for PostAd:', area);

    setSelectedArea(area);
    setSearchTerm(area.name);

    // Notify parent component
    if (onAreaSelect) {
      onAreaSelect({
        areaId: area.id,
        areaName: area.name,
        municipalityId: area.municipality_id || null,
        wardNumber: area.ward_number || null
      });
    }
  };

  // Search locations with debounce - search all location types but filter for areas
  const searchLocations = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use the search-all endpoint (searches all location types including areas)
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/locations/search-all`,
        { params: { q: query.trim() } }
      );

      if (response.data.success) {
        // Filter to only show areas for PostAd
        const areaResults = response.data.data.filter(item => item.type === 'area');
        setSearchResults(areaResults);
        setShowAutocomplete(true);
      }
    } catch (error) {
      console.error('❌ Error searching areas:', error);
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

    // Set selected area
    const areaData = {
      id: result.id,
      name: result.name,
      municipality_id: result.municipality_id,
      ward_number: result.ward_number
    };

    setSelectedArea(areaData);

    // Notify parent component
    if (onAreaSelect) {
      onAreaSelect({
        areaId: result.id,
        areaName: result.name,
        municipalityId: result.municipality_id,
        wardNumber: result.ward_number
      });
    }
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
    return <div style={{ padding: spacing.sm, color: colors.text.secondary }}>Loading locations...</div>;
  }

  return (
    <div style={{
      border: `2px solid ${colors.border}`,
      borderRadius: '8px',
      padding: spacing.md
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm
      }}>
        <h3 style={{
          margin: 0,
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary
        }}>
          Select Location (Area/Place) *
        </h3>
      </div>

      {/* Selected Area Display */}
      {selectedArea && (
        <div style={{
          padding: spacing.sm,
          backgroundColor: colors.primaryLight,
          borderRadius: '6px',
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.primary,
          fontWeight: typography.fontWeight.semibold,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>📍 {selectedArea.name}</span>
          <button
            type="button"
            onClick={() => {
              setSelectedArea(null);
              setSearchTerm('');
              if (onAreaSelect) {
                onAreaSelect(null);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              fontSize: typography.fontSize.sm,
              textDecoration: 'underline'
            }}
          >
            Clear
          </button>
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
          placeholder="Search area/place (e.g., Thamel, Samakhushi)..."
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
                  key={`${result.id}-${index}`}
                  type="button"
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
                    Area
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Browse Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing.sm,
          background: 'none',
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: spacing.sm,
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.primaryLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary
        }}>
          🗺️ Or browse all locations
        </span>
        <span style={{
          fontSize: '14px',
          color: colors.text.secondary,
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      {/* Hierarchy Browser */}
      <div style={{
        maxHeight: isExpanded ? '400px' : '0',
        overflow: isExpanded ? 'auto' : 'hidden',
        transition: 'max-height 0.3s ease-in-out'
      }}>
        {/* Provinces */}
        {provinces.map((province) => {
          const isProvinceExpanded = expandedProvince === province.id;

          return (
            <div key={province.id} style={{ marginBottom: spacing.xs }}>
              {/* Province Header */}
              <button
                type="button"
                onClick={() => toggleProvince(province.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.sm,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
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
                    display: 'inline-block',
                    transition: 'transform 0.2s',
                    transform: isProvinceExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    fontSize: '12px'
                  }}>
                    ▶
                  </span>
                  📍 {province.name}
                </span>
              </button>

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

                    return (
                      <div key={district.id} style={{ marginBottom: spacing.xs }}>
                        {/* District Header */}
                        <button
                          type="button"
                          onClick={() => toggleDistrict(district.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{
                            display: 'inline-block',
                            transition: 'transform 0.2s',
                            transform: isDistrictExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            fontSize: '10px'
                          }}>
                            ▶
                          </span>
                          <span style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.primary
                          }}>
                            {district.name}
                          </span>
                        </button>

                        {/* Municipalities */}
                        {isDistrictExpanded && district.municipalities && (
                          <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                            {district.municipalities.map((municipality) => {
                              const isMunicipalityExpanded = expandedMunicipality === municipality.id;

                              return (
                                <div key={municipality.id} style={{ marginBottom: spacing.xs }}>
                                  {/* Municipality Header */}
                                  <button
                                    type="button"
                                    onClick={() => toggleMunicipality(municipality.id)}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: spacing.xs,
                                      padding: `${spacing.xs} ${spacing.sm}`,
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                  >
                                    <span style={{
                                      display: 'inline-block',
                                      transition: 'transform 0.2s',
                                      transform: isMunicipalityExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                      fontSize: '10px'
                                    }}>
                                      ▶
                                    </span>
                                    <span style={{
                                      fontSize: typography.fontSize.sm,
                                      color: colors.text.primary
                                    }}>
                                      {municipality.name}
                                    </span>
                                  </button>

                                  {/* Wards */}
                                  {isMunicipalityExpanded && municipality.wards && (
                                    <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                                      {municipality.wards.map((ward) => {
                                        const wardKey = `${municipality.id}_${ward.ward_number}`;
                                        const isWardExpanded = expandedWard[wardKey];

                                        return (
                                          <div key={wardKey} style={{ marginBottom: spacing.xs }}>
                                            {/* Ward Header */}
                                            <button
                                              type="button"
                                              onClick={() => toggleWard(wardKey)}
                                              style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: spacing.xs,
                                                padding: `${spacing.xs} ${spacing.sm}`,
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                              }}
                                            >
                                              <span style={{
                                                display: 'inline-block',
                                                transition: 'transform 0.2s',
                                                transform: isWardExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                fontSize: '8px'
                                              }}>
                                                ▶
                                              </span>
                                              <span style={{
                                                fontSize: typography.fontSize.xs,
                                                color: colors.text.primary
                                              }}>
                                                Ward {ward.ward_number}
                                              </span>
                                            </button>

                                            {/* Areas */}
                                            {isWardExpanded && ward.areas && (
                                              <div style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                                                {ward.areas.map((area) => (
                                                  <button
                                                    key={area.id}
                                                    type="button"
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
                                                      backgroundColor: selectedArea?.id === area.id ? colors.primaryLight : 'transparent',
                                                      marginBottom: '2px',
                                                      transition: 'background-color 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (selectedArea?.id !== area.id) {
                                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                      }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (selectedArea?.id !== area.id) {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                      }
                                                    }}
                                                  >
                                                    <span style={{
                                                      fontSize: typography.fontSize.xs,
                                                      color: selectedArea?.id === area.id ? colors.primary : colors.text.primary,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: '4px'
                                                    }}>
                                                      {area.is_popular && <span>⭐</span>}
                                                      {area.name}
                                                    </span>
                                                  </button>
                                                ))}
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

      <small style={{
        display: 'block',
        marginTop: spacing.sm,
        color: colors.text.secondary,
        fontSize: typography.fontSize.xs
      }}>
        Select a specific area/place (e.g., Thamel, Samakhushi) for your ad
      </small>
    </div>
  );
}

export default LocationSelector;
