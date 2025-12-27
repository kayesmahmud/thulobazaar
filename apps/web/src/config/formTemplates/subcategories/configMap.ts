/**
 * Combined Subcategory Configuration Map
 *
 * This file combines all subcategory configs into a single map
 * and provides helper functions to retrieve configs.
 */

import type { SubcategoryConfig, SubcategoryConfigMap, FormField } from '../types';
import { electronicsSubcategories } from './electronics';
import { vehiclesSubcategories } from './vehicles';
import { propertySubcategories } from './property';
import { servicesSubcategories } from './services';
import { fashionSubcategories } from './fashion';
import { petsSubcategories } from './pets';
import { generalSubcategories } from './general';

/**
 * Master map of all subcategory configurations
 */
export const SUBCATEGORY_CONFIGS: SubcategoryConfigMap = {
  ...electronicsSubcategories,
  ...vehiclesSubcategories,
  ...propertySubcategories,
  ...servicesSubcategories,
  ...fashionSubcategories,
  ...petsSubcategories,
  ...generalSubcategories,
};

/**
 * Get the configuration for a specific subcategory
 *
 * @param subcategoryName - The name of the subcategory
 * @returns The subcategory config or undefined if not found
 */
export function getSubcategoryConfig(subcategoryName: string): SubcategoryConfig | undefined {
  return SUBCATEGORY_CONFIGS[subcategoryName];
}

/**
 * Get the form fields for a subcategory with overrides applied
 *
 * @param subcategoryName - The name of the subcategory
 * @returns Array of form fields with overrides applied, or empty array if not found
 */
export function getFieldsForSubcategory(subcategoryName: string): FormField[] {
  const config = getSubcategoryConfig(subcategoryName);

  if (!config) {
    return [];
  }

  return config.fields.map(({ field, override }) => {
    if (!override) {
      return field;
    }

    // Apply overrides to create a new field
    const overriddenField = { ...field };

    if (override.placeholder !== undefined && 'placeholder' in overriddenField) {
      (overriddenField as { placeholder?: string }).placeholder = override.placeholder;
    }

    if (override.options !== undefined && 'options' in overriddenField) {
      (overriddenField as { options: string[] }).options = override.options;
    }

    if (override.required !== undefined) {
      overriddenField.required = override.required;
    }

    if (override.label !== undefined) {
      overriddenField.label = override.label;
    }

    return overriddenField;
  });
}

/**
 * Check if a subcategory has a custom configuration
 */
export function hasSubcategoryConfig(subcategoryName: string): boolean {
  return subcategoryName in SUBCATEGORY_CONFIGS;
}

/**
 * Get all configured subcategory names
 */
export function getAllConfiguredSubcategories(): string[] {
  return Object.keys(SUBCATEGORY_CONFIGS);
}
