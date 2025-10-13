import React from 'react';
import './TemplateSpecs.css';

/**
 * Electronics & Gadgets Specifications Display
 * Shows custom fields for electronics items
 */
function ElectronicsSpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    condition: 'Condition',
    brand: 'Brand',
    model: 'Model',
    warranty: 'Warranty',
    storage: 'Storage Capacity',
    ram: 'RAM',
    batteryHealth: 'Battery Health',
    processor: 'Processor',
    graphics: 'Graphics Card',
    screenResolution: 'Screen Resolution',
    screenSize: 'Screen/Sensor Size',
    smartFeatures: 'Smart Features',
    megapixels: 'Megapixels'
  };

  // Filter out empty values
  const specs = Object.entries(customFields)
    .filter(([key, value]) => value && value !== '' && value.length !== 0)
    .map(([key, value]) => ({
      label: fieldLabels[key] || key,
      value: Array.isArray(value) ? value.join(', ') : value
    }));

  if (specs.length === 0) {
    return null;
  }

  return (
    <div className="template-specs electronics-specs">
      <div className="specs-header">
        <h3>📱 Specifications</h3>
      </div>

      <div className="specs-grid">
        {specs.map((spec, index) => (
          <div key={index} className="spec-item">
            <div className="spec-label">{spec.label}</div>
            <div className="spec-value">{spec.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ElectronicsSpecs;
