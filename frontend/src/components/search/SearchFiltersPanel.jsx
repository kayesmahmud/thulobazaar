import { useState } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';
import LocationSearchInput from '../LocationSearchInput';

function SearchFiltersPanel({
  categories,
  locations,
  selectedCategory,
  selectedLocation,
  priceRange,
  condition,
  onCategoryChange,
  onLocationChange,
  onPriceRangeChange,
  onConditionChange,
  onClearFilters
}) {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    location: true,
    price: true,
    condition: true
  });

  // Track which category is expanded (for subcategories)
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Track which province and district are expanded (for locations)
  const [expandedProvince, setExpandedProvince] = useState(null);
  const [expandedDistrict, setExpandedDistrict] = useState(null);

  // Area search state
  const [areaSearchValue, setAreaSearchValue] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  const toggleProvince = (provinceId) => {
    setExpandedProvince(prev => prev === provinceId ? null : provinceId);
    setExpandedDistrict(null); // Collapse districts when switching provinces
  };

  const toggleDistrict = (districtId) => {
    setExpandedDistrict(prev => prev === districtId ? null : districtId);
  };

  // Area search handlers
  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    setAreaSearchValue(area.display_text);
    // Set the municipality as the selected location
    onLocationChange(area.municipality_id.toString());
  };

  const handleAreaClear = () => {
    setSelectedArea(null);
    setAreaSearchValue('');
  };

  const FilterSection = ({ title, section, children, count }) => (
    <div style={{ marginBottom: spacing.md, borderBottom: `1px solid ${colors.border}` }}>
      <button
        onClick={() => toggleSection(section)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${spacing.md} 0`,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: typography.fontSize.base,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          {title}
          {count > 0 && (
            <span style={{
              backgroundColor: colors.primary,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold
            }}>
              {count}
            </span>
          )}
        </span>
        <span style={{
          fontSize: '18px',
          transition: 'transform 0.2s',
          transform: expandedSections[section] ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      <div style={{
        maxHeight: expandedSections[section] ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out',
        paddingBottom: expandedSections[section] ? spacing.md : 0
      }}>
        {children}
      </div>
    </div>
  );

  // Count active filters
  const categoryCount = selectedCategory ? 1 : 0;
  const locationCount = selectedLocation ? 1 : 0;
  const priceCount = (priceRange.min || priceRange.max) ? 1 : 0;
  const conditionCount = condition ? 1 : 0;
  const totalActiveFilters = categoryCount + locationCount + priceCount + conditionCount;

  return (
    <div style={{
      ...styles.card.default
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingBottom: spacing.md,
        borderBottom: `2px solid ${colors.border}`
      }}>
        <h3 style={{
          ...styles.heading.h3,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          Filters
          {totalActiveFilters > 0 && (
            <span style={{
              backgroundColor: colors.primary,
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.bold
            }}>
              {totalActiveFilters}
            </span>
          )}
        </h3>
        {totalActiveFilters > 0 && (
          <button
            onClick={onClearFilters}
            style={{
              ...styles.link.default,
              fontSize: typography.fontSize.sm,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.primary,
              fontWeight: typography.fontWeight.semibold
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection title="Category" section="category" count={categoryCount}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              padding: spacing.sm,
              borderRadius: '6px',
              backgroundColor: !selectedCategory ? colors.primaryLight : 'transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedCategory) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <input
              type="radio"
              name="category"
              value=""
              checked={!selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{
              fontSize: typography.fontSize.sm,
              color: !selectedCategory ? colors.primary : colors.text.primary,
              fontWeight: !selectedCategory ? typography.fontWeight.semibold : typography.fontWeight.normal
            }}>
              All Categories
            </span>
          </label>

          {categories.map(cat => {
            const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = expandedCategory === cat.id;
            const isSelected = selectedCategory === String(cat.id);

            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Main Category */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    padding: spacing.sm,
                    borderRadius: '6px',
                    backgroundColor: isSelected ? colors.primaryLight : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.background.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        color: colors.text.secondary,
                        fontSize: '12px',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <span style={{
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        ▶
                      </span>
                    </button>
                  )}
                  {!hasSubcategories && <span style={{ width: '18px' }}></span>}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={isSelected}
                      onChange={(e) => onCategoryChange(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      color: isSelected ? colors.primary : colors.text.primary,
                      fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.normal
                    }}>
                      {cat.icon} {cat.name}
                    </span>
                  </label>
                </div>

                {/* Subcategories */}
                {hasSubcategories && (
                  <div style={{
                    maxHeight: isExpanded ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    paddingLeft: '32px'
                  }}>
                    {cat.subcategories.map(subcat => {
                      const isSubSelected = selectedCategory === String(subcat.id);
                      return (
                        <label
                          key={subcat.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                            cursor: 'pointer',
                            padding: `${spacing.xs} ${spacing.sm}`,
                            borderRadius: '6px',
                            backgroundColor: isSubSelected ? colors.primaryLight : 'transparent',
                            transition: 'all 0.2s',
                            marginTop: spacing.xs
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubSelected) {
                              e.currentTarget.style.backgroundColor = colors.background.secondary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubSelected) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={subcat.id}
                            checked={isSubSelected}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{
                            fontSize: typography.fontSize.sm,
                            color: isSubSelected ? colors.primary : colors.text.primary,
                            fontWeight: isSubSelected ? typography.fontWeight.semibold : typography.fontWeight.normal
                          }}>
                            {subcat.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection title="Location" section="location" count={locationCount}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {/* Area Search Input */}
          <div style={{ marginBottom: spacing.sm }}>
            <label style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              🔍 Search Area/Place
            </label>
            <LocationSearchInput
              value={areaSearchValue}
              onSelect={handleAreaSelect}
              onClear={handleAreaClear}
              placeholder="e.g., Thamel, Baluwatar..."
            />
            {selectedArea && (
              <div style={{
                marginTop: spacing.xs,
                padding: spacing.xs,
                backgroundColor: colors.primaryLight,
                border: `1px solid ${colors.primary}`,
                borderRadius: '6px',
                fontSize: typography.fontSize.xs,
                color: colors.primary
              }}>
                ✓ {selectedArea.area_name}, Ward {selectedArea.ward_number}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: `${spacing.sm} 0`,
            color: colors.text.secondary,
            fontSize: typography.fontSize.xs
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
            <span style={{ padding: `0 ${spacing.xs}` }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              padding: spacing.sm,
              borderRadius: '6px',
              backgroundColor: !selectedLocation ? colors.primaryLight : 'transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedLocation) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedLocation) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <input
              type="radio"
              name="location"
              value=""
              checked={!selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{
              fontSize: typography.fontSize.sm,
              color: !selectedLocation ? colors.primary : colors.text.primary,
              fontWeight: !selectedLocation ? typography.fontWeight.semibold : typography.fontWeight.normal
            }}>
              📍 All Locations
            </span>
          </label>

          {/* Provinces with Districts and Municipalities */}
          {locations.map(province => {
            const hasDistricts = province.districts && province.districts.length > 0;
            const isProvinceExpanded = expandedProvince === province.id;
            const isProvinceSelected = selectedLocation === String(province.id);

            return (
              <div key={province.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Province */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    padding: spacing.sm,
                    borderRadius: '6px',
                    backgroundColor: isProvinceSelected ? colors.primaryLight : 'transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProvinceSelected) {
                      e.currentTarget.style.backgroundColor = colors.background.secondary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProvinceSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {hasDistricts && (
                    <button
                      onClick={() => toggleProvince(province.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        color: colors.text.secondary,
                        fontSize: '12px',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <span style={{
                        transform: isProvinceExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}>
                        ▶
                      </span>
                    </button>
                  )}
                  {!hasDistricts && <span style={{ width: '18px' }}></span>}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    <input
                      type="radio"
                      name="location"
                      value={province.id}
                      checked={isProvinceSelected}
                      onChange={(e) => onLocationChange(e.target.value)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      color: isProvinceSelected ? colors.primary : colors.text.primary,
                      fontWeight: isProvinceSelected ? typography.fontWeight.semibold : typography.fontWeight.normal
                    }}>
                      📍 {province.name}
                    </span>
                  </label>
                </div>

                {/* Districts */}
                {hasDistricts && (
                  <div style={{
                    maxHeight: isProvinceExpanded ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    paddingLeft: '32px'
                  }}>
                    {province.districts.map(district => {
                      const hasMunicipalities = district.municipalities && district.municipalities.length > 0;
                      const isDistrictExpanded = expandedDistrict === district.id;
                      const isDistrictSelected = selectedLocation === String(district.id);

                      return (
                        <div key={district.id} style={{ marginTop: spacing.xs }}>
                          {/* District */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                              padding: `${spacing.xs} ${spacing.sm}`,
                              borderRadius: '6px',
                              backgroundColor: isDistrictSelected ? colors.primaryLight : 'transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!isDistrictSelected) {
                                e.currentTarget.style.backgroundColor = colors.background.secondary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isDistrictSelected) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {hasMunicipalities && (
                              <button
                                onClick={() => toggleDistrict(district.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: colors.text.secondary,
                                  fontSize: '12px',
                                  transition: 'transform 0.2s'
                                }}
                              >
                                <span style={{
                                  transform: isDistrictExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s'
                                }}>
                                  ▶
                                </span>
                              </button>
                            )}
                            {!hasMunicipalities && <span style={{ width: '18px' }}></span>}
                            <label
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing.sm,
                                cursor: 'pointer',
                                flex: 1
                              }}
                            >
                              <input
                                type="radio"
                                name="location"
                                value={district.id}
                                checked={isDistrictSelected}
                                onChange={(e) => onLocationChange(e.target.value)}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{
                                fontSize: typography.fontSize.sm,
                                color: isDistrictSelected ? colors.primary : colors.text.primary,
                                fontWeight: isDistrictSelected ? typography.fontWeight.semibold : typography.fontWeight.normal
                              }}>
                                {district.name}
                              </span>
                            </label>
                          </div>

                          {/* Municipalities */}
                          {hasMunicipalities && (
                            <div style={{
                              maxHeight: isDistrictExpanded ? '500px' : '0',
                              overflow: 'hidden',
                              transition: 'max-height 0.3s ease-in-out',
                              paddingLeft: '32px'
                            }}>
                              {district.municipalities.map(municipality => {
                                const isMunicipalitySelected = selectedLocation === String(municipality.id);

                                return (
                                  <label
                                    key={municipality.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: spacing.sm,
                                      cursor: 'pointer',
                                      padding: `${spacing.xs} ${spacing.sm}`,
                                      borderRadius: '6px',
                                      backgroundColor: isMunicipalitySelected ? colors.primaryLight : 'transparent',
                                      transition: 'all 0.2s',
                                      marginTop: spacing.xs
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isMunicipalitySelected) {
                                        e.currentTarget.style.backgroundColor = colors.background.secondary;
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isMunicipalitySelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name="location"
                                      value={municipality.id}
                                      checked={isMunicipalitySelected}
                                      onChange={(e) => onLocationChange(e.target.value)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{
                                      fontSize: typography.fontSize.sm,
                                      color: isMunicipalitySelected ? colors.primary : colors.text.primary,
                                      fontWeight: isMunicipalitySelected ? typography.fontWeight.semibold : typography.fontWeight.normal
                                    }}>
                                      {municipality.name}
                                    </span>
                                  </label>
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
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" section="price" count={priceCount}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            style={{
              ...styles.input.default,
              flex: 1,
              fontSize: typography.fontSize.sm
            }}
          />
          <span style={{ color: colors.text.secondary }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            style={{
              ...styles.input.default,
              flex: 1,
              fontSize: typography.fontSize.sm
            }}
          />
        </div>
      </FilterSection>

      {/* Condition Filter */}
      <FilterSection title="Condition" section="condition" count={conditionCount}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              padding: spacing.sm,
              borderRadius: '6px',
              backgroundColor: !condition ? colors.primaryLight : 'transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (condition) {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (condition) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <input
              type="radio"
              name="condition"
              value=""
              checked={!condition}
              onChange={(e) => onConditionChange(e.target.value)}
              style={{ cursor: 'pointer' }}
            />
            <span style={{
              fontSize: typography.fontSize.sm,
              color: !condition ? colors.primary : colors.text.primary,
              fontWeight: !condition ? typography.fontWeight.semibold : typography.fontWeight.normal
            }}>
              Any Condition
            </span>
          </label>

          {['new', 'used'].map(cond => (
            <label
              key={cond}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                cursor: 'pointer',
                padding: spacing.sm,
                borderRadius: '6px',
                backgroundColor: condition === cond ? colors.primaryLight : 'transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (condition !== cond) {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (condition !== cond) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <input
                type="radio"
                name="condition"
                value={cond}
                checked={condition === cond}
                onChange={(e) => onConditionChange(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{
                fontSize: typography.fontSize.sm,
                color: condition === cond ? colors.primary : colors.text.primary,
                fontWeight: condition === cond ? typography.fontWeight.semibold : typography.fontWeight.normal,
                textTransform: 'capitalize'
              }}>
                {cond === 'new' ? '✨ New' : '♻️ Used'}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

export default SearchFiltersPanel;
