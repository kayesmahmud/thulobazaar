import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './common/Toast';
import { useFormTemplate } from '../hooks/useFormTemplate';
import { usePostAdValidation } from '../hooks/usePostAdValidation';
import ApiService from '../services/api';
import {
  CHAR_LIMITS,
  IMAGE_LIMITS,
  TIMEOUTS,
  PLACEHOLDERS,
  MESSAGES,
  LABELS,
  SECTIONS,
  PRICE_CONSTRAINTS,
  ARIA_IDS,
  ARIA_LABELS
} from '../constants/postAdConstants';
import ImageUpload from './ImageUpload';
import ErrorMessage from './ErrorMessage';
import SimpleHeader from './SimpleHeader';
import LocationSelector from './post-ad/LocationSelector';
import ElectronicsForm from './post-ad/templates/ElectronicsForm';
import VehiclesForm from './post-ad/templates/VehiclesForm';
import PropertyForm from './post-ad/templates/PropertyForm';
import FashionForm from './post-ad/templates/FashionForm';
import HomeLivingForm from './post-ad/templates/HomeLivingForm';
import PetsForm from './post-ad/templates/PetsForm';
import ServicesForm from './post-ad/templates/ServicesForm';
import styles from './PostAd.module.css';

// Template component mapping
const TEMPLATE_COMPONENTS = {
  electronics: ElectronicsForm,
  vehicles: VehiclesForm,
  property: PropertyForm,
  fashion: FashionForm,
  pets: PetsForm,
  services: ServicesForm,
  general: HomeLivingForm // Used for Home & Living category
};

