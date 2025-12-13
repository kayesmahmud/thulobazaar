export type LocationType = 'province' | 'district' | 'municipality' | 'area';

export interface Location {
  id: number;
  name: string;
  type: LocationType;
  parent_id?: number | null;
}

export interface District extends Location {
  municipalities?: Municipality[];
  children?: Municipality[];
}

export interface Municipality extends Location {}

export interface Province extends Location {
  districts?: District[];
  children?: District[];
}

export interface SearchResult {
  id: number;
  name: string;
  type: 'province' | 'district' | 'municipality';
  parent_id?: number | null;
  hierarchy_info?: string;
}

export interface LocationSelectorProps {
  onLocationSelect: (location: { id: number; name: string; type: string } | null) => void;
  selectedLocationId?: number | null;
  label?: string;
  placeholder?: string;
  required?: boolean;
  filterType?: 'municipality' | 'all';
}

export function getLocationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    province: 'Province',
    district: 'District',
    municipality: 'Municipality'
  };
  return labels[type] || type;
}
