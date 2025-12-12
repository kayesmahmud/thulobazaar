/**
 * Shared/Common Field Definitions
 * These fields are reused across multiple templates
 */

import type { SelectField, TextField, AppliesTo } from './types';

// Common condition field options
export const CONDITION_OPTIONS = {
  NEW_USED: ['Brand New', 'Used'] as const,
  NEW_RECONDITIONED_USED: ['Brand New', 'Reconditioned', 'Used'] as const,
};

// Common warranty options
export const WARRANTY_OPTIONS = [
  'No Warranty',
  'Under Warranty (< 6 months)',
  'Under Warranty (6-12 months)',
  'Under Warranty (1+ years)',
] as const;

// Job categories list - used in multiple fields
export const JOB_CATEGORIES = [
  'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
  'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
  'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
  'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
  'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
  'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
  'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
  'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
  'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
  'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
  'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
  'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
  'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other',
] as const;

// Overseas job countries
export const OVERSEAS_COUNTRIES = [
  'Bulgaria', 'Croatia', 'Serbia', 'Saudi Arabia', 'UAE', 'Qatar', 'Malaysia', 'Singapore',
] as const;

// Field factory functions for creating common fields with custom appliesTo

export function createConditionField(
  options: readonly string[],
  appliesTo: AppliesTo = 'all',
  required = true
): SelectField {
  return {
    name: 'condition',
    label: 'Condition',
    type: 'select',
    required,
    options: [...options],
    appliesTo,
  };
}

export function createBrandField(
  placeholder: string,
  appliesTo: AppliesTo = 'all',
  required = true
): TextField {
  return {
    name: 'brand',
    label: 'Brand',
    type: 'text',
    required,
    placeholder,
    appliesTo,
  };
}

export function createModelField(
  placeholder: string,
  appliesTo: AppliesTo = 'all',
  required = false
): TextField {
  return {
    name: 'model',
    label: 'Model',
    type: 'text',
    required,
    placeholder,
    appliesTo,
  };
}

export function createColorField(
  placeholder = 'e.g., Black, White, Red',
  appliesTo: AppliesTo = 'all',
  required = false
): TextField {
  return {
    name: 'color',
    label: 'Color',
    type: 'text',
    required,
    placeholder,
    appliesTo,
  };
}

export function createWarrantyField(appliesTo: AppliesTo = 'all'): SelectField {
  return {
    name: 'warranty',
    label: 'Warranty',
    type: 'select',
    required: false,
    options: [...WARRANTY_OPTIONS],
    appliesTo,
  };
}
