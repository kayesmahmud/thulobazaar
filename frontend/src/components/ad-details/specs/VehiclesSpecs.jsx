import React from 'react';
import './TemplateSpecs.css';

/**
 * Vehicles Specifications Display
 * Shows custom fields for vehicles (Cars, Motorbikes, Bicycles, etc.)
 */
function VehiclesSpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    make: 'Make/Brand',
    model: 'Model',
    year: 'Model Year',
    mileage: 'Mileage',
    fuelType: 'Fuel Type',
    transmission: 'Transmission',
    engineCapacity: 'Engine Capacity',
    bodyType: 'Body Type',
    color: 'Color',
    numberOfOwners: 'Number of Owners',
    registrationYear: 'Registration Year',
    taxPaidUntil: 'Tax Paid Until',
    insuranceValid: 'Insurance Valid Until',
    features: 'Features',
    lotNumber: 'Lot Number',
    condition: 'Condition',

    // Motorbike specific
    bikeType: 'Bike Type',

    // Bicycle specific
    frameSize: 'Frame Size',
    gears: 'Number of Gears',
    wheelSize: 'Wheel Size',

    // Additional common fields
    vehicleType: 'Vehicle Type',
    seats: 'Seating Capacity',
    doors: 'Number of Doors',
    parkingSensors: 'Parking Sensors',
    sunroof: 'Sunroof',
    leatherSeats: 'Leather Seats',
    warranty: 'Warranty',
    serviceHistory: 'Service History',
    accidentHistory: 'Accident History'
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
    <div className="template-specs vehicles-specs">
      <div className="specs-header">
        <h3>🚗 Vehicle Specifications</h3>
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

export default VehiclesSpecs;
