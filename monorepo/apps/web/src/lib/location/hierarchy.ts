import { prisma } from '@thulobazaar/database';

export type LocationType = 'province' | 'district' | 'municipality' | 'area';

interface RawLocationRow {
  id: number;
  name: string;
  slug: string | null;
  type: string;
  parent_id: number | null;
}

const normalizeSlug = (row: RawLocationRow) => ({
  ...row,
  slug: row.slug || row.id.toString(),
}) as RawLocationRow & { slug: string };

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
  areas: LocationHierarchyArea[];
}

export interface LocationHierarchyDistrict extends LocationHierarchyBase {
  type: 'district';
  municipalities: LocationHierarchyMunicipality[];
}

export interface LocationHierarchyProvince extends LocationHierarchyBase {
  type: 'province';
  districts: LocationHierarchyDistrict[];
}

/**
 * Fetches the full province → district → municipality → area hierarchy
 * in a single trip so filters can hydrate instantly on the client.
 */
export async function getLocationHierarchy(): Promise<LocationHierarchyProvince[]> {
  const provincesRaw = await prisma.locations.findMany({
    where: { type: 'province' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parent_id: true,
    },
  });

  if (provincesRaw.length === 0) {
    return [];
  }

  const provinces = provincesRaw
    .map(normalizeSlug)
    .map(
      (province) =>
        ({
          ...province,
          type: 'province',
          districts: [],
        }) satisfies LocationHierarchyProvince
    );

  const provinceIds = provinces.map((province) => province.id);

  const districtsRaw = await prisma.locations.findMany({
    where: {
      type: 'district',
      parent_id: { in: provinceIds },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      parent_id: true,
    },
  });

  const districts = districtsRaw
    .map(normalizeSlug)
    .map(
      (district) =>
        ({
          ...district,
          type: 'district',
          municipalities: [],
        }) satisfies LocationHierarchyDistrict
    );

  const districtIds = districts.map((district) => district.id);

  const municipalitiesRaw =
    districtIds.length > 0
      ? await prisma.locations.findMany({
          where: {
            type: 'municipality',
            parent_id: { in: districtIds },
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            parent_id: true,
          },
        })
      : [];

  const municipalities = municipalitiesRaw
    .map(normalizeSlug)
    .map(
      (municipality) =>
        ({
          ...municipality,
          type: 'municipality',
          areas: [],
        }) satisfies LocationHierarchyMunicipality
    );

  const municipalityIds = municipalities.map((municipality) => municipality.id);

  const areasRaw =
    municipalityIds.length > 0
      ? await prisma.locations.findMany({
          where: {
            type: 'area',
            parent_id: { in: municipalityIds },
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            parent_id: true,
          },
        })
      : [];

  const areas = areasRaw
    .map(normalizeSlug)
    .map(
      (area) =>
        ({
          ...area,
          type: 'area',
        }) satisfies LocationHierarchyArea
    );

  const areasByMunicipality: Record<number, LocationHierarchyArea[]> = {};
  areas.forEach((area) => {
    const municipalityId = area.parent_id;
    if (!municipalityId) return;
    if (!areasByMunicipality[municipalityId]) {
      areasByMunicipality[municipalityId] = [];
    }
    areasByMunicipality[municipalityId].push(area);
  });

  const municipalitiesByDistrict: Record<number, LocationHierarchyMunicipality[]> = {};
  municipalities.forEach((municipality) => {
    const districtId = municipality.parent_id;
    if (!districtId) return;
    const withAreas: LocationHierarchyMunicipality = {
      ...municipality,
      areas: areasByMunicipality[municipality.id] || [],
    };
    if (!municipalitiesByDistrict[districtId]) {
      municipalitiesByDistrict[districtId] = [];
    }
    municipalitiesByDistrict[districtId].push(withAreas);
  });

  const districtsByProvince: Record<number, LocationHierarchyDistrict[]> = {};
  districts.forEach((district) => {
    const provinceId = district.parent_id;
    if (!provinceId) return;
    const withMunicipalities: LocationHierarchyDistrict = {
      ...district,
      municipalities: municipalitiesByDistrict[district.id] || [],
    };
    if (!districtsByProvince[provinceId]) {
      districtsByProvince[provinceId] = [];
    }
    districtsByProvince[provinceId].push(withMunicipalities);
  });

  return provinces.map((province) => ({
    ...province,
    districts: districtsByProvince[province.id] || [],
  }));
}

/**
 * Get location breadcrumb trail (hierarchy path from province to current location)
 * Used by API routes to build full location paths
 *
 * @param locationId - The location ID to get the breadcrumb for
 * @returns Array of locations from province down to the specified location
 */
export async function getLocationBreadcrumb(locationId: number): Promise<Array<{ id: number; name: string; type: string }>> {
  const hierarchy: Array<{ id: number; name: string; type: string }> = [];
  let currentId: number | null = locationId;

  while (currentId !== null) {
    const location: { id: number; name: string; type: string; parent_id: number | null } | null = await prisma.locations.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        name: true,
        type: true,
        parent_id: true,
      },
    });

    if (!location) break;

    hierarchy.unshift({
      id: location.id,
      name: location.name,
      type: location.type,
    });

    currentId = location.parent_id;
  }

  return hierarchy;
}
