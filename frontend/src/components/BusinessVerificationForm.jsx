import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ApiService from '../services/api';

function BusinessVerificationForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    businessName: '',
    business_category: '',
    business_description: '',
    business_website: '',
    business_phone: '',
    business_address: '',
    payment_reference: '',
    payment_amount: 1000
  });
  const [businessLicense, setBusinessLicense] = useState(null);
  const [verificationInfo, setVerificationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Info, 2: Form

  useEffect(() => {
    loadVerificationInfo();
  }, []);

  const loadVerificationInfo = async () => {
    try {
      const info = await ApiService.getBusinessVerificationInfo();
      setVerificationInfo(info);
    } catch (err) {
      console.error('Error loading verification info:', err);
    }
  };

  const handleInputChange = (field, value) => {
    console.log('handleInputChange - field:', field, 'value:', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, PNG, and PDF files are allowed');
        e.target.value = '';
        return;
      }
      setBusinessLicense(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('handleSubmit - formData.businessName:', formData.businessName);
      // Validation
      if (!formData.businessName) {
        throw new Error('Business name is required');
      }
      if (!businessLicense) {
        throw new Error('Business license document is required');
      }
      if (formData.business_phone && !/^[0-9]{10}$/.test(formData.business_phone)) {
        throw new Error('Phone number must be 10 digits (e.g., 9841234567)');
      }

      // Create FormData
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      submitData.append('businessLicense', businessLicense);

      await ApiService.submitBusinessVerification(submitData);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting verification:', err);
      let errorMessage = 'Failed to submit verification request';
      if (err.structured) {
        errorMessage = err.message || err.details || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          ×
        </button>

        {step === 1 ? (
          // Info Step
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fbbf24',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '40px'
              }}>
                ✓
              </div>
              <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '24px' }}>
                Business Verification
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                Get verified and unlock premium business features
              </p>
            </div>

            {verificationInfo && (
              <>
                {/* Benefits */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>
                    ✨ Benefits
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '14px' }}>
                    {verificationInfo.benefits.map((benefit, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Required Documents */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>
                    📄 Required Documents
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#64748b', fontSize: '14px' }}>
                    {verificationInfo.required_documents.map((doc, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{doc}</li>
                    ))}
                  </ul>
                </div>

                {/* Fee */}
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid #fbbf24'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#92400e', fontWeight: '600' }}>Verification Fee:</span>
                    <span style={{ color: '#92400e', fontSize: '24px', fontWeight: 'bold' }}>
                      रू {verificationInfo.verification_fee}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', color: '#92400e', fontSize: '12px' }}>
                    Processing time: {verificationInfo.processing_time}
                  </p>
                </div>
              </>
            )}

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#fbbf24',
                color: '#92400e',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continue to Application →
            </button>
          </div>
        ) : (
          // Form Step
          <div>
            <h2 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '24px' }}>
              Business Verification Application
            </h2>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
              Fill in your business details
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Matching Info */}
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <strong style={{ color: '#92400e' }}>⚠️ Important: Name Matching Required</strong>
                <p style={{ margin: '4px 0 0 0', color: '#92400e', fontSize: '14px' }}>
                  The business name you enter below must match EXACTLY with the name on your business license/PAN card
                </p>
              </div>

              {/* Business Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter business name (must match license/PAN card)"
                />
              </div>

              {/* Business License Document */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business License Document *
                </label>
                <input
                  type="file"
                  required
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <small style={{ color: '#64748b', fontSize: '12px' }}>
                  Upload JPG, PNG, or PDF (max 5MB)
                </small>
              </div>

              {/* Business Category */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Category
                </label>
                <input
                  type="text"
                  value={formData.business_category}
                  onChange={(e) => handleInputChange('business_category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="e.g., Retail, Services, Restaurant"
                />
              </div>

              {/* Business Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={formData.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="9841234567"
                />
                <small style={{ color: '#64748b', fontSize: '12px' }}>
                  10 digit phone number
                </small>
              </div>

              {/* Business Address */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Address
                </label>
                <textarea
                  value={formData.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Enter your business address"
                />
              </div>

              {/* Business Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Business Description
                </label>
                <textarea
                  value={formData.business_description}
                  onChange={(e) => handleInputChange('business_description', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Tell us about your business"
                />
              </div>

              {/* Payment Reference */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={formData.payment_reference}
                  onChange={(e) => handleInputChange('payment_reference', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Payment transaction ID or reference"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '14px',
                    backgroundColor: loading ? '#94a3b8' : '#fbbf24',
                    color: '#92400e',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳ Submitting...' : '✓ Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

BusinessVerificationForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default BusinessVerificationForm;
