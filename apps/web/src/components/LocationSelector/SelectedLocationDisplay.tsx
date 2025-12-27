'use client';

import type { Location } from './types';
import { getLocationTypeLabel } from './types';

interface SelectedLocationDisplayProps {
  location: Location;
  onClear: () => void;
}

export function SelectedLocationDisplay({ location, onClear }: SelectedLocationDisplayProps) {
  return (
    <div style={{
      padding: '0.75rem',
      backgroundColor: '#ede9fe',
      borderRadius: '6px',
      marginBottom: '0.75rem',
      fontSize: '0.875rem',
      color: '#7c3aed',
      fontWeight: '600',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span>{location.name} ({getLocationTypeLabel(location.type)})</span>
      <button
        type="button"
        onClick={onClear}
        style={{
          background: 'none',
          border: 'none',
          color: '#7c3aed',
          cursor: 'pointer',
          fontSize: '0.875rem',
          textDecoration: 'underline'
        }}
      >
        Clear
      </button>
    </div>
  );
}
