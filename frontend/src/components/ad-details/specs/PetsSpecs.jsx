import React from 'react';
import './TemplateSpecs.css';

/**
 * Pets & Animals Specifications Display
 * Shows custom fields for pets, farm animals, and pet accessories
 */
function PetsSpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    // Animal fields
    animalType: 'Animal Type',
    breed: 'Breed',
    age: 'Age',
    gender: 'Gender',
    vaccination: 'Vaccination Status',
    papers: 'Pet Papers/Documents',
    color: 'Color/Coat',
    weight: 'Weight',
    trained: 'Training Status',
    friendlyWith: 'Friendly With',

    // Accessories/Food fields
    productType: 'Product Type',
    suitableFor: 'Suitable For'
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
    <div className="template-specs pets-specs">
      <div className="specs-header">
        <h3>🐾 Specifications</h3>
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

export default PetsSpecs;
