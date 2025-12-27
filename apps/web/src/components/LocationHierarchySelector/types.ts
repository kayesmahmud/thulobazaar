export interface Location {
  id: number;
  name: string;
  type: 'province' | 'district' | 'municipality';
  parent_id: number | null;
}

export interface LocationHierarchySelectorProps {
  onLocationSelect: (location: Location | null) => void;
  selectedLocationId?: number | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export interface LocationState {
  provinces: Location[];
  districts: Location[];
  municipalities: Location[];
  selectedProvince: number | null;
  selectedDistrict: number | null;
  selectedMunicipality: number | null;
  selectedLocation: Location | null;
}

export interface SearchState {
  searchTerm: string;
  searchResults: Location[];
  isSearching: boolean;
  showAutocomplete: boolean;
}
