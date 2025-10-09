import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ApiService from '../services/api';
import '../styles/LocationSearchInput.css';

/**
 * Location Search Input with Autocomplete
 * Searches areas/places and shows suggestions
 * Format: (Area Name, Ward X, Municipality Name)
 */
function LocationSearchInput({
  value = '',
  onSelect,
  onClear,
  placeholder = "Type area, place, or location...",
  className = ''
}) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceTimer = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timer
    clearTimeout(debounceTimer.current);

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await ApiService.searchLocations(searchTerm);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('❌ Location search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSelect = (location) => {
    setSearchTerm(location.display_text);
    setShowSuggestions(false);
    onSelect && onSelect(location);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClear && onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`location-search-input ${className}`}>
      <div className="search-input-container">
        <span className="location-search-icon">📍</span>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="location-input"
          autoComplete="off"
        />

        {loading && <span className="loading-spinner">⏳</span>}

        {searchTerm && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="clear-button"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={dropdownRef} className="suggestions-dropdown">
          <div className="suggestions-label">Suggestions:</div>
          {suggestions.map((location, index) => (
            <div
              key={location.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(location)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-content">
                <div className="suggestion-main">
                  <strong>{location.area_name}</strong>
                  {location.ward_number && (
                    <span className="ward-badge">Ward {location.ward_number}</span>
                  )}
                </div>
                <div className="suggestion-sub">
                  {location.municipality_name}, {location.district_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && searchTerm.length >= 2 && suggestions.length === 0 && !loading && (
        <div ref={dropdownRef} className="suggestions-dropdown">
          <div className="no-results">
            No locations found for "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
}

LocationSearchInput.propTypes = {
  value: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string
};

export default LocationSearchInput;
