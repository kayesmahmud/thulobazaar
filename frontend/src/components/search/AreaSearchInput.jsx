import { useState, useEffect, useRef } from 'react';
import { styles, colors, spacing, typography } from '../../styles/theme';
import axios from 'axios';

function AreaSearchInput({ selectedAreas, onAreaSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/areas/search`, {
          params: { q: query, limit: 8 }
        });

        if (response.data.success) {
          // Filter out already selected areas
          const filtered = response.data.data.filter(
            area => !selectedAreas.some(selected => selected.id === area.id)
          );
          setResults(filtered);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('❌ Error searching areas:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query, selectedAreas]);

  const handleSelect = (area) => {
    onAreaSelect(area);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div style={{ position: 'relative', marginBottom: spacing.md }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="🔍 Search for area (e.g., Thamel, Baneshwor...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          style={{
            ...styles.input.default,
            width: '100%',
            fontSize: typography.fontSize.sm,
            paddingRight: isLoading ? '40px' : '12px'
          }}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '14px',
            color: colors.text.secondary
          }}>
            ⏳
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            marginTop: '4px',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}
        >
          {results.map((area) => (
            <button
              key={area.id}
              onClick={() => handleSelect(area)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.border}`,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                {area.is_popular && <span style={{ fontSize: '12px' }}>⭐</span>}
                📍 {area.name}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  Ward {area.ward_number}, {area.municipality_name}, {area.district_name}
                </span>
                {area.listing_count > 0 && (
                  <span style={{
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold
                  }}>
                    {area.listing_count} ads
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && query.length >= 2 && results.length === 0 && !isLoading && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            marginTop: '4px',
            padding: spacing.md,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            textAlign: 'center',
            color: colors.text.secondary,
            fontSize: typography.fontSize.sm
          }}
        >
          No areas found for "{query}"
        </div>
      )}
    </div>
  );
}

export default AreaSearchInput;
