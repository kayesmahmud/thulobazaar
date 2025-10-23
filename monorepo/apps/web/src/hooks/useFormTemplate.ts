import { useMemo } from 'react';
import { FORM_TEMPLATES, getApplicableFields, getTemplateForCategory, FormField } from '@/config/formTemplates';

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

/**
 * Custom hook for managing form templates based on category
 * Returns template configuration, fields, and validation rules
 *
 * EXACT PORT from old JavaScript version to TypeScript
 */
export function useFormTemplate(
  selectedCategory: Category | null,
  selectedSubcategory: Category | null,
  allCategories: Category[]
) {
  // Determine which template to use based on category
  const templateType = useMemo(() => {
    if (!selectedCategory) return null;

    // If this is a parent category, use its name directly
    if (selectedCategory.parent_id === null) {
      return getTemplateForCategory(selectedCategory.name, selectedCategory.name);
    }

    // If this is a subcategory, find parent category and use parent name
    const parentCategory = allCategories.find(cat => cat.id === selectedCategory.parent_id);
    if (parentCategory) {
      return getTemplateForCategory(selectedCategory.name, parentCategory.name);
    }

    // Default fallback
    return 'general';
  }, [selectedCategory, allCategories]);

  // Get the template configuration
  const template = useMemo(() => {
    if (!templateType) return null;
    return FORM_TEMPLATES[templateType];
  }, [templateType]);

  // Get applicable fields for the selected subcategory
  const applicableFields = useMemo<FormField[]>(() => {
    if (!template || !selectedSubcategory) return [];

    return getApplicableFields(templateType || 'general', selectedSubcategory.name);
  }, [template, selectedSubcategory, templateType]);

  // Validate custom fields based on template rules
  const validateFields = (customFields: Record<string, any>) => {
    const errors: Record<string, string> = {};

    applicableFields.forEach(field => {
      const value = customFields[field.name];

      // Check required fields
      if (field.required && (!value || value === '' || (Array.isArray(value) && value.length === 0))) {
        errors[field.name] = `${field.label} is required`;
      }

      // Validate number fields
      if (field.type === 'number' && value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors[field.name] = `${field.label} must be a valid number`;
        } else {
          if (field.min !== undefined && numValue < field.min) {
            errors[field.name] = `${field.label} must be at least ${field.min}`;
          }
          if (field.max !== undefined && numValue > field.max) {
            errors[field.name] = `${field.label} must be at most ${field.max}`;
          }
        }
      }

      // Validate date fields
      if (field.type === 'date' && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field.name] = `${field.label} must be a valid date`;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Get initial empty values for all fields
  const getInitialValues = () => {
    const initialValues: Record<string, any> = {};

    applicableFields.forEach(field => {
      switch (field.type) {
        case 'multiselect':
          initialValues[field.name] = [];
          break;
        case 'checkbox':
          initialValues[field.name] = false;
          break;
        case 'number':
        case 'text':
        case 'select':
        case 'date':
        default:
          initialValues[field.name] = '';
      }
    });

    return initialValues;
  };

  return {
    templateType,
    template,
    fields: applicableFields,
    validateFields,
    getInitialValues
  };
}
