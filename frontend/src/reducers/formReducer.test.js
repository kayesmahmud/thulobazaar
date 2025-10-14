import { describe, it, expect } from 'vitest';
import { formReducer, ACTION_TYPES } from './formReducer';

describe('formReducer', () => {
  const initialState = {
    loading: false,
    error: null,
    categories: [],
    selectedImages: [],
    mainCategoryId: '',
    subcategories: [],
    selectedCategory: null,
    selectedSubcategory: null,
    selectedAreaData: null,
    customFields: {},
    customFieldsErrors: {},
    formData: {
      title: '',
      description: '',
      price: '',
      categoryId: '',
      areaId: '',
      sellerName: '',
      sellerPhone: ''
    }
  };

  describe('SET_LOADING', () => {
    it('should set loading to true', () => {
      const action = { type: ACTION_TYPES.SET_LOADING, payload: true };
      const newState = formReducer(initialState, action);

      expect(newState.loading).toBe(true);
      expect(newState).not.toBe(initialState); // Ensure immutability
    });

    it('should set loading to false', () => {
      const state = { ...initialState, loading: true };
      const action = { type: ACTION_TYPES.SET_LOADING, payload: false };
      const newState = formReducer(state, action);

      expect(newState.loading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message', () => {
      const error = new Error('Test error');
      const action = { type: ACTION_TYPES.SET_ERROR, payload: error };
      const newState = formReducer(initialState, action);

      expect(newState.error).toBe(error);
    });

    it('should clear error', () => {
      const state = { ...initialState, error: new Error('Test') };
      const action = { type: ACTION_TYPES.SET_ERROR, payload: null };
      const newState = formReducer(state, action);

      expect(newState.error).toBeNull();
    });
  });

  describe('SET_CATEGORIES', () => {
    it('should set categories array', () => {
      const categories = [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Vehicles' }
      ];
      const action = { type: ACTION_TYPES.SET_CATEGORIES, payload: categories };
      const newState = formReducer(initialState, action);

      expect(newState.categories).toEqual(categories);
      expect(newState.categories).toHaveLength(2);
    });
  });

  describe('SET_SELECTED_IMAGES', () => {
    it('should set selected images', () => {
      const images = [new File([], 'test1.jpg'), new File([], 'test2.jpg')];
      const action = { type: ACTION_TYPES.SET_SELECTED_IMAGES, payload: images };
      const newState = formReducer(initialState, action);

      expect(newState.selectedImages).toEqual(images);
      expect(newState.selectedImages).toHaveLength(2);
    });
  });

  describe('SET_MAIN_CATEGORY', () => {
    it('should set main category ID', () => {
      const action = { type: ACTION_TYPES.SET_MAIN_CATEGORY, payload: '5' };
      const newState = formReducer(initialState, action);

      expect(newState.mainCategoryId).toBe('5');
    });
  });

  describe('SET_SUBCATEGORIES', () => {
    it('should set subcategories array', () => {
      const subcategories = [
        { id: 10, name: 'Smartphones' },
        { id: 11, name: 'Laptops' }
      ];
      const action = { type: ACTION_TYPES.SET_SUBCATEGORIES, payload: subcategories };
      const newState = formReducer(initialState, action);

      expect(newState.subcategories).toEqual(subcategories);
    });
  });

  describe('SET_SELECTED_CATEGORY', () => {
    it('should set selected category', () => {
      const category = { id: 1, name: 'Electronics' };
      const action = { type: ACTION_TYPES.SET_SELECTED_CATEGORY, payload: category };
      const newState = formReducer(initialState, action);

      expect(newState.selectedCategory).toEqual(category);
    });

    it('should set selected category to null', () => {
      const state = { ...initialState, selectedCategory: { id: 1, name: 'Test' } };
      const action = { type: ACTION_TYPES.SET_SELECTED_CATEGORY, payload: null };
      const newState = formReducer(state, action);

      expect(newState.selectedCategory).toBeNull();
    });
  });

  describe('SET_SELECTED_SUBCATEGORY', () => {
    it('should set selected subcategory', () => {
      const subcategory = { id: 10, name: 'Smartphones' };
      const action = { type: ACTION_TYPES.SET_SELECTED_SUBCATEGORY, payload: subcategory };
      const newState = formReducer(initialState, action);

      expect(newState.selectedSubcategory).toEqual(subcategory);
    });
  });

  describe('SET_SELECTED_AREA_DATA', () => {
    it('should set selected area data', () => {
      const areaData = { areaId: 301, name: 'Kathmandu' };
      const action = { type: ACTION_TYPES.SET_SELECTED_AREA_DATA, payload: areaData };
      const newState = formReducer(initialState, action);

      expect(newState.selectedAreaData).toEqual(areaData);
    });
  });

  describe('SET_CUSTOM_FIELDS', () => {
    it('should set custom fields', () => {
      const customFields = { brand: 'Apple', condition: 'New' };
      const action = { type: ACTION_TYPES.SET_CUSTOM_FIELDS, payload: customFields };
      const newState = formReducer(initialState, action);

      expect(newState.customFields).toEqual(customFields);
    });

    it('should replace existing custom fields', () => {
      const state = { ...initialState, customFields: { brand: 'Samsung' } };
      const customFields = { brand: 'Apple', model: 'iPhone 14' };
      const action = { type: ACTION_TYPES.SET_CUSTOM_FIELDS, payload: customFields };
      const newState = formReducer(state, action);

      expect(newState.customFields).toEqual(customFields);
      expect(newState.customFields.model).toBe('iPhone 14');
    });
  });

  describe('SET_CUSTOM_FIELDS_ERRORS', () => {
    it('should set custom field errors', () => {
      const errors = { brand: 'Brand is required' };
      const action = { type: ACTION_TYPES.SET_CUSTOM_FIELDS_ERRORS, payload: errors };
      const newState = formReducer(initialState, action);

      expect(newState.customFieldsErrors).toEqual(errors);
    });

    it('should clear custom field errors', () => {
      const state = { ...initialState, customFieldsErrors: { brand: 'Error' } };
      const action = { type: ACTION_TYPES.SET_CUSTOM_FIELDS_ERRORS, payload: {} };
      const newState = formReducer(state, action);

      expect(newState.customFieldsErrors).toEqual({});
    });
  });

  describe('UPDATE_FORM_DATA', () => {
    it('should update single form field', () => {
      const action = { type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { title: 'iPhone 14' } };
      const newState = formReducer(initialState, action);

      expect(newState.formData.title).toBe('iPhone 14');
      expect(newState.formData.description).toBe(''); // Other fields unchanged
    });

    it('should update multiple form fields', () => {
      const action = {
        type: ACTION_TYPES.UPDATE_FORM_DATA,
        payload: { title: 'iPhone 14', price: '150000' }
      };
      const newState = formReducer(initialState, action);

      expect(newState.formData.title).toBe('iPhone 14');
      expect(newState.formData.price).toBe('150000');
    });

    it('should merge with existing form data', () => {
      const state = {
        ...initialState,
        formData: { ...initialState.formData, title: 'Old Title', description: 'Old Desc' }
      };
      const action = { type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { title: 'New Title' } };
      const newState = formReducer(state, action);

      expect(newState.formData.title).toBe('New Title');
      expect(newState.formData.description).toBe('Old Desc'); // Unchanged
    });
  });

  describe('SET_FORM_DATA', () => {
    it('should replace entire form data', () => {
      const newFormData = {
        title: 'iPhone 14',
        description: 'Brand new',
        price: '150000',
        categoryId: '1',
        areaId: '301',
        sellerName: 'John Doe',
        sellerPhone: '9800000000'
      };
      const action = { type: ACTION_TYPES.SET_FORM_DATA, payload: newFormData };
      const newState = formReducer(initialState, action);

      expect(newState.formData).toEqual(newFormData);
    });
  });

  describe('CLEAR_CUSTOM_FIELD_ERROR', () => {
    it('should remove specific error from customFieldsErrors', () => {
      const state = {
        ...initialState,
        customFieldsErrors: {
          brand: 'Brand is required',
          condition: 'Condition is required'
        }
      };
      const action = { type: ACTION_TYPES.CLEAR_CUSTOM_FIELD_ERROR, payload: 'brand' };
      const newState = formReducer(state, action);

      expect(newState.customFieldsErrors).toEqual({ condition: 'Condition is required' });
      expect(newState.customFieldsErrors.brand).toBeUndefined();
    });

    it('should handle clearing non-existent error', () => {
      const state = {
        ...initialState,
        customFieldsErrors: { brand: 'Brand is required' }
      };
      const action = { type: ACTION_TYPES.CLEAR_CUSTOM_FIELD_ERROR, payload: 'nonexistent' };
      const newState = formReducer(state, action);

      expect(newState.customFieldsErrors).toEqual({ brand: 'Brand is required' });
    });
  });

  describe('Default case', () => {
    it('should return unchanged state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION', payload: 'test' };
      const newState = formReducer(initialState, action);

      expect(newState).toBe(initialState);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state', () => {
      const state = { ...initialState };
      const action = { type: ACTION_TYPES.SET_LOADING, payload: true };
      const newState = formReducer(state, action);

      expect(state.loading).toBe(false); // Original unchanged
      expect(newState.loading).toBe(true); // New state updated
      expect(newState).not.toBe(state); // Different objects
    });

    it('should not mutate nested objects', () => {
      const state = { ...initialState };
      const action = { type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { title: 'Test' } };
      const newState = formReducer(state, action);

      expect(state.formData.title).toBe(''); // Original unchanged
      expect(newState.formData.title).toBe('Test'); // New state updated
      expect(newState.formData).not.toBe(state.formData); // Different objects
    });
  });
});