// Action types for reducer
const ACTION_TYPES = {
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
function formReducer(state, action) {
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

function PostAd() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();

  // Initial state for useReducer
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
      sellerName: user?.name || '',
      sellerPhone: user?.phone || ''
    }
  };

  // Replace all useState with single useReducer
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Destructure state for easier access
  const {
    loading,
    error,
    categories,
    selectedImages,
    mainCategoryId,
    subcategories,
    selectedCategory,
    selectedSubcategory,
    selectedAreaData,
    customFields,
    customFieldsErrors,
    formData
  } = state;

  // Use template hook to get applicable fields
  const { templateType, fields, validateFields, getInitialValues } = useFormTemplate(
    selectedCategory,
    selectedSubcategory
  );

  // Use validation hook for form validation
  const { validateAll } = usePostAdValidation();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate(`/${language}`);
      return;
    }

    // Load categories only (locations loaded by LocationSelector)
    const loadData = async () => {
      try {
        const categoriesData = await ApiService.getCategories(true); // true to include subcategories
        dispatch({
          type: ACTION_TYPES.SET_CATEGORIES,
          payload: Array.isArray(categoriesData) ? categoriesData : []
        });
      } catch (err) {
        console.error('Error loading form data:', err);
        dispatch({
          type: ACTION_TYPES.SET_ERROR,
          payload: new Error('Failed to load form data. Please refresh the page.')
        });
      }
    };

    loadData();
  }, [isAuthenticated, navigate, language]);

  useEffect(() => {
    // Update seller info when user data changes
    if (user) {
      dispatch({
        type: ACTION_TYPES.UPDATE_FORM_DATA,
        payload: {
          sellerName: user.name || '',
          sellerPhone: user.phone || ''
        }
      });
    }
  }, [user]);

  const handleInputChange = useCallback((field, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_FORM_DATA,
      payload: { [field]: value }
    });
    // Clear error when user starts typing
    if (error) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });
    }
  }, [error]);

  // Initialize custom fields when template changes
  useEffect(() => {
    if (templateType && getInitialValues) {
      const initialValues = getInitialValues();
      dispatch({ type: ACTION_TYPES.SET_CUSTOM_FIELDS, payload: initialValues });
      dispatch({ type: ACTION_TYPES.SET_CUSTOM_FIELDS_ERRORS, payload: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateType]);

  // Category cascade handlers
  const handleMainCategoryChange = useCallback((categoryId) => {
    dispatch({ type: ACTION_TYPES.SET_MAIN_CATEGORY, payload: categoryId });

    // Find the selected category and its subcategories
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    dispatch({ type: ACTION_TYPES.SET_SELECTED_CATEGORY, payload: category });

    if (category && category.subcategories && category.subcategories.length > 0) {
      dispatch({ type: ACTION_TYPES.SET_SUBCATEGORIES, payload: category.subcategories });
      dispatch({ type: ACTION_TYPES.SET_SELECTED_SUBCATEGORY, payload: null });
      // Clear subcategory selection and formData.categoryId
      dispatch({ type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { categoryId: '' } });
    } else {
      // No subcategories, use main category as final selection
      dispatch({ type: ACTION_TYPES.SET_SUBCATEGORIES, payload: [] });
      dispatch({ type: ACTION_TYPES.SET_SELECTED_SUBCATEGORY, payload: null });
      dispatch({ type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { categoryId: categoryId } });
    }

    if (error) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });
    }
  }, [categories, error]);

  const handleSubcategoryChange = useCallback((subcategoryId) => {
    const subcategory = subcategories.find(sub => sub.id === parseInt(subcategoryId));
    dispatch({ type: ACTION_TYPES.SET_SELECTED_SUBCATEGORY, payload: subcategory });
    dispatch({ type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { categoryId: subcategoryId } });
    if (error) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });
    }
  }, [subcategories, error]);

  // Custom fields handler
  const handleCustomFieldChange = useCallback((fieldName, value) => {
    dispatch({
      type: ACTION_TYPES.SET_CUSTOM_FIELDS,
      payload: { ...customFields, [fieldName]: value }
    });
    // Clear error for this field
    if (customFieldsErrors[fieldName]) {
      dispatch({ type: ACTION_TYPES.CLEAR_CUSTOM_FIELD_ERROR, payload: fieldName });
    }
  }, [customFields, customFieldsErrors]);

  // Area selection handler
  const handleAreaSelect = useCallback((areaData) => {
    console.log('📍 Area selected in PostAd:', areaData);

    if (areaData) {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_AREA_DATA, payload: areaData });
      dispatch({ type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { areaId: areaData.areaId } });
    } else {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_AREA_DATA, payload: null });
      dispatch({ type: ACTION_TYPES.UPDATE_FORM_DATA, payload: { areaId: '' } });
    }

    if (error) {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
    dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null });

    try {
      // Run all validations using the validation hook
      validateAll({
        formData,
        mainCategoryId,
        subcategories,
        validateFields,
        fields,
        customFields,
        setCustomFieldsErrors: (errors) => {
          dispatch({ type: ACTION_TYPES.SET_CUSTOM_FIELDS_ERRORS, payload: errors });
        }
      });

      const adData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        // condition is now in customFields for template-based forms
        categoryId: parseInt(formData.categoryId),
        areaId: parseInt(formData.areaId), // Changed from locationId to areaId
        sellerName: formData.sellerName.trim(),
        sellerPhone: formData.sellerPhone.trim(),
        customFields: customFields // Include template-specific fields
      };

      const result = await ApiService.createAd(adData, selectedImages);
      console.log('✅ Ad created successfully:', result);

      // Show success toast notification
      toast.success(MESSAGES.SUCCESS_MESSAGE, {
        title: MESSAGES.SUCCESS_TITLE,
        duration: TIMEOUTS.TOAST_DURATION
      });

      // Redirect to ad detail page using SEO slug if available, otherwise use ID
      setTimeout(() => {
        if (result.seo_slug) {
          navigate(`/${language}/ad/${result.seo_slug}`);
        } else {
          // Fallback to ID-based URL if slug is not available
          navigate(`/${language}/ad/${result.id}`);
        }
      }, TIMEOUTS.REDIRECT_DELAY);

    } catch (err) {
      console.error('❌ Error creating ad:', err);
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: err }); // Store the full error object for structured display
    } finally {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
    }
  };

  // Memoize template component rendering for better performance
  const renderedTemplate = useMemo(() => {
    // Get the appropriate template component
    const TemplateComponent = TEMPLATE_COMPONENTS[templateType];

    // Special case: HomeLivingForm only for category ID 4
    const shouldRender = templateType === 'general'
      ? selectedCategory?.id === 4 && fields && fields.length > 0
      : TemplateComponent && fields && fields.length > 0;

    if (!shouldRender) return null;

    return (
      <div className={styles.templateSection}>
        <TemplateComponent
          fields={fields}
          values={customFields}
          onChange={handleCustomFieldChange}
          errors={customFieldsErrors}
          subcategoryName={selectedSubcategory?.name || ''}
        />
      </div>
    );
  }, [templateType, selectedCategory, fields, customFields, customFieldsErrors, selectedSubcategory, handleCustomFieldChange]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Post Ad Form */}
      <div className={styles.formContainer}>
        <div className={styles.formCard}>
          {/* Header */}
          <div className={styles.formHeader}>
            <h1 id={ARIA_IDS.FORM_TITLE} className={styles.formTitle}>
              {SECTIONS.POST_AD}
            </h1>
            <p className={styles.formSubtitle}>
              {SECTIONS.POST_AD_SUBTITLE}
            </p>
          </div>

          {/* Error message */}
          <ErrorMessage
            error={error}
            onClose={() => dispatch({ type: ACTION_TYPES.SET_ERROR, payload: null })}
          />

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            aria-labelledby={ARIA_IDS.FORM_TITLE}
          >
            {/* Title */}
            <div className={styles.formField}>
              <label className={styles.label}>
                {LABELS.TITLE}
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={styles.input}
                placeholder={PLACEHOLDERS.TITLE}
                maxLength={CHAR_LIMITS.TITLE}
                aria-label={ARIA_LABELS.TITLE_INPUT}
                aria-required="true"
                aria-describedby={ARIA_IDS.TITLE_COUNTER}
              />
              <small id={ARIA_IDS.TITLE_COUNTER} className={styles.characterCounter}>
                {formData.title.length}/{CHAR_LIMITS.TITLE} characters
              </small>
            </div>

            {/* Description */}
            <div className={styles.formField}>
              <label className={styles.label}>
                {LABELS.DESCRIPTION}
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={styles.textarea}
                placeholder={PLACEHOLDERS.DESCRIPTION}
                maxLength={CHAR_LIMITS.DESCRIPTION}
                aria-label={ARIA_LABELS.DESCRIPTION_INPUT}
                aria-required="true"
                aria-describedby={ARIA_IDS.DESCRIPTION_COUNTER}
              />
              <small id={ARIA_IDS.DESCRIPTION_COUNTER} className={styles.characterCounter}>
                {formData.description.length}/{CHAR_LIMITS.DESCRIPTION} characters
              </small>
            </div>

            {/* Price */}
            <div className={styles.formField}>
              <label className={styles.label}>
                {LABELS.PRICE}
              </label>
              <input
                type="number"
                required
                min={PRICE_CONSTRAINTS.MIN}
                step={PRICE_CONSTRAINTS.STEP}
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={styles.input}
                placeholder={PLACEHOLDERS.PRICE}
                aria-label={ARIA_LABELS.PRICE_INPUT}
                aria-required="true"
              />
            </div>

            {/* Image Upload */}
            <div className={styles.formField}>
              <ImageUpload
                onImagesChange={(images) => dispatch({ type: ACTION_TYPES.SET_SELECTED_IMAGES, payload: images })}
                maxImages={IMAGE_LIMITS.MAX_IMAGES}
              />
            </div>

            {/* Category Selection (Cascading) */}
            <div className={styles.categorySection}>
              <h3 id={ARIA_IDS.CATEGORY_SECTION} className={styles.sectionHeader}>
                {SECTIONS.CATEGORY}
              </h3>

              <div className={subcategories.length > 0 ? styles.gridTwoColumns : styles.gridOneColumn}>
                {/* Main Category */}
                <div>
                  <label className={styles.label}>
                    {LABELS.MAIN_CATEGORY}
                  </label>
                  <select
                    required
                    value={mainCategoryId}
                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                    className={styles.select}
                    aria-label={ARIA_LABELS.MAIN_CATEGORY_SELECT}
                    aria-required="true"
                  >
                    <option value="">{PLACEHOLDERS.SELECT_MAIN_CATEGORY}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory (conditional) */}
                {subcategories.length > 0 && (
                  <div>
                    <label className={styles.label}>
                      {LABELS.SUBCATEGORY}
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      className={styles.select}
                      aria-label={ARIA_LABELS.SUBCATEGORY_SELECT}
                      aria-required="true"
                    >
                      <option value="">{PLACEHOLDERS.SELECT_SUBCATEGORY}</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Template-Specific Fields - Dynamic Renderer */}
            {renderedTemplate}

            {/* Location Selection with Search + Hierarchical Browser */}
            <div className={styles.locationSection}>
              <LocationSelector
                onAreaSelect={handleAreaSelect}
                selectedAreaId={formData.areaId}
              />
            </div>

            {/* Seller Information */}
            <div className={styles.contactSection}>
              <h3 id={ARIA_IDS.CONTACT_SECTION} className={styles.sectionHeader}>
                {SECTIONS.CONTACT_INFO}
              </h3>

              <div className={styles.gridTwoColumns}>
                {/* Seller Name */}
                <div>
                  <label className={styles.label}>
                    {LABELS.SELLER_NAME}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sellerName}
                    readOnly
                    className={styles.inputReadOnly}
                    placeholder={PLACEHOLDERS.SELLER_NAME}
                    aria-label={ARIA_LABELS.SELLER_NAME_INPUT}
                    aria-required="true"
                    aria-readonly="true"
                    aria-describedby={ARIA_IDS.SELLER_NAME_HELP}
                  />
                  <small id={ARIA_IDS.SELLER_NAME_HELP} className={styles.helperTextSmall}>
                    {MESSAGES.SELLER_NAME_LOCKED}
                  </small>
                </div>

                {/* Seller Phone */}
                <div>
                  <label className={styles.label}>
                    {LABELS.SELLER_PHONE}
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.sellerPhone}
                    onChange={(e) => handleInputChange('sellerPhone', e.target.value)}
                    className={styles.input}
                    placeholder={PLACEHOLDERS.SELLER_PHONE}
                    aria-label={ARIA_LABELS.SELLER_PHONE_INPUT}
                    aria-required="true"
                    aria-describedby={ARIA_IDS.SELLER_PHONE_HELP}
                  />
                  <small id={ARIA_IDS.SELLER_PHONE_HELP} className={styles.helperTextSmall}>
                    {MESSAGES.SELLER_PHONE_EDITABLE}
                  </small>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={styles.submitButtonContainer}>
              <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
                aria-label={ARIA_LABELS.SUBMIT_BUTTON}
                aria-busy={loading}
                aria-live="polite"
              >
                {loading ? MESSAGES.POSTING : MESSAGES.POST_AD}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostAd;