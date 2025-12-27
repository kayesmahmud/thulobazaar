/**
 * General Fields - Furniture, Sports, Business, Essentials, Agriculture
 */

import type { FormField } from '../types';

// Furniture fields
export const furnitureTypeField: FormField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  type: 'select',
  required: true,
  options: ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
  appliesTo: 'all',
};

export const materialField: FormField = {
  name: 'material',
  label: 'Material',
  type: 'select',
  required: false,
  options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
  appliesTo: 'all',
};

export const dimensionsField: FormField = {
  name: 'dimensions',
  label: 'Dimensions (L × W × H)',
  type: 'text',
  required: false,
  placeholder: 'e.g., 200cm × 100cm × 80cm',
  appliesTo: 'all',
};

export const assemblyRequiredField: FormField = {
  name: 'assemblyRequired',
  label: 'Assembly Required',
  type: 'select',
  required: false,
  options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
  appliesTo: 'all',
};

export const seatingCapacityField: FormField = {
  name: 'seatingCapacity',
  label: 'Seating Capacity',
  type: 'select',
  required: false,
  options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
  appliesTo: 'all',
};

export const storageAvailableField: FormField = {
  name: 'storageAvailable',
  label: 'Storage Available',
  type: 'select',
  required: false,
  options: ['Yes', 'No'],
  appliesTo: 'all',
};

export const styleField: FormField = {
  name: 'style',
  label: 'Style',
  type: 'select',
  required: false,
  options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
  appliesTo: 'all',
};

// Sports & Hobbies fields
export const sportTypeField: FormField = {
  name: 'sportType',
  label: 'Sport Type',
  type: 'text',
  required: false,
  placeholder: 'e.g., Cricket, Football, Basketball',
  appliesTo: 'all',
};

export const instrumentTypeField: FormField = {
  name: 'instrumentType',
  label: 'Instrument Type',
  type: 'text',
  required: false,
  placeholder: 'e.g., Guitar, Piano, Drums',
  appliesTo: 'all',
};

// Business & Industry fields
export const machineryTypeField: FormField = {
  name: 'machineryType',
  label: 'Machinery Type',
  type: 'select',
  required: true,
  options: ['Construction', 'Manufacturing', 'Agricultural', 'Office Equipment', 'Medical Equipment'],
  appliesTo: 'all',
};

export const powerSourceField: FormField = {
  name: 'powerSource',
  label: 'Power Source',
  type: 'select',
  required: false,
  options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
  appliesTo: 'all',
};

// Essentials fields
export const productTypeField: FormField = {
  name: 'productType',
  label: 'Product Type',
  type: 'select',
  required: true,
  options: ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
  appliesTo: 'all',
};

export const quantityField: FormField = {
  name: 'quantity',
  label: 'Quantity Available',
  type: 'number',
  required: false,
  placeholder: 'Enter quantity',
  appliesTo: 'all',
};

export const expiryDateField: FormField = {
  name: 'expiryDate',
  label: 'Expiry Date',
  type: 'date',
  required: false,
  appliesTo: 'all',
};

// Agriculture fields
export const cropTypeField: FormField = {
  name: 'cropType',
  label: 'Crop/Plant Type',
  type: 'text',
  required: true,
  placeholder: 'e.g., Rice, Wheat, Tomato',
  appliesTo: 'all',
};

export const farmingToolTypeField: FormField = {
  name: 'farmingToolType',
  label: 'Farming Tool Type',
  type: 'select',
  required: false,
  options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
  appliesTo: 'all',
};
