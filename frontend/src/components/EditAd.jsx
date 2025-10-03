import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ApiService from '../services/api';
import SimpleHeader from './SimpleHeader';

function EditAd() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: '',
    categoryId: '',
    locationId: '',
    sellerName: '',
    sellerPhone: ''
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      navigate(`/${language}`);
      return;
    }

    // Load ad data and form options
    loadAdData();
    loadFormOptions();
  }, [id, isAuthenticated, navigate]);

  const loadAdData = async () => {
    try {
      setLoading(true);
      const ad = await ApiService.getAd(id);

      // Check if this ad belongs to the current user
      if (ad.seller_name !== user?.fullName && ad.seller_phone !== user?.phone) {
        setError('You can only edit your own ads.');
        return;
      }

      // Store ad data to use after categories and locations are loaded
      window.currentAd = ad;

      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price || '',
        condition: ad.condition || '',
        categoryId: ad.category_id ? ad.category_id.toString() : '',
        locationId: ad.location_id ? ad.location_id.toString() : '',
        sellerName: ad.seller_name || '',
        sellerPhone: ad.seller_phone || ''
      });

      console.log('✅ Ad data loaded for editing:', ad);
    } catch (err) {
      console.error('❌ Error loading ad:', err);
      setError('Failed to load ad data. Ad may not exist or you may not have permission to edit it.');
    } finally {
      setLoading(false);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [categoriesData, locationsData] = await Promise.all([
        ApiService.getCategories(),
        ApiService.getLocations()
      ]);
      setCategories(categoriesData);
      setLocations(locationsData);
      console.log('🏷️ Categories loaded:', categoriesData);
      console.log('📍 Locations loaded:', locationsData);

      // Clean up temporary ad data if exists
      if (window.currentAd) {
        delete window.currentAd;
      }
    } catch (err) {
      console.error('Error loading form options:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

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
      if (!formData.condition) {
        throw new Error('Condition is required');
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

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        condition: formData.condition,
        categoryId: parseInt(formData.categoryId),
        locationId: parseInt(formData.locationId),
        sellerName: formData.sellerName.trim(),
        sellerPhone: formData.sellerPhone.trim()
      };

      await ApiService.updateAd(id, updateData);
      console.log('✅ Ad updated successfully');

      setSuccess('Ad updated successfully! Redirecting...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/${language}/dashboard`);
      }, 2000);

    } catch (err) {
      console.error('❌ Error updating ad:', err);
      setError(err.message || 'Failed to update ad. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        🔄 Loading ad details...
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        color: '#dc2626'
      }}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(`/${language}/dashboard`)}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <SimpleHeader showUserWelcome={true} />

      {/* Edit Ad Form */}
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
              Edit Your Ad
            </h1>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '16px'
            }}>
              Update the details of your ad
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

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
                  outline: 'none'
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

            {/* Submit Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                onClick={() => navigate(`/${language}/dashboard`)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '2px solid #e5e7eb',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitLoading}
                style={{
                  backgroundColor: submitLoading ? '#94a3b8' : '#dc1e4a',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: submitLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {submitLoading ? '⏳ Updating...' : '💾 Update Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditAd;