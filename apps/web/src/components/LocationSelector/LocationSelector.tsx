'use client';

import type { LocationSelectorProps } from './types';
import { useLocationSelector } from './useLocationSelector';
import { SelectedLocationDisplay } from './SelectedLocationDisplay';
import { LocationSearchInput } from './LocationSearchInput';
import { CascadingDropdowns } from './CascadingDropdowns';

export default function LocationSelector({
  onLocationSelect,
  label = 'Select Location',
  placeholder = 'Search location...',
  required = false,
  filterType = 'municipality'
}: LocationSelectorProps) {
  const {
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
    handleLocationSelect,
    clearSelection,
    handleSearchChange,
    handleProvinceChange,
    handleDistrictChange,
    handleMunicipalityChange,
    handleSearchFocus,
  } = useLocationSelector({ filterType, onLocationSelect });

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem'
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
          color: '#111827'
        }}>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </h3>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <SelectedLocationDisplay
          location={selectedLocation}
          onClear={clearSelection}
        />
      )}

      {/* Search Input Box */}
      <LocationSearchInput
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onFocus={handleSearchFocus}
        searchResults={searchResults}
        isSearching={isSearching}
        showAutocomplete={showAutocomplete}
        onSelect={handleLocationSelect}
        inputRef={searchInputRef}
        placeholder={placeholder}
      />

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '1rem 0',
        gap: '0.5rem'
      }}>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
      </div>

      {/* Cascading Dropdowns */}
      <CascadingDropdowns
        provinces={provinces}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
        selectedMunicipality={selectedMunicipality}
        isLoading={isLoadingHierarchy}
        onProvinceChange={handleProvinceChange}
        onDistrictChange={handleDistrictChange}
        onMunicipalityChange={handleMunicipalityChange}
      />

      <small style={{
        display: 'block',
        marginTop: '0.75rem',
        color: '#6b7280',
        fontSize: '0.75rem'
      }}>
        {filterType === 'municipality'
          ? 'Select a municipality/metropolitan city for your location'
          : 'Select any location level to filter results'}
      </small>
    </div>
  );
}
