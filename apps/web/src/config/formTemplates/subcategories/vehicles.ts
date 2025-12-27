/**
 * Vehicles Subcategory Configurations
 */

import type { SubcategoryConfig } from '../types';
import {
  conditionNewUsed,
  brandField,
  modelField,
  vehicleYearField,
  mileageField,
  fuelTypeField,
  transmissionField,
  engineCapacityField,
  colorField,
  ownersField,
  registrationYearField,
  registrationLocationField,
  seatsField,
  bodyTypeField,
  bicycleTypeField,
} from '../fields';

export const cars: SubcategoryConfig = {
  name: 'Cars',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Toyota, Honda, Hyundai, Suzuki' } },
    { field: modelField, override: { placeholder: 'e.g., Corolla, Civic, i20, Swift' } },
    { field: vehicleYearField },
    { field: mileageField },
    { field: fuelTypeField },
    { field: transmissionField },
    { field: engineCapacityField },
    { field: colorField },
    { field: ownersField },
    { field: registrationYearField },
    { field: registrationLocationField },
    { field: bodyTypeField },
    { field: seatsField },
  ],
};

export const motorcycles: SubcategoryConfig = {
  name: 'Motorcycles',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Honda, Yamaha, Bajaj, TVS' } },
    { field: modelField, override: { placeholder: 'e.g., CBR, FZ, Pulsar' } },
    { field: vehicleYearField },
    { field: mileageField },
    { field: fuelTypeField, override: { options: ['Petrol'] } },
    { field: engineCapacityField, override: { placeholder: 'e.g., 150cc, 250cc, 400cc' } },
    { field: colorField },
    { field: ownersField },
    { field: registrationYearField },
  ],
};

export const scooters: SubcategoryConfig = {
  name: 'Scooters',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Honda, TVS, Vespa, Aprilia' } },
    { field: modelField, override: { placeholder: 'e.g., Activa, Jupiter, Ntorq' } },
    { field: vehicleYearField },
    { field: mileageField },
    { field: fuelTypeField, override: { options: ['Petrol', 'Electric'] } },
    { field: engineCapacityField, override: { placeholder: 'e.g., 110cc, 125cc' } },
    { field: colorField },
    { field: ownersField },
    { field: registrationYearField },
  ],
};

export const electricVehicles: SubcategoryConfig = {
  name: 'Electric Vehicles',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Ather, Ola, Tata, BYD' } },
    { field: modelField },
    { field: vehicleYearField },
    { field: mileageField, override: { label: 'Range (km)', placeholder: 'e.g., 100, 200, 300' } },
    { field: colorField },
    { field: ownersField },
    { field: registrationYearField },
  ],
};

export const bicycles: SubcategoryConfig = {
  name: 'Bicycles',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Trek, Giant, Hero, Firefox' } },
    { field: bicycleTypeField },
    { field: colorField },
  ],
};

export const heavyVehicles: SubcategoryConfig = {
  name: 'Heavy Vehicles',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Tata, Ashok Leyland, Mahindra' } },
    { field: modelField },
    { field: vehicleYearField },
    { field: bodyTypeField, override: { label: 'Vehicle Type', options: ['Truck', 'Bus', 'Tipper', 'Tanker', 'Trailer'] } },
    { field: mileageField },
    { field: fuelTypeField },
    { field: ownersField },
    { field: registrationYearField },
  ],
};

export const autoParts: SubcategoryConfig = {
  name: 'Auto Parts & Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Bosch, Denso, 3M' } },
  ],
};

export const vehicleRentals: SubcategoryConfig = {
  name: 'Vehicle Rentals',
  fields: [
    { field: bodyTypeField, override: { label: 'Vehicle Type', options: ['Car', 'Motorcycle', 'Scooter', 'Van', 'Bus'] } },
    { field: brandField },
    { field: modelField },
    { field: fuelTypeField },
    { field: transmissionField },
  ],
};

export const parkingGarage: SubcategoryConfig = {
  name: 'Parking & Garage',
  fields: [
    { field: bodyTypeField, override: { label: 'Space Type', options: ['Car Parking', 'Bike Parking', 'Garage', 'Open Space'] } },
  ],
};

// Export all vehicles subcategories as a map
export const vehiclesSubcategories: Record<string, SubcategoryConfig> = {
  'Cars': cars,
  'Motorcycles': motorcycles,
  'Scooters': scooters,
  'Electric Vehicles': electricVehicles,
  'Bicycles': bicycles,
  'Heavy Vehicles': heavyVehicles,
  'Auto Parts & Accessories': autoParts,
  'Vehicle Rentals': vehicleRentals,
  'Parking & Garage': parkingGarage,
};
