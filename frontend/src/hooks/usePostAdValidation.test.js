import { describe, it, expect, vi } from 'vitest';
import { usePostAdValidation } from './usePostAdValidation';

describe('usePostAdValidation Hook', () => {
  describe('validateAll - Basic Fields', () => {
    it('should return error when title is empty', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: '',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Title is required');
    });

    it('should return error when description is empty', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: '',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Description is required');
    });

    it('should return error when price is zero', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '0',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Valid price is required');
    });

    it('should return error when price is negative', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '-100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Valid price is required');
    });

    it('should return error when main category is not selected', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Please select a category');
    });

    it('should return error when subcategory exists but not selected', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };
      const subcategories = [
        { id: 1, name: 'Subcategory 1' },
        { id: 2, name: 'Subcategory 2' }
      ];

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories,
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Please select a subcategory');
    });

    it('should return error when areaId is not selected', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Please select an area/place for your ad');
    });

    it('should return error when seller name is empty', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: '',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Seller name is required');
    });

    it('should return error when seller phone is empty', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: ''
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBe('Seller phone is required');
    });

    it('should return null when all basic fields are valid', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBeNull();
    });

    it('should return null when category has no subcategories', () => {
      const { validateAll } = usePostAdValidation();
      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: vi.fn()
      });

      expect(error).toBeNull();
    });
  });

  describe('validateAll - Custom Fields', () => {
    it('should call setCustomFieldsErrors when custom validation fails', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const mockValidateFields = () => ({
        isValid: false,
        errors: { condition: 'Condition is required' }
      });

      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const fields = [{ name: 'condition', required: true }];
      const customFields = { condition: '' };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: mockValidateFields,
        fields,
        customFields,
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBe('Please fill in all required fields');
      expect(mockSetErrors).toHaveBeenCalledWith({ condition: 'Condition is required' });
    });

    it('should return null when custom field validation passes', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const mockValidateFields = () => ({
        isValid: true,
        errors: {}
      });

      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const fields = [{ name: 'condition', required: true }];
      const customFields = { condition: 'New' };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: mockValidateFields,
        fields,
        customFields,
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBeNull();
    });

    it('should return null when no custom fields to validate', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBeNull();
    });
  });

  describe('validateAll - Integration', () => {
    it('should run all validations successfully', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const mockValidateFields = () => ({
        isValid: true,
        errors: {}
      });

      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: mockValidateFields,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBeNull();
    });

    it('should return error when basic validation fails', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const formData = {
        title: '',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: null,
        fields: [],
        customFields: {},
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBe('Title is required');
    });

    it('should return error when custom fields validation fails', () => {
      const { validateAll } = usePostAdValidation();
      const mockSetErrors = vi.fn();

      const mockValidateFields = () => ({
        isValid: false,
        errors: { brand: 'Brand is required' }
      });

      const formData = {
        title: 'Test Title',
        description: 'Test description',
        price: '100',
        categoryId: '1',
        areaId: '1',
        sellerName: 'John Doe',
        sellerPhone: '1234567890'
      };

      const error = validateAll({
        formData,
        mainCategoryId: '1',
        subcategories: [],
        validateFields: mockValidateFields,
        fields: [{ name: 'brand', required: true }],
        customFields: { brand: '' },
        setCustomFieldsErrors: mockSetErrors
      });

      expect(error).toBe('Please fill in all required fields');
      expect(mockSetErrors).toHaveBeenCalledWith({ brand: 'Brand is required' });
    });
  });
});
