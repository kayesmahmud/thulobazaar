import type {
  LocationHierarchyProvince,
  LocationHierarchyDistrict,
  LocationHierarchyMunicipality,
  LocationHierarchyArea,
} from '@/lib/location/types';

export type Province = LocationHierarchyProvince;
export type District = LocationHierarchyDistrict;
export type Municipality = LocationHierarchyMunicipality;
export type Area = LocationHierarchyArea;

export interface SearchResult {
  id: number;
  name: string;
  slug: string;
  type: 'province' | 'district' | 'municipality' | 'area';
  parent_id?: number | null;
  hierarchy_info?: string;
  fullPath?: string;
  hierarchy?: Array<{ id: number; name: string; type: string }>;
}

export interface PersistedExpandedState {
  provinces: number[];
  districts: number[];
  municipalities: number[];
}

export interface CascadingLocationFilterProps {
  onLocationSelect: (locationSlug: string | null, locationName?: string | null, fullPath?: string | null) => void;
  selectedLocationSlug?: string | null;
  selectedLocationName?: string | null;
  initialProvinces?: Province[];
}

export interface LocationCaches {
  districts: Record<number, District[]>;
  municipalities: Record<number, Municipality[]>;
  areas: Record<number, Area[]>;
}

export interface ExpandedState {
  provinces: Set<number>;
  districts: Set<number>;
  municipalities: Set<number>;
}
