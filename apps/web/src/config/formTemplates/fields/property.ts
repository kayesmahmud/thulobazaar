/**
 * Property Fields
 */

import type { FormField } from '../types';

export const totalAreaField: FormField = {
  name: 'totalArea',
  label: 'Total Area',
  type: 'number',
  required: true,
  placeholder: 'Enter area',
  appliesTo: 'all',
};

export const areaUnitField: FormField = {
  name: 'areaUnit',
  label: 'Area Unit',
  type: 'select',
  required: true,
  options: ['sq ft', 'aana', 'ropani', 'sq meter'],
  appliesTo: 'all',
};

export const bedroomsField: FormField = {
  name: 'bedrooms',
  label: 'Bedrooms',
  type: 'select',
  required: true,
  options: ['Studio', '1', '2', '3', '4', '5', '6+'],
  appliesTo: 'all',
};

export const bathroomsField: FormField = {
  name: 'bathrooms',
  label: 'Bathrooms',
  type: 'select',
  required: true,
  options: ['1', '2', '3', '4', '5+'],
  appliesTo: 'all',
};

export const furnishingField: FormField = {
  name: 'furnishing',
  label: 'Furnishing Status',
  type: 'select',
  required: false,
  options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
  appliesTo: 'all',
};

export const floorNumberField: FormField = {
  name: 'floorNumber',
  label: 'Floor Number',
  type: 'number',
  required: false,
  placeholder: 'e.g., 5',
  appliesTo: 'all',
};

export const totalFloorsField: FormField = {
  name: 'totalFloors',
  label: 'Total Floors in Building',
  type: 'number',
  required: false,
  placeholder: 'e.g., 12',
  appliesTo: 'all',
};

export const parkingField: FormField = {
  name: 'parking',
  label: 'Number of Parking Spaces',
  type: 'select',
  required: false,
  options: ['None', '1', '2', '3', '4+'],
  appliesTo: 'all',
};

export const facingField: FormField = {
  name: 'facing',
  label: 'Facing Direction',
  type: 'select',
  required: false,
  options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
  appliesTo: 'all',
};

export const propertyAgeField: FormField = {
  name: 'propertyAge',
  label: 'Property Age',
  type: 'select',
  required: false,
  options: ['Under Construction', '0-1 years', '1-5 years', '5-10 years', '10-20 years', '20+ years'],
  appliesTo: 'all',
};

export const amenitiesField: FormField = {
  name: 'amenities',
  label: 'Amenities',
  type: 'multiselect',
  required: false,
  options: ['Lift/Elevator', 'Power Backup', 'Water Supply', 'Security/Gated', 'Gym', 'Swimming Pool', 'Garden', 'Playground', 'Club House', 'Visitor Parking'],
  appliesTo: 'all',
};

export const landTypeField: FormField = {
  name: 'landType',
  label: 'Land Type',
  type: 'select',
  required: false,
  options: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
  appliesTo: 'all',
};

export const roadAccessField: FormField = {
  name: 'roadAccess',
  label: 'Road Access',
  type: 'select',
  required: false,
  options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
  appliesTo: 'all',
};

export const roadWidthField: FormField = {
  name: 'roadWidth',
  label: 'Road Width',
  type: 'number',
  required: false,
  placeholder: 'in feet',
  appliesTo: 'all',
};

export const monthlyRentField: FormField = {
  name: 'monthlyRent',
  label: 'Monthly Rent',
  type: 'number',
  required: true,
  placeholder: 'in NPR',
  appliesTo: 'all',
};

export const securityDepositField: FormField = {
  name: 'securityDeposit',
  label: 'Security Deposit',
  type: 'number',
  required: false,
  placeholder: 'in NPR',
  appliesTo: 'all',
};

export const availableFromField: FormField = {
  name: 'availableFrom',
  label: 'Available From',
  type: 'select',
  required: false,
  options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
  appliesTo: 'all',
};
