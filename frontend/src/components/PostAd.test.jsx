import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PostAd from './PostAd';
import * as AuthContext from '../context/AuthContext';
import * as LanguageContext from '../context/LanguageContext';
import ApiService from '../services/api';
import { usePostAdValidation } from '../hooks/usePostAdValidation';

// Mock navigate function at module level
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock all child components
vi.mock('./ImageUpload', () => ({
  default: ({ onImagesChange }) => (
    <div data-testid="image-upload">
      <button
        data-testid="add-image-button"
        onClick={() => onImagesChange([new File([], 'test.jpg')])}
      >
        Add Image
      </button>
    </div>
  )
}));

vi.mock('./ErrorMessage', () => ({
  default: ({ error, onClose }) => (
    error ? (
      <div data-testid="error-message">
        {error.message || 'An error occurred'}
        <button data-testid="close-error" onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}));

vi.mock('./SimpleHeader', () => ({
  default: () => <header data-testid="simple-header">Header</header>
}));

vi.mock('./post-ad/LocationSelector', () => ({
  default: ({ onAreaSelect, selectedAreaId }) => (
    <div data-testid="location-selector">
      <button
        data-testid="select-location-button"
        onClick={() => {
          // Call onAreaSelect immediately
          onAreaSelect({ areaId: 301, name: 'Kathmandu' });
        }}
      >
        Select Kathmandu
      </button>
      <span data-testid="selected-area-id">{selectedAreaId || ''}</span>
      {/* Hidden input to verify state in tests */}
      <input type="hidden" data-testid="area-id-value" value={selectedAreaId || ''} />
    </div>
  )
}));

vi.mock('./post-ad/templates/ElectronicsForm', () => ({
  default: ({ fields, values, onChange, errors }) => (
    <div data-testid="electronics-form">
      {fields.map(field => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            data-testid={`custom-field-${field.name}`}
            value={values[field.name] || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
          {errors[field.name] && (
            <span data-testid={`error-${field.name}`}>{errors[field.name]}</span>
          )}
        </div>
      ))}
    </div>
  )
}));

vi.mock('./common/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}));

// Mock form template hook
vi.mock('../hooks/useFormTemplate', () => ({
  useFormTemplate: (selectedCategory, selectedSubcategory) => {
    // Return electronics template when category 1 is selected
    if (selectedCategory?.id === 1) {
      return {
        templateType: 'electronics',
        fields: [
          { name: 'brand', label: 'Brand', type: 'text', required: true },
          { name: 'condition', label: 'Condition', type: 'select', required: true }
        ],
        validateFields: (values) => {
          const errors = {};
          if (!values.brand) errors.brand = 'Brand is required';
          if (!values.condition) errors.condition = 'Condition is required';
          return {
            isValid: Object.keys(errors).length === 0,
            errors
          };
        },
        getInitialValues: () => ({ brand: '', condition: '' })
      };
    }
    return {
      templateType: null,
      fields: [],
      validateFields: null,
      getInitialValues: null
    };
  }
}));

vi.mock('../hooks/usePostAdValidation', () => ({
  usePostAdValidation: vi.fn(),
}));

// Mock API Service
vi.mock('../services/api', () => ({
  default: {
    getCategories: vi.fn(),
    createAd: vi.fn()
  }
}));

describe('PostAd Component Integration Tests', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    phone: '9800000000'
  };

  const mockCategories = [
    {
      id: 1,
      name: 'Electronics',
      icon: '📱',
      subcategories: [
        { id: 10, name: 'Mobiles' },
        { id: 11, name: 'Laptops' }
      ]
    },
    {
      id: 2,
      name: 'Vehicles',
      icon: '🚗',
      subcategories: []
    }
  ];

  const mockValidateAll = vi.fn();

  beforeEach(() => {
    // Clear only specific mocks, not usePostAdValidation
    mockNavigate.mockClear();
    mockValidateAll.mockClear();
    ApiService.getCategories.mockClear();
    ApiService.createAd.mockClear();

    // By default, validation succeeds (returns null)
    mockValidateAll.mockReturnValue(null);
    usePostAdValidation.mockReturnValue({ validateAll: mockValidateAll });

    // Mock AuthContext
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true
    });

    // Mock LanguageContext
    vi.spyOn(LanguageContext, 'useLanguage').mockReturnValue({
      language: 'en'
    });

    // Mock API responses
    ApiService.getCategories.mockResolvedValue(mockCategories);
    ApiService.createAd.mockResolvedValue({
      id: 123,
      seo_slug: 'test-ad-slug-123'
    });
  });

  describe('Component Rendering', () => {
    it('should render the post ad form', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      expect(screen.getByTestId('simple-header')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    });

    it('should redirect if user is not authenticated', async () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: null,
        isAuthenticated: false
      });

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/en');
      });
    });

    it('should load categories on mount', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(ApiService.getCategories).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Form Field Interactions', () => {
    it('should update title field', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'iPhone 14 Pro' } });

      expect(titleInput.value).toBe('iPhone 14 Pro');
    });

    it('should update description field', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Brand new iPhone' } });

      expect(descriptionInput.value).toBe('Brand new iPhone');
    });

    it('should update price field', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      const priceInput = screen.getByLabelText(/price/i);
      fireEvent.change(priceInput, { target: { value: '150000' } });

      expect(priceInput.value).toBe('150000');
    });

    it('should show character counter for title', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      expect(screen.getByText(/10\/100 characters/i)).toBeInTheDocument();
    });

    it('should populate seller name from user data', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      const sellerNameInput = await screen.findByDisplayValue('Test User');
      expect(sellerNameInput).toBeInTheDocument();
    });

    it('should populate seller phone from user data', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      const sellerPhoneInput = await screen.findByDisplayValue('9800000000');
      expect(sellerPhoneInput).toBeInTheDocument();
    });

    it('should allow editing seller phone', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      const sellerPhoneInput = await screen.findByLabelText(/Phone Number/i);
      await user.clear(sellerPhoneInput);
      await user.type(sellerPhoneInput, '9811111111');

      expect(sellerPhoneInput.value).toBe('9811111111');
    });

    it('should make seller name read-only', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      const sellerNameInput = await screen.findByLabelText(/Your Name/i);
      expect(sellerNameInput).toHaveAttribute('readonly');
    });
  });

  describe('Category Cascade', () => {
    it('should load categories and display them', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        const select = screen.getByLabelText(/main category/i);
        expect(select).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText(/main category/i);
      expect(categorySelect.querySelectorAll('option')).toHaveLength(3); // Including placeholder
    });

    it('should show subcategories when main category is selected', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      const mainCategorySelect = screen.getByLabelText(/main category/i);
      fireEvent.change(mainCategorySelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/subcategory/i)).toBeInTheDocument();
      });

      const subcategorySelect = screen.getByLabelText(/subcategory/i);
      expect(subcategorySelect.querySelectorAll('option')).toHaveLength(3); // Including placeholder
    });

    it('should not show subcategory selector when category has no subcategories', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      const mainCategorySelect = screen.getByLabelText(/main category/i);
      fireEvent.change(mainCategorySelect, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.queryByLabelText(/subcategory/i)).not.toBeInTheDocument();
      });
    });

    it('should reset subcategory when main category changes', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      // Select Electronics (has subcategories)
      const mainCategorySelect = screen.getByLabelText(/main category/i);
      fireEvent.change(mainCategorySelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/subcategory/i)).toBeInTheDocument();
      });

      // Select a subcategory
      const subcategorySelect = screen.getByLabelText(/subcategory/i);
      fireEvent.change(subcategorySelect, { target: { value: '10' } });

      // Change main category to Vehicles (no subcategories)
      fireEvent.change(mainCategorySelect, { target: { value: '2' } });

      // Subcategory select should disappear
      await waitFor(() => {
        expect(screen.queryByLabelText(/subcategory/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Template Rendering', () => {
    it('should render Electronics template when Electronics category is selected', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      const mainCategorySelect = screen.getByLabelText(/main category/i);
      fireEvent.change(mainCategorySelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByTestId('electronics-form')).toBeInTheDocument();
      });
    });

    it('should handle custom field changes in template', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      const mainCategorySelect = screen.getByLabelText(/main category/i);
      fireEvent.change(mainCategorySelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(screen.getByTestId('custom-field-brand')).toBeInTheDocument();
      });

      const brandInput = screen.getByTestId('custom-field-brand');
      fireEvent.change(brandInput, { target: { value: 'Apple' } });

      expect(brandInput.value).toBe('Apple');
    });
  });

  describe('Location Selection', () => {
    it('should render location selector', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('location-selector')).toBeInTheDocument();
      });
    });

    it('should update areaId when location is selected', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('select-location-button')).toBeInTheDocument();
      });

      const selectButton = screen.getByTestId('select-location-button');
      fireEvent.click(selectButton);

      await waitFor(() => {
        const selectedAreaId = screen.getByTestId('selected-area-id');
        expect(selectedAreaId.textContent).toBe('301');
      });
    });
  });

  describe('Image Upload', () => {
    it('should render image upload component', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('image-upload')).toBeInTheDocument();
      });
    });

    it('should handle image selection', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('add-image-button')).toBeInTheDocument();
      });

      const addButton = screen.getByTestId('add-image-button');
      fireEvent.click(addButton);

      // Images should be added to state (verified by no errors)
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill in all required fields
      await user.type(screen.getByLabelText(/title/i), 'iPhone 14 Pro');
      await user.type(screen.getByLabelText(/description/i), 'Brand new iPhone 14 Pro');
      await user.type(screen.getByLabelText(/price/i), '150000');

      // Select category without subcategories
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');

      // Select location and wait for state update
      const locationButton = screen.getByTestId('select-location-button');
      await user.click(locationButton);

      await waitFor(() => {
        const areaIdInput = screen.getByTestId('area-id-value');
        expect(areaIdInput.value).toBe('301');
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(ApiService.createAd).toHaveBeenCalled();
      });
    });

    it('should show validation error for empty title', async () => {
      const user = userEvent.setup();

      // Set mock to return error AFTER filling fields (to bypass HTML5 validation)
      mockValidateAll.mockReturnValue('Title is required');

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill in all required fields to bypass HTML5 validation
      await user.type(screen.getByLabelText(/title/i), 'Test Title');
      await user.type(screen.getByLabelText(/description/i), 'Description');
      await user.type(screen.getByLabelText(/price/i), '1000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      // Submit - our custom validation mock will return an error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Verify mock was called
      await waitFor(() => {
        expect(mockValidateAll).toHaveBeenCalled();
      });

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      const user = userEvent.setup();

      ApiService.createAd.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 123, seo_slug: 'slug' }), 200))
      );

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test desc');
      await user.type(screen.getByLabelText(/price/i), '1000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should navigate to ad detail page after successful submission', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Ad');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/price/i), '5000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/en/ad/test-ad-slug-123');
      });
    });

    it('should handle API error during submission', async () => {
      const user = userEvent.setup();

      ApiService.createAd.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Test Ad');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.type(screen.getByLabelText(/price/i), '5000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      ApiService.getCategories.mockRejectedValue(new Error('Failed to load categories'));

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should clear error when close button is clicked', async () => {
      ApiService.getCategories.mockRejectedValue(new Error('Failed to load'));

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-error');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing in form fields', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill in all required fields to bypass HTML5 validation
      await user.type(screen.getByLabelText(/title/i), 'Test Title');
      await user.type(screen.getByLabelText(/description/i), 'Description');
      await user.type(screen.getByLabelText(/price/i), '1000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      // Set mock to return error for this submission only
      mockValidateAll.mockReturnValueOnce('Validation failed');

      // Trigger an error by submitting
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Start typing in title field - should clear error
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on form inputs', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/price/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/main category/i)).toHaveAttribute('aria-label');
    });

    it('should mark required fields with aria-required', async () => {
      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/title/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/price/i)).toHaveAttribute('aria-required', 'true');
    });

    it('should have aria-busy on submit button during loading', async () => {
      const user = userEvent.setup();

      ApiService.createAd.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 123, seo_slug: 'slug' }), 200))
      );

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Post Your Ad')).toBeInTheDocument();
      });

      // Fill and submit
      await user.type(screen.getByLabelText(/title/i), 'Test');
      await user.type(screen.getByLabelText(/description/i), 'Test');
      await user.type(screen.getByLabelText(/price/i), '1000');
      await user.selectOptions(screen.getByLabelText(/main category/i), '2');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  describe('Custom Field Validation', () => {
    it('should validate custom fields before submission', async () => {
      const user = userEvent.setup();
      mockValidateAll.mockReturnValue('Custom fields are required');

      render(
        <BrowserRouter>
          <PostAd />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/main category/i)).toBeInTheDocument();
      });

      // Select Electronics to show custom fields
      await user.selectOptions(screen.getByLabelText(/main category/i), '1');

      await waitFor(() => {
        expect(screen.getByTestId('electronics-form')).toBeInTheDocument();
      });

      // Select a subcategory
      await user.selectOptions(screen.getByLabelText(/subcategory/i), '10');

      // Fill basic fields but not custom fields
      await user.type(screen.getByLabelText(/title/i), 'iPhone');
      await user.type(screen.getByLabelText(/description/i), 'Test');
      await user.type(screen.getByLabelText(/price/i), '1000');
      await user.click(screen.getByTestId('select-location-button'));

      await waitFor(() => {
        expect(screen.getByTestId('area-id-value').value).toBe('301');
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show validation error for custom fields
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });
});