/**
 * Common Fields - Used across multiple categories
 */

import type { TextField, NumberField, SelectField } from '../types';
import { MIN_MODEL_YEAR, MAX_MODEL_YEAR } from '../sharedFields';

// Condition field variants. Only two options exist on purpose — the ads.condition
// column normalizes anything else to "Used" (see sharedFields.CONDITION_OPTIONS).
export const conditionNewUsed: SelectField = {
  name: 'condition',
  label: 'Condition',
  labelNe: 'अवस्था',
  type: 'select',
  required: true,
  options: ['Brand New', 'Used'],
  optionsNe: ['नयाँ', 'पुरानो'],
  appliesTo: 'all',};

export const conditionOptional: SelectField = {
  name: 'condition',
  label: 'Condition',
  labelNe: 'अवस्था',
  type: 'select',
  required: false,
  options: ['Brand New', 'Used'],
  optionsNe: ['नयाँ', 'पुरानो'],
  appliesTo: 'all',};

// Brand field - base definition (placeholder should be overridden)
export const brandField: TextField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'text',
  required: false,
  placeholder: 'Enter brand name',
  placeholderNe: 'ब्रान्ड नाम लेख्नुहोस्',
  appliesTo: 'all',};

// Model field
export const modelField: TextField = {
  name: 'model',
  label: 'Model',
  labelNe: 'मोडेल',
  type: 'text',
  required: false,
  placeholder: 'Enter model name',
  placeholderNe: 'मोडेल नाम लेख्नुहोस्',
  appliesTo: 'all',};

// Color field
export const colorField: TextField = {
  name: 'color',
  label: 'Color',
  labelNe: 'रङ',
  type: 'text',
  required: false,
  placeholder: 'e.g., Black, White, Red',
  placeholderNe: 'जस्तै, कालो, सेतो, रातो',
  appliesTo: 'all',};

// Warranty field
export const warrantyField: SelectField = {
  name: 'warranty',
  label: 'Warranty',
  labelNe: 'वारेन्टी',
  type: 'select',
  required: false,
  options: ['No Warranty', 'Under Warranty (< 6 months)', 'Under Warranty (6-12 months)', 'Under Warranty (1+ years)'],
  optionsNe: ['वारेन्टी छैन', 'वारेन्टी अन्तर्गत (< ६ महिना)', 'वारेन्टी अन्तर्गत (६-१२ महिना)', 'वारेन्टी अन्तर्गत (१+ वर्ष)'],
  appliesTo: 'all',};

// Year field
export const yearField: NumberField = {
  name: 'year',
  label: 'Year',
  labelNe: 'वर्ष',
  type: 'number',
  required: false,
  min: MIN_MODEL_YEAR,
  max: MAX_MODEL_YEAR,
  placeholder: 'e.g., 2020',
  placeholderNe: 'जस्तै, २०२०',
  appliesTo: 'all',};
