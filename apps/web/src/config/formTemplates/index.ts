/**
 * Form Templates - Main Export
 *
 * Provides form field configurations for different ad categories.
 *
 * @example
 * // Import types
 * import type { FormField, FormTemplate, TemplateName } from '@/config/formTemplates';
 *
 * @example
 * // Import templates
 * import { FORM_TEMPLATES, getTemplateForCategory, getApplicableFields } from '@/config/formTemplates';
 *
 * @example
 * // Use the hook for React components
 * import { useFormTemplate } from '@/hooks/useFormTemplate';
 */

// Types
export type {
  FieldType,
  AppliesTo,
  BaseField,
  TextField,
  NumberField,
  SelectField,
  MultiselectField,
  CheckboxField,
  DateField,
  FormField,
  FormTemplate,
  TemplateName,
  FormTemplates,
  CategoryTemplateMap,
  // Subcategory config types
  FieldOverride,
  FieldRef,
  SubcategoryConfig,
  SubcategoryConfigMap,
} from './types';

// Templates
import {
  electronicsTemplate,
  vehiclesTemplate,
  propertyTemplate,
  fashionTemplate,
  petsTemplate,
  servicesTemplate,
  generalTemplate,
} from './templates';
import type { FormTemplates, FormField } from './types';

export const FORM_TEMPLATES: FormTemplates = {
  electronics: electronicsTemplate,
  vehicles: vehiclesTemplate,
  property: propertyTemplate,
  fashion: fashionTemplate,
  pets: petsTemplate,
  services: servicesTemplate,
  general: generalTemplate,
};

// Individual template exports
export {
  electronicsTemplate,
  vehiclesTemplate,
  propertyTemplate,
  fashionTemplate,
  petsTemplate,
  servicesTemplate,
  generalTemplate,
};

// Category mapping
export { CATEGORY_TEMPLATE_MAP, getTemplateForCategory } from './categoryMapping';

/**
 * Get applicable fields for a subcategory
 */
export function getApplicableFields(templateName: string, subcategoryName: string): FormField[] {
  const template = FORM_TEMPLATES[templateName as keyof FormTemplates];
  if (!template) return [];

  return template.fields.filter(field => {
    if (field.appliesTo === 'all') return true;
    if (Array.isArray(field.appliesTo)) {
      return field.appliesTo.includes(subcategoryName);
    }
    return false;
  });
}

// Shared fields (for custom template creation)
export {
  CONDITION_OPTIONS,
  WARRANTY_OPTIONS,
  JOB_CATEGORIES,
  OVERSEAS_COUNTRIES,
  createConditionField,
  createBrandField,
  createModelField,
  createColorField,
  createWarrantyField,
} from './sharedFields';

// Subcategory configurations
export {
  SUBCATEGORY_CONFIGS,
  getSubcategoryConfig,
  getFieldsForSubcategory,
  hasSubcategoryConfig,
  getAllConfiguredSubcategories,
} from './subcategories';
