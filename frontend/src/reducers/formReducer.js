// Action types for reducer
export const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_SELECTED_IMAGES: 'SET_SELECTED_IMAGES',
  SET_MAIN_CATEGORY: 'SET_MAIN_CATEGORY',
  SET_SUBCATEGORIES: 'SET_SUBCATEGORIES',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_SELECTED_SUBCATEGORY: 'SET_SELECTED_SUBCATEGORY',
  SET_SELECTED_AREA_DATA: 'SET_SELECTED_AREA_DATA',
  SET_CUSTOM_FIELDS: 'SET_CUSTOM_FIELDS',
  SET_CUSTOM_FIELDS_ERRORS: 'SET_CUSTOM_FIELDS_ERRORS',
  UPDATE_FORM_DATA: 'UPDATE_FORM_DATA',
  SET_FORM_DATA: 'SET_FORM_DATA',
  CLEAR_CUSTOM_FIELD_ERROR: 'CLEAR_CUSTOM_FIELD_ERROR'
};

// Reducer function for form state management
export function formReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };

    case ACTION_TYPES.SET_CATEGORIES:
      return { ...state, categories: action.payload };

    case ACTION_TYPES.SET_SELECTED_IMAGES:
      return { ...state, selectedImages: action.payload };

    case ACTION_TYPES.SET_MAIN_CATEGORY:
      return { ...state, mainCategoryId: action.payload };

    case ACTION_TYPES.SET_SUBCATEGORIES:
      return { ...state, subcategories: action.payload };

    case ACTION_TYPES.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload };

    case ACTION_TYPES.SET_SELECTED_SUBCATEGORY:
      return { ...state, selectedSubcategory: action.payload };

    case ACTION_TYPES.SET_SELECTED_AREA_DATA:
      return { ...state, selectedAreaData: action.payload };

    case ACTION_TYPES.SET_CUSTOM_FIELDS:
      return { ...state, customFields: action.payload };

    case ACTION_TYPES.SET_CUSTOM_FIELDS_ERRORS:
      return { ...state, customFieldsErrors: action.payload };

    case ACTION_TYPES.UPDATE_FORM_DATA:
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };

    case ACTION_TYPES.SET_FORM_DATA:
      return { ...state, formData: action.payload };

    case ACTION_TYPES.CLEAR_CUSTOM_FIELD_ERROR:
      const newErrors = { ...state.customFieldsErrors };
      delete newErrors[action.payload];
      return { ...state, customFieldsErrors: newErrors };

    default:
      return state;
  }
}
