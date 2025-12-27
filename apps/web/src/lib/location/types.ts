/**
 * Location type definitions (client-safe)
 * These can be imported in client components without pulling in Prisma
 */

export type LocationType = 'province' | 'district' | 'municipality' | 'area';

export interface LocationHierarchyBase {
  id: number;
  name: string;
  slug: string;
  type: LocationType;
  parent_id: number | null;
}

export interface LocationHierarchyArea extends LocationHierarchyBase {
  type: 'area';
}

export interface LocationHierarchyMunicipality extends LocationHierarchyBase {
  type: 'municipality';
  areas?: LocationHierarchyArea[];
}

export interface LocationHierarchyDistrict extends LocationHierarchyBase {
  type: 'district';
  municipalities?: LocationHierarchyMunicipality[];
}

export interface LocationHierarchyProvince extends LocationHierarchyBase {
  type: 'province';
  districts?: LocationHierarchyDistrict[];
}

export interface CategoryWithSubcategories {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  }[];
}
