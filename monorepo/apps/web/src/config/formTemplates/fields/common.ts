/**
 * Common Fields - Used across multiple categories
 */

import type { FormField } from '../types';

// Condition field variants
export const conditionNewUsed: FormField = {
  name: 'condition',
  label: 'Condition',
  type: 'select',
  required: true,
  options: ['Brand New', 'Used'],
  appliesTo: 'all',
};

export const conditionWithRefurbished: FormField = {
  name: 'condition',
  label: 'Condition',
  type: 'select',
  required: true,
  options: ['Brand New', 'Refurbished', 'Used'],
  appliesTo: 'all',
};

export const conditionOptional: FormField = {
  name: 'condition',
  label: 'Condition',
  type: 'select',
  required: false,
  options: ['Brand New', 'Used'],
  appliesTo: 'all',
};

// Brand field - base definition (placeholder should be overridden)
export const brandField: FormField = {
  name: 'brand',
  label: 'Brand',
  type: 'text',
  required: false,
  placeholder: 'Enter brand name',
  appliesTo: 'all',
};

// Model field
export const modelField: FormField = {
  name: 'model',
  label: 'Model',
  type: 'text',
  required: false,
  placeholder: 'Enter model name',
  appliesTo: 'all',
};

// Color field
export const colorField: FormField = {
  name: 'color',
  label: 'Color',
  type: 'text',
  required: false,
  placeholder: 'e.g., Black, White, Red',
  appliesTo: 'all',
};

// Warranty field
export const warrantyField: FormField = {
  name: 'warranty',
  label: 'Warranty',
  type: 'select',
  required: false,
  options: ['No Warranty', 'Under Warranty (< 6 months)', 'Under Warranty (6-12 months)', 'Under Warranty (1+ years)'],
  appliesTo: 'all',
};

// Year field
export const yearField: FormField = {
  name: 'year',
  label: 'Year',
  type: 'number',
  required: false,
  min: 1980,
  max: 2025,
  placeholder: 'e.g., 2020',
  appliesTo: 'all',
};
