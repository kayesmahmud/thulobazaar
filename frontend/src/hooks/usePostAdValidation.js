/**
 * Custom hook for validating PostAd form data
 * Separates validation logic from component for better reusability and testing
 */
export function usePostAdValidation() {
  /**
   * Validates basic form fields
   */
  const validateBasicFields = (formData, mainCategoryId, subcategories) => {
    // Title validation
    if (!formData.title.trim()) {
      throw new Error('Title is required');
    }

    // Description validation
    if (!formData.description.trim()) {
      throw new Error('Description is required');
    }

    // Price validation
    if (!formData.price || parseFloat(formData.price) <= 0) {
      throw new Error('Valid price is required');
    }

    // Category validation
    if (!mainCategoryId) {
      throw new Error('Please select a category');
    }

    // Subcategory validation (if subcategories exist)
    if (subcategories.length > 0 && !formData.categoryId) {
      throw new Error('Please select a subcategory');
    }

    // Final category ID validation
    if (!formData.categoryId) {
      throw new Error('Category is required');
    }

    // Area/Location validation
    if (!formData.areaId) {
      throw new Error('Please select an area/place for your ad');
    }

    // Seller name validation
    if (!formData.sellerName.trim()) {
      throw new Error('Seller name is required');
    }

    // Seller phone validation
    if (!formData.sellerPhone.trim()) {
      throw new Error('Seller phone is required');
    }
  };

  /**
   * Validates template-specific custom fields
   */
  const validateCustomFields = (validateFields, fields, customFields, setCustomFieldsErrors) => {
    if (validateFields && fields && fields.length > 0) {
      const validation = validateFields(customFields);
      if (!validation.isValid) {
        setCustomFieldsErrors(validation.errors);
        throw new Error('Please fill in all required fields');
      }
    }
  };

  /**
   * Main validation function that runs all validations
   */
  const validateAll = ({
    formData,
    mainCategoryId,
    subcategories,
    validateFields,
    fields,
    customFields,
    setCustomFieldsErrors
  }) => {
    // Validate basic fields
    validateBasicFields(formData, mainCategoryId, subcategories);

    // Validate template-specific custom fields
    validateCustomFields(validateFields, fields, customFields, setCustomFieldsErrors);
  };

  return {
    validateBasicFields,
    validateCustomFields,
    validateAll
  };
}
