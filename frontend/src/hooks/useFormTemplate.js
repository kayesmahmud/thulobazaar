import { useMemo } from 'react';
import { FORM_TEMPLATES, getApplicableFields } from '../config/formTemplates';

/**
 * Custom hook for managing form templates based on category
 * Returns template configuration, fields, and validation rules
 */
export function useFormTemplate(category, subcategory) {
  // Determine which template to use based on category
  const templateType = useMemo(() => {
    if (!category) return null;

    // Get template from category's form_template field
    return category.form_template || 'general';
  }, [category]);

  // Get the template configuration
  const template = useMemo(() => {
    if (!templateType) return null;
    return FORM_TEMPLATES[templateType];
  }, [templateType]);

  // Get applicable fields for the selected subcategory
  const applicableFields = useMemo(() => {
    if (!template || !subcategory) return template?.fields || [];

    return getApplicableFields(templateType, subcategory.name);
  }, [template, subcategory, templateType]);

  // Validate custom fields based on template rules
  const validateFields = (customFields) => {
    const errors = {};

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
    const initialValues = {};

    applicableFields.forEach(field => {
      switch (field.type) {
        case 'multiselect':
          initialValues[field.name] = [];
          break;
        case 'checkbox':
          initialValues[field.name] = false;
          break;
        case 'number':
          initialValues[field.name] = '';
          break;
        default:
          initialValues[field.name] = '';
      }
    });

    return initialValues;
  };

  // Auto-lock gender field for fashion categories
  const getAutoLockedFields = () => {
    const locked = {};

    if (templateType === 'fashion' && category) {
      // Lock gender based on parent category
      if (category.name === "Men's Fashion & Grooming" || category.id === 7) {
        locked.gender = 'Men';
      } else if (category.name === "Women's Fashion & Beauty" || category.id === 8) {
        locked.gender = 'Women';
      }
    }

    return locked;
  };

  return {
    templateType,
    template,
    fields: applicableFields,
    validateFields,
    getInitialValues,
    getAutoLockedFields
  };
}
