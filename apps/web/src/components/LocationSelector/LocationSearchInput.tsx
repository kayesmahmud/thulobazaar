'use client';

import type { RefObject } from 'react';
import type { SearchResult } from './types';
import { getLocationTypeLabel } from './types';

interface LocationSearchInputProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  showAutocomplete: boolean;
  onSelect: (result: SearchResult) => void;
  inputRef: RefObject<HTMLDivElement | null>;
  placeholder: string;
}

export function LocationSearchInput({
  searchTerm,
  onSearchChange,
  onFocus,
  searchResults,
  isSearching,
  showAutocomplete,
  onSelect,
  inputRef,
  placeholder,
}: LocationSearchInputProps) {
  return (
    <div ref={inputRef} style={{
      marginBottom: '0.75rem',
      position: 'relative'
    }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '0.875rem',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={onFocus}
      />

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (searchResults.length > 0 || isSearching) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000
        }}>
          {isSearching ? (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              Searching...
            </div>
          ) : (
            searchResults.map((result, index) => (
              <button
                key={`${result.id}-${index}`}
                type="button"
                onClick={() => onSelect(result)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '2px'
                }}>
                  {result.name}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  {getLocationTypeLabel(result.type)}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
