/**
 * Electronics Fields
 */

import type { FormField } from '../types';

export const storageField: FormField = {
  name: 'storage',
  label: 'Storage Capacity',
  type: 'select',
  required: true,
  options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
  appliesTo: 'all',
};

export const ramField: FormField = {
  name: 'ram',
  label: 'RAM',
  type: 'select',
  required: true,
  options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
  appliesTo: 'all',
};

export const batteryHealthField: FormField = {
  name: 'batteryHealth',
  label: 'Battery Health',
  type: 'select',
  required: false,
  options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
  appliesTo: 'all',
};

export const processorField: FormField = {
  name: 'processor',
  label: 'Processor',
  type: 'text',
  required: true,
  placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
  appliesTo: 'all',
};

export const graphicsField: FormField = {
  name: 'graphics',
  label: 'Graphics Card',
  type: 'text',
  required: false,
  placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
  appliesTo: 'all',
};

export const screenResolutionField: FormField = {
  name: 'screenResolution',
  label: 'Screen Resolution',
  type: 'select',
  required: false,
  options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
  appliesTo: 'all',
};

export const screenSizeField: FormField = {
  name: 'screenSize',
  label: 'Screen Size',
  type: 'text',
  required: true,
  placeholder: 'e.g., 55 inches',
  appliesTo: 'all',
};

export const smartFeaturesField: FormField = {
  name: 'smartFeatures',
  label: 'Smart Features',
  type: 'multiselect',
  required: false,
  options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
  appliesTo: 'all',
};

export const megapixelsField: FormField = {
  name: 'megapixels',
  label: 'Megapixels',
  type: 'number',
  required: false,
  placeholder: 'e.g., 24, 48, 108',
  appliesTo: 'all',
};

export const sensorSizeField: FormField = {
  name: 'sensorSize',
  label: 'Sensor Size',
  type: 'text',
  required: false,
  placeholder: 'e.g., Full Frame, APS-C, Micro 4/3',
  appliesTo: 'all',
};
