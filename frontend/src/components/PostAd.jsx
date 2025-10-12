import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './common/Toast';
import ApiService from '../services/api';
import ImageUpload from './ImageUpload';
import ErrorMessage from './ErrorMessage';
import SimpleHeader from './SimpleHeader';
import LocationSelector from './post-ad/LocationSelector';

function PostAd() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  // Category cascading state
  const [mainCategoryId, setMainCategoryId] = useState('');
  const [subcategories, setSubcategories] = useState([]);

  // Area selection state (replaces location cascading)
  const [selectedAreaData, setSelectedAreaData] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    categoryId: '',
    areaId: '', // Changed from locationId to areaId
    sellerName: user?.name || '',
    sellerPhone: user?.phone || ''
  });

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
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError(new Error('Failed to load form data. Please refresh the page.'));
      }
    };

    loadData();
  }, [isAuthenticated, navigate, language]);

  useEffect(() => {
    // Update seller info when user data changes
    if (user) {
      setFormData(prev => ({
        ...prev,
        sellerName: user.name || '',
        sellerPhone: user.phone || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  // Category cascade handlers
  const handleMainCategoryChange = (categoryId) => {
    setMainCategoryId(categoryId);

    // Find the selected category and its subcategories
    const selectedCategory = categories.find(cat => cat.id === parseInt(categoryId));

    if (selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      setSubcategories(selectedCategory.subcategories);
      // Clear subcategory selection and formData.categoryId
      setFormData(prev => ({ ...prev, categoryId: '' }));
    } else {
      // No subcategories, use main category as final selection
      setSubcategories([]);
      setFormData(prev => ({ ...prev, categoryId: categoryId }));
    }

    if (error) setError(null);
  };

  const handleSubcategoryChange = (subcategoryId) => {
    setFormData(prev => ({ ...prev, categoryId: subcategoryId }));
    if (error) setError(null);
  };

  // Area selection handler
  const handleAreaSelect = (areaData) => {
    console.log('📍 Area selected in PostAd:', areaData);

    if (areaData) {
      setSelectedAreaData(areaData);
      setFormData(prev => ({ ...prev, areaId: areaData.areaId }));
    } else {
      setSelectedAreaData(null);
      setFormData(prev => ({ ...prev, areaId: '' }));
    }

    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        throw new Error('Valid price is required');
      }
      if (!mainCategoryId) {
        throw new Error('Please select a category');
      }
      if (subcategories.length > 0 && !formData.categoryId) {
        throw new Error('Please select a subcategory');
      }
      if (!formData.categoryId) {
        throw new Error('Category is required');
      }
      if (!formData.areaId) {
        throw new Error('Please select an area/place for your ad');
      }
      if (!formData.sellerName.trim()) {
        throw new Error('Seller name is required');
      }
      if (!formData.sellerPhone.trim()) {
        throw new Error('Seller phone is required');
      }

      const adData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        condition: formData.condition,
        categoryId: parseInt(formData.categoryId),
        areaId: parseInt(formData.areaId), // Changed from locationId to areaId
        sellerName: formData.sellerName.trim(),
        sellerPhone: formData.sellerPhone.trim()
      };

      const result = await ApiService.createAd(adData, selectedImages);
      console.log('✅ Ad created successfully:', result);

      // Show success toast notification
      toast.success('Your ad has been posted successfully!', {
        title: 'Success!',
        duration: 3000
      });

      // Redirect to ad detail page using SEO slug if available, otherwise use ID
      setTimeout(() => {
        if (result.seo_slug) {
          navigate(`/${language}/ad/${result.seo_slug}`);
        } else {
          // Fallback to ID-based URL if slug is not available
          navigate(`/${language}/ad/${result.id}`);
        }
      }, 1500);

    } catch (err) {
      console.error('❌ Error creating ad:', err);
      setError(err); // Store the full error object for structured display
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Post Ad Form */}
      <div className="form-container" style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '0 20px'
      }}>
        <div className="form-card" style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div className="form-header" style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{
              margin: '0 0 8px 0',
              color: '#1e293b',
              fontSize: '28px',
              fontWeight: 'bold'
            }}>
              Post Your Ad
            </h1>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '16px'
            }}>
              Fill in the details below to post your ad
            </p>
          </div>

          {/* Error message */}
          <ErrorMessage
            error={error}
            onClose={() => setError(null)}
          />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Ad Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="e.g., iPhone 14 Pro Max 256GB"
                maxLength="100"
              />
              <small style={{ color: '#6b7280', fontSize: '14px' }}>
                {formData.title.length}/100 characters
              </small>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  minHeight: '120px',
                  resize: 'vertical'
                }}
                placeholder="Describe your item in detail..."
                maxLength="1000"
              />
              <small style={{ color: '#6b7280', fontSize: '14px' }}>
                {formData.description.length}/1000 characters
              </small>
            </div>

            {/* Price and Condition Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Price (NPR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="e.g., 150000"
                />
              </div>

              {/* Condition */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Condition *
                </label>
                <select
                  required
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Condition</option>
                  <option value="new">Brand New</option>
                  <option value="used">Used</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '24px' }}>
              <ImageUpload
                onImagesChange={setSelectedImages}
                maxImages={5}
              />
            </div>

            {/* Category Selection (Cascading) */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Category
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: subcategories.length > 0 ? '1fr 1fr' : '1fr',
                gap: '20px'
              }}>
                {/* Main Category */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Main Category *
                  </label>
                  <select
                    required
                    value={mainCategoryId}
                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Select Main Category</option>
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
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Subcategory *
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select Subcategory</option>
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

            {/* Location Selection with Search + Hierarchical Browser */}
            <div style={{ marginBottom: '24px' }}>
              <LocationSelector
                onAreaSelect={handleAreaSelect}
                selectedAreaId={formData.areaId}
              />
            </div>

            {/* Seller Information */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                color: '#1e293b',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Contact Information
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                {/* Seller Name */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Your Name * 🔒
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sellerName}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: '#f9fafb',
                      cursor: 'not-allowed',
                      color: '#6b7280'
                    }}
                    placeholder="Your full name"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Name is locked from your profile. Update in profile settings if needed.
                  </small>
                </div>

                {/* Seller Phone */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Phone Number * ✏️
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.sellerPhone}
                    onChange={(e) => handleInputChange('sellerPhone', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    placeholder="+977-9800000000"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Phone from your profile. You can edit it if needed.
                  </small>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#94a3b8' : '#dc1e4a',
                  color: 'white',
                  border: 'none',
                  padding: '16px 48px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? '⏳ Posting Ad...' : '🚀 Post Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostAd;