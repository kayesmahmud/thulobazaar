/**
 * Custom hook for validating PostAd form data
 * Separates validation logic from component for better reusability and testing
 */
export function usePostAdValidation() {
  /**
   * Validates basic form fields
   */
  const validateBasicFields = (formData, mainCategoryId, subcategories) => {
    if (!formData.title.trim()) {
      return 'Title is required';
    }
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      return 'Valid price is required';
    }
    if (!mainCategoryId) {
      return 'Please select a category';
    }
    if (subcategories.length > 0 && !formData.categoryId) {
      return 'Please select a subcategory';
    }
    if (!formData.categoryId) {
      return 'Category is required';
    }
    if (!formData.areaId) {
      return 'Please select an area/place for your ad';
    }
    if (!formData.sellerName.trim()) {
      return 'Seller name is required';
    }
    if (!formData.sellerPhone.trim()) {
      return 'Seller phone is required';
    }
    return null;
  };

  /**
   * Validates template-specific custom fields
   */
  const validateCustomFields = (validateFields, fields, customFields, setCustomFieldsErrors) => {
    if (validateFields && fields && fields.length > 0) {
      const validation = validateFields(customFields);
      if (!validation.isValid) {
        setCustomFieldsErrors(validation.errors);
        return 'Please fill in all required fields';
      }
    }
    return null;
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
    const basicErrors = validateBasicFields(formData, mainCategoryId, subcategories);
    if (basicErrors) return basicErrors;

    const customErrors = validateCustomFields(validateFields, fields, customFields, setCustomFieldsErrors);
    if (customErrors) return customErrors;

    return null;
  };

  return {
    validateAll
  };
}