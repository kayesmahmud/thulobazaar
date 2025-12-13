'use client';

import type { Province, District, Municipality } from './types';

interface CascadingDropdownsProps {
  provinces: Province[];
  selectedProvince: Province | null;
  selectedDistrict: District | null;
  selectedMunicipality: Municipality | null;
  isLoading: boolean;
  onProvinceChange: (provinceId: number) => void;
  onDistrictChange: (districtId: number) => void;
  onMunicipalityChange: (municipalityId: number) => void;
}

const selectStyle = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '0.875rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  cursor: 'pointer'
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151'
};

export function CascadingDropdowns({
  provinces,
  selectedProvince,
  selectedDistrict,
  selectedMunicipality,
  isLoading,
  onProvinceChange,
  onDistrictChange,
  onMunicipalityChange,
}: CascadingDropdownsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Province Dropdown */}
      <div>
        <label style={labelStyle}>
          1. Select Province
        </label>
        <select
          value={selectedProvince?.id || ''}
          onChange={(e) => onProvinceChange(parseInt(e.target.value))}
          disabled={isLoading}
          style={{
            ...selectStyle,
            backgroundColor: isLoading ? '#f3f4f6' : 'white',
            cursor: isLoading ? 'wait' : 'pointer'
          }}
        >
          <option value="">{isLoading ? 'Loading...' : '-- Select Province --'}</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Dropdown */}
      {selectedProvince && selectedProvince.districts && (
        <div>
          <label style={labelStyle}>
            2. Select District
          </label>
          <select
            value={selectedDistrict?.id || ''}
            onChange={(e) => onDistrictChange(parseInt(e.target.value))}
            style={selectStyle}
          >
            <option value="">-- Select District --</option>
            {selectedProvince.districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Municipality Dropdown */}
      {selectedDistrict && selectedDistrict.municipalities && (
        <div>
          <label style={labelStyle}>
            3. Select Municipality
          </label>
          <select
            value={selectedMunicipality?.id || ''}
            onChange={(e) => onMunicipalityChange(parseInt(e.target.value))}
            style={selectStyle}
          >
            <option value="">-- Select Municipality --</option>
            {selectedDistrict.municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
