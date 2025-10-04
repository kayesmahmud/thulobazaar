import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function AdvancedFilters({ onFiltersChange, initialFilters = {} }) {
  const [filters, setFilters] = useState({
    priceRange: [0, 5000000], // NPR 0 to 50 lakh
    condition: 'all',
    datePosted: 'any',
    customDateRange: {
      from: '',
      to: ''
    },
    sortBy: 'date',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [showCustomDate, setShowCustomDate] = useState(false);
  const isInitialMount = useRef(true);
  const isUpdatingFromParent = useRef(false);


  // Date preset options
  const datePresets = [
    { label: 'Any time', value: 'any' },
    { label: 'Last hour', value: 'hour' },
    { label: 'Last 24 hours', value: 'day' },
    { label: 'Last 3 days', value: '3days' },
    { label: 'Last week', value: 'week' },
    { label: 'Last month', value: 'month' },
    { label: 'Custom range', value: 'custom' }
  ];

  // Sort options
  const sortOptions = [
    { label: 'Newest first', value: 'date', order: 'desc' },
    { label: 'Oldest first', value: 'date', order: 'asc' },
    { label: 'Price: Low to High', value: 'price', order: 'asc' },
    { label: 'Price: High to Low', value: 'price', order: 'desc' },
    { label: 'Distance: Near to Far', value: 'distance', order: 'asc' },
    { label: 'Most Popular', value: 'views', order: 'desc' }
  ];

  // Update internal state when initialFilters change (from parent)
  useEffect(() => {
    isUpdatingFromParent.current = true;
    setFilters({
      priceRange: [0, 5000000],
      condition: 'all',
      datePosted: 'any',
      customDateRange: {
        from: '',
        to: ''
      },
      sortBy: 'date',
      sortOrder: 'desc',
      ...initialFilters
    });

    // Set custom date visibility based on datePosted value
    setShowCustomDate(initialFilters.datePosted === 'custom');

    // Reset the flag after the update
    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
  }, [JSON.stringify(initialFilters)]);

  // Only call onFiltersChange when user actually changes filters, not during initialization
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isUpdatingFromParent.current) {
      return;
    }

    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handlePriceRangeChange = (newRange) => {
    setFilters(prev => ({
      ...prev,
      priceRange: newRange
    }));
  };


  const handleDateChange = (value) => {
    if (value === 'custom') {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      setFilters(prev => ({
        ...prev,
        datePosted: value,
        customDateRange: { from: '', to: '' }
      }));
    }
  };

  const handleCustomDateChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      datePosted: 'custom',
      customDateRange: {
        ...prev.customDateRange,
        [field]: value
      }
    }));
  };

  const handleSortChange = (sortValue) => {
    const [sortBy, sortOrder] = sortValue.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder
    }));
  };

  const formatPrice = (price) => {
    if (price >= 100000) {
      return `${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)}L`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 0)}K`;
    }
    return price.toString();
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 5000000],
      condition: 'all',
      datePosted: 'any',
      customDateRange: { from: '', to: '' },
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setShowCustomDate(false);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Advanced Filters</h3>
        <button
          onClick={resetFilters}
          style={{
            backgroundColor: 'transparent',
            color: '#dc1e4a',
            border: '1px solid #dc1e4a',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Reset All
        </button>
      </div>

      {/* Price Range Section */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '12px'
        }}>
          Price Range: NPR {formatPrice(filters.priceRange[0])} - NPR {formatPrice(filters.priceRange[1])}
        </label>

        {/* Min Price Slider */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Minimum Price: NPR {formatPrice(filters.priceRange[0])}
          </label>
          <input
            type="range"
            min="0"
            max="5000000"
            step="5000"
            value={filters.priceRange[0]}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              const newMax = Math.max(newMin, filters.priceRange[1]);
              handlePriceRangeChange([newMin, newMax]);
            }}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#dc1e4a',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Max Price Slider */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '8px'
          }}>
            Maximum Price: NPR {formatPrice(filters.priceRange[1])}
          </label>
          <input
            type="range"
            min="0"
            max="5000000"
            step="5000"
            value={filters.priceRange[1]}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              const newMin = Math.min(filters.priceRange[0], newMax);
              handlePriceRangeChange([newMin, newMax]);
            }}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#dc1e4a',
              outline: 'none',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Condition Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Condition
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'new', 'used'].map((condition) => (
            <button
              key={condition}
              onClick={() => setFilters(prev => ({ ...prev, condition }))}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: filters.condition === condition ? '#dc1e4a' : 'white',
                color: filters.condition === condition ? 'white' : '#374151',
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {condition === 'all' ? 'All Conditions' : condition}
            </button>
          ))}
        </div>
      </div>

      {/* Date Posted Filter */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Posted
        </label>
        <select
          value={showCustomDate ? 'custom' : filters.datePosted}
          onChange={(e) => handleDateChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          {datePresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>

        {/* Custom Date Range */}
        {showCustomDate && (
          <div style={{
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                From
              </label>
              <input
                type="datetime-local"
                value={filters.customDateRange.from}
                onChange={(e) => handleCustomDateChange('from', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                To
              </label>
              <input
                type="datetime-local"
                value={filters.customDateRange.to}
                onChange={(e) => handleCustomDateChange('to', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sort Options */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Sort by
        </label>
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => handleSortChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }}
        >
          {sortOptions.map((option) => (
            <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Summary */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <strong>Active filters:</strong> Price: NPR {formatPrice(filters.priceRange[0])} - NPR {formatPrice(filters.priceRange[1])},
        Condition: {filters.condition},
        Posted: {showCustomDate ? 'Custom range' : filters.datePosted},
        Sort: {sortOptions.find(opt => opt.value === filters.sortBy && opt.order === filters.sortOrder)?.label}
      </div>
    </div>
  );
}

AdvancedFilters.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
  initialFilters: PropTypes.shape({
    priceRange: PropTypes.arrayOf(PropTypes.number),
    condition: PropTypes.string,
    datePosted: PropTypes.string,
    customDateRange: PropTypes.shape({
      from: PropTypes.string,
      to: PropTypes.string
    }),
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string
  })
};

AdvancedFilters.defaultProps = {
  initialFilters: {}
};

export default AdvancedFilters;