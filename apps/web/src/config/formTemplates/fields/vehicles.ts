/**
 * Vehicle Fields
 */

import type { FormField } from '../types';

export const vehicleYearField: FormField = {
  name: 'year',
  label: 'Year of Manufacture',
  type: 'number',
  required: true,
  min: 1980,
  max: 2025,
  placeholder: 'e.g., 2020',
  appliesTo: 'all',
};

export const mileageField: FormField = {
  name: 'mileage',
  label: 'Mileage/Kilometers Driven',
  type: 'number',
  required: false,
  placeholder: 'in km',
  appliesTo: 'all',
};

export const fuelTypeField: FormField = {
  name: 'fuelType',
  label: 'Fuel Type',
  type: 'select',
  required: true,
  options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
  appliesTo: 'all',
};

export const transmissionField: FormField = {
  name: 'transmission',
  label: 'Transmission',
  type: 'select',
  required: true,
  options: ['Manual', 'Automatic', 'Semi-Automatic'],
  appliesTo: 'all',
};

export const engineCapacityField: FormField = {
  name: 'engineCapacity',
  label: 'Engine Capacity (cc)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 1500',
  appliesTo: 'all',
};

export const ownersField: FormField = {
  name: 'owners',
  label: 'Number of Owners',
  type: 'select',
  required: false,
  options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
  appliesTo: 'all',
};

export const registrationYearField: FormField = {
  name: 'registrationYear',
  label: 'Registration Year',
  type: 'number',
  required: false,
  min: 1980,
  max: 2025,
  appliesTo: 'all',
};

export const registrationLocationField: FormField = {
  name: 'registrationLocation',
  label: 'Registration Location',
  type: 'text',
  required: false,
  placeholder: 'e.g., Bagmati, Kathmandu',
  appliesTo: 'all',
};

export const seatsField: FormField = {
  name: 'seats',
  label: 'Number of Seats',
  type: 'select',
  required: false,
  options: ['2', '4', '5', '7', '8+'],
  appliesTo: 'all',
};

export const bodyTypeField: FormField = {
  name: 'bodyType',
  label: 'Body Type',
  type: 'select',
  required: false,
  options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
  appliesTo: 'all',
};

export const parkingSensorsField: FormField = {
  name: 'parkingSensors',
  label: 'Parking Sensors',
  type: 'checkbox',
  required: false,
  appliesTo: 'all',
};

export const backupCameraField: FormField = {
  name: 'backupCamera',
  label: 'Backup Camera',
  type: 'checkbox',
  required: false,
  appliesTo: 'all',
};

export const bicycleTypeField: FormField = {
  name: 'bicycleType',
  label: 'Bicycle Type',
  type: 'select',
  required: false,
  options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
  appliesTo: 'all',
};

export const frameSizeField: FormField = {
  name: 'frameSize',
  label: 'Frame Size',
  type: 'text',
  required: false,
  placeholder: 'e.g., Medium, 27.5"',
  appliesTo: 'all',
};
