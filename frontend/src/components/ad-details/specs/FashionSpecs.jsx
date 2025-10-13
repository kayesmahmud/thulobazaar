import React from 'react';
import './TemplateSpecs.css';

/**
 * Fashion & Apparel Specifications Display
 * Shows custom fields for fashion items (clothing, footwear, accessories, watches, etc.)
 */
function FashionSpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    // Universal fields
    condition: 'Condition',
    size: 'Size',
    color: 'Color',
    brand: 'Brand',
    material: 'Material',

    // Clothing specific
    clothingType: 'Clothing Type',
    fitType: 'Fit Type',
    sleeveType: 'Sleeve Type',
    pattern: 'Pattern',
    occasion: 'Occasion',

    // Footwear specific
    footwearType: 'Footwear Type',
    shoeSize: 'Shoe Size',

    // Accessories/Watches specific
    watchType: 'Watch Type',
    strapMaterial: 'Strap Material',
    dialShape: 'Dial Shape',
    waterResistance: 'Water Resistance',

    // Other
    warranty: 'Warranty',
    ageGroup: 'Age Group',
    season: 'Season'
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
    <div className="template-specs fashion-specs">
      <div className="specs-header">
        <h3>👔 Specifications</h3>
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

export default FashionSpecs;
