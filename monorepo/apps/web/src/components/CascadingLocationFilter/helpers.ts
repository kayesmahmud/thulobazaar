import type { PersistedExpandedState } from './types';

const EXPANDED_STATE_STORAGE_KEY = 'ads-location-filter-expanded';

const defaultExpandedState: PersistedExpandedState = {
  provinces: [],
  districts: [],
  municipalities: [],
};

export function readExpandedState(): PersistedExpandedState {
  if (typeof window === 'undefined') {
    return defaultExpandedState;
  }

  try {
    const stored = window.sessionStorage.getItem(EXPANDED_STATE_STORAGE_KEY);
    if (!stored) {
      return defaultExpandedState;
    }

    const parsed = JSON.parse(stored);
    return {
      provinces: Array.isArray(parsed?.provinces) ? parsed.provinces : [],
      districts: Array.isArray(parsed?.districts) ? parsed.districts : [],
      municipalities: Array.isArray(parsed?.municipalities) ? parsed.municipalities : [],
    };
  } catch (error) {
    console.error('Failed to read expanded locations from storage:', error);
    return defaultExpandedState;
  }
}

export function persistExpandedState(state: PersistedExpandedState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(EXPANDED_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist expanded locations:', error);
  }
}

export function getLocationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    province: '(Province)',
    district: '(District)',
    municipality: '(Municipality)',
    area: '(Area)',
  };
  return labels[type] || `(${type})`;
}

export function buildFullPath(
  provinceName: string,
  districtName?: string,
  municipalityName?: string,
  areaName?: string
): string {
  const parts: string[] = [];
  if (areaName) parts.push(areaName);
  if (municipalityName) parts.push(municipalityName);
  if (districtName) parts.push(districtName);
  parts.push(provinceName);
  return parts.join(', ');
}

export function buildReversedPath(result: { hierarchy?: Array<{ name: string }>; fullPath?: string }): string | null {
  if (result.hierarchy && result.hierarchy.length > 0) {
    return result.hierarchy.map(h => h.name).reverse().join(', ');
  } else if (result.fullPath) {
    return result.fullPath.split(' → ').reverse().join(', ');
  }
  return null;
}
