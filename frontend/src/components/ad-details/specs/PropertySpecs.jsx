import React from 'react';
import './TemplateSpecs.css';

/**
 * Property Specifications Display
 * Shows custom fields for properties (Land, Apartments, Houses, Commercial, etc.)
 */
function PropertySpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    // Universal fields
    totalArea: 'Total Area',
    areaUnit: 'Area Unit',

    // Apartment/House fields
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    furnishing: 'Furnishing',
    floorNumber: 'Floor Number',
    totalFloors: 'Total Floors',
    parking: 'Parking',
    facing: 'Facing Direction',
    propertyAge: 'Property Age',
    amenities: 'Amenities',

    // Land fields
    landType: 'Land Type',
    roadAccess: 'Road Access',
    roadWidth: 'Road Width',

    // Rental fields
    monthlyRent: 'Monthly Rent',
    securityDeposit: 'Security Deposit',
    availableFrom: 'Available From',

    // Additional common fields
    builtYear: 'Built Year',
    electricityBackup: 'Electricity Backup',
    waterSupply: 'Water Supply',
    kitchen: 'Kitchen',
    balcony: 'Balcony',
    garden: 'Garden',
    elevator: 'Elevator',
    security: 'Security',
    internetFiber: 'Internet/Fiber',
    cableTv: 'Cable TV',
    gym: 'Gym',
    swimmingPool: 'Swimming Pool',
    petFriendly: 'Pet Friendly',
    wheelchairAccessible: 'Wheelchair Accessible',

    // Commercial specific
    shopWidth: 'Shop Width',
    shopDepth: 'Shop Depth',
    officeSpace: 'Office Space',
    warehouseCapacity: 'Warehouse Capacity',

    // Property documents
    propertyDocuments: 'Property Documents',
    taxClearance: 'Tax Clearance',
    landCertificate: 'Land Certificate',

    // Pricing
    pricePerUnit: 'Price per Unit',
    negotiable: 'Negotiable'
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
    <div className="template-specs property-specs">
      <div className="specs-header">
        <h3>🏠 Property Specifications</h3>
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

export default PropertySpecs;
