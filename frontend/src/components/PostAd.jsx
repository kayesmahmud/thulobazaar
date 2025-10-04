import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from './common/Toast';
import ApiService from '../services/api';
import ImageUpload from './ImageUpload';
import ErrorMessage from './ErrorMessage';
import SimpleHeader from './SimpleHeader';

function PostAd() {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    categoryId: '',
    locationId: '',
    sellerName: user?.fullName || '',
    sellerPhone: user?.phone || ''
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate(`/${language}`);
      return;
    }

    // Load categories and locations
    const loadData = async () => {
      try {
        const [categoriesData, locationsData] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getLocations()
        ]);
        setCategories(categoriesData);
        setLocations(locationsData);
      } catch (err) {
        console.error('Error loading form data:', err);
        setError(new Error('Failed to load form data. Please refresh the page.'));
      }
    };

    loadData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Update seller info when user data changes
    if (user) {
      setFormData(prev => ({
        ...prev,
        sellerName: user.fullName || '',
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
      if (!formData.categoryId) {
        throw new Error('Category is required');
      }
      if (!formData.locationId) {
        throw new Error('Location is required');
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
        locationId: parseInt(formData.locationId),
        sellerName: formData.sellerName.trim(),
        sellerPhone: formData.sellerPhone.trim()
      };

      const result = await ApiService.createAd(adData, selectedImages);
      console.log('✅ Ad created successfully:', result);

      // Show success toast notification
      toast.success('Your ad has been posted successfully and is pending approval!', {
        title: 'Success!',
        duration: 3000
      });

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate(`/${language}`);
      }, 2000);

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

            {/* Category and Location Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '24px'
            }}>
              {/* Category */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Location *
                </label>
                <select
                  required
                  value={formData.locationId}
                  onChange={(e) => handleInputChange('locationId', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
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
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sellerName}
                    onChange={(e) => handleInputChange('sellerName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    placeholder="Your full name"
                  />
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
                    Phone Number *
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