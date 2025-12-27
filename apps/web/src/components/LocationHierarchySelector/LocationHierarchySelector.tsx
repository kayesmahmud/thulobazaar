'use client';

import { useEffect, useRef } from 'react';
import type { LocationHierarchySelectorProps, Location } from './types';
import { useLocationHierarchy } from './useLocationHierarchy';

export default function LocationHierarchySelector({
  onLocationSelect,
  selectedLocationId,
  label = 'Select Location',
  placeholder = 'Search province, district, municipality...',
  required = false,
}: LocationHierarchySelectorProps) {
  const searchInputRef = useRef<HTMLDivElement>(null);

  const {
    provinces,
    districts,
    municipalities,
    selectedProvince,
    selectedDistrict,
    selectedMunicipality,
    selectedLocation,
    searchTerm,
    searchResults,
    isSearching,
    showAutocomplete,
    isLoading,
    handleProvinceChange,
    handleDistrictChange,
    handleMunicipalityChange,
    handleSearchChange,
    handleAutocompleteSelect,
    handleClear,
    setShowAutocomplete,
  } = useLocationHierarchy(selectedLocationId, onLocationSelect);

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

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="m-0 text-base font-semibold text-gray-800">
          {label} {required && <span className="text-red-500">*</span>}
        </h3>
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-3 bg-purple-100 rounded-md mb-3 text-sm text-purple-600 font-semibold flex justify-between items-center">
          <span>📍 {selectedLocation.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="bg-transparent border-none text-purple-600 cursor-pointer text-sm underline p-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Search Input */}
      <div ref={searchInputRef} className="mb-3 relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 text-sm border border-gray-300 rounded-md outline-none transition-colors focus:border-purple-500"
          onFocus={() => {
            if (searchResults.length > 0) setShowAutocomplete(true);
          }}
        />

        {/* Autocomplete Dropdown */}
        {showAutocomplete && (searchResults.length > 0 || isSearching) && (
          <AutocompleteDropdown
            results={searchResults}
            isSearching={isSearching}
            onSelect={handleAutocompleteSelect}
          />
        )}
      </div>

      {/* Hierarchical Dropdowns */}
      {isLoading ? (
        <div className="p-4 text-center text-gray-500">Loading locations...</div>
      ) : (
        <div className="flex flex-col gap-3">
          <LocationSelect
            label="Select Province"
            value={selectedProvince}
            options={provinces}
            onChange={(id) => handleProvinceChange(id)}
            placeholder="Select Province"
          />

          {selectedProvince && districts.length > 0 && (
            <LocationSelect
              label="District"
              value={selectedDistrict}
              options={districts}
              onChange={(id) => handleDistrictChange(id)}
              placeholder="Select District"
            />
          )}

          {selectedDistrict && municipalities.length > 0 && (
            <LocationSelect
              label="Municipality"
              value={selectedMunicipality}
              options={municipalities}
              onChange={(id) => handleMunicipalityChange(id)}
              placeholder="Select Municipality"
            />
          )}
        </div>
      )}

      <small className="block mt-3 text-gray-500 text-xs">
        Select a location or use the search box above
      </small>
    </div>
  );
}

// Sub-components
function AutocompleteDropdown({
  results,
  isSearching,
  onSelect,
}: {
  results: Location[];
  isSearching: boolean;
  onSelect: (location: Location) => void;
}) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md max-h-[300px] overflow-y-auto shadow-lg z-50">
      {isSearching ? (
        <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
      ) : (
        results.map((result, index) => (
          <button
            key={`${result.id}-${index}`}
            type="button"
            onClick={() => onSelect(result)}
            className="w-full p-3 border-none bg-transparent cursor-pointer text-left transition-colors hover:bg-purple-100"
            style={{ borderBottom: index < results.length - 1 ? '1px solid #e5e7eb' : 'none' }}
          >
            <div className="text-sm font-semibold text-gray-800 mb-0.5">{result.name}</div>
            <div className="text-xs text-gray-500 capitalize">{result.type}</div>
          </button>
        ))
      )}
    </div>
  );
}

function LocationSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: number | null;
  options: Location[];
  onChange: (id: number | null) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full p-3 text-sm border border-gray-300 rounded-md outline-none bg-white cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
