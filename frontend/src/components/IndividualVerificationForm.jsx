import { useState } from 'react';
import PropTypes from 'prop-types';
import ApiService from '../services/api';

function IndividualVerificationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    full_name: '',
    id_document_type: 'citizenship',
    id_document_number: '',
    id_document_front: null,
    id_document_back: null,
    selfie_with_id: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.full_name || formData.full_name.trim() === '') {
      setError('Please enter your full name');
      return;
    }
    if (!formData.id_document_number) {
      setError('Please enter your ID document number');
      return;
    }
    if (!formData.id_document_front) {
      setError('Please upload front image of your ID document');
      return;
    }
    if (!formData.selfie_with_id) {
      setError('Please upload a selfie holding your ID document');
      return;
    }

    try {
      setLoading(true);

      const submitFormData = new FormData();
      submitFormData.append('full_name', formData.full_name.trim());
      submitFormData.append('id_document_type', formData.id_document_type);
      submitFormData.append('id_document_number', formData.id_document_number);
      submitFormData.append('id_document_front', formData.id_document_front);
      if (formData.id_document_back) {
        submitFormData.append('id_document_back', formData.id_document_back);
      }
      submitFormData.append('selfie_with_id', formData.selfie_with_id);

      // Debug logging
      console.log('🔍 FormData contents before submission:');
      console.log('  full_name:', formData.full_name);
      console.log('  id_document_type:', formData.id_document_type);
      console.log('  id_document_number:', formData.id_document_number);
      console.log('  id_document_front:', formData.id_document_front);
      console.log('  id_document_back:', formData.id_document_back);
      console.log('  selfie_with_id:', formData.selfie_with_id);
      console.log('🔍 FormData entries:');
      for (let pair of submitFormData.entries()) {
        console.log('  ', pair[0], ':', pair[1]);
      }

      await ApiService.submitIndividualVerification(submitFormData);
      alert('✅ Verification request submitted successfully! Your application is under review.');
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const userFullName = userData.fullName || userData.full_name || 'Not available';

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
          onClick={onCancel}
          type="button"
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
          ✕
        </button>

        <form onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '20px', color: '#3B82F6' }}>Individual Seller Verification</h2>

      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>
          Full Name (as on ID document) *
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          placeholder="Enter your full name exactly as shown on ID"
          required
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '15px',
            boxSizing: 'border-box'
          }}
        />
        <small style={{ color: '#64748b', fontSize: '13px' }}>
          This name will be verified against your ID document and displayed with blue badge
        </small>
      </div>

      <div style={{
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px'
      }}>
        <strong style={{ color: '#92400e' }}>⚠️ Important:</strong>
        <p style={{ margin: '4px 0 0 0', color: '#92400e', fontSize: '14px' }}>
          Make sure the name you enter above matches exactly with the name on your ID document. Any mismatch will result in rejection.
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          ID Document Type *
        </label>
        <select
          value={formData.id_document_type}
          onChange={(e) => setFormData({ ...formData, id_document_type: e.target.value })}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        >
          <option value="citizenship">Citizenship</option>
          <option value="passport">Passport</option>
          <option value="driving_license">Driving License</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          ID Document Number *
        </label>
        <input
          type="text"
          value={formData.id_document_number}
          onChange={(e) => setFormData({ ...formData, id_document_number: e.target.value })}
          placeholder="Enter your ID number"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc'
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          ID Document Front Image *
        </label>
        <input
          type="file"
          name="id_document_front"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>Upload clear photo of front side (Max 5MB)</small>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          ID Document Back Image {formData.id_document_type !== 'passport' && '*'}
        </label>
        <input
          type="file"
          name="id_document_back"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>
          {formData.id_document_type === 'passport' ? 'Optional for passport' : 'Upload clear photo of back side (Max 5MB)'}
        </small>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Selfie with ID Document *
        </label>
        <input
          type="file"
          name="selfie_with_id"
          accept="image/*"
          onChange={handleFileChange}
          style={{ width: '100%' }}
        />
        <small style={{ color: '#666' }}>Take a clear selfie holding your ID document next to your face (Max 5MB)</small>
      </div>

      <div style={{
        backgroundColor: '#dbeafe',
        border: '1px solid #3B82F6',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '24px'
      }}>
        <strong>📝 Verification Tips:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>Ensure all photos are clear and readable</li>
          <li>Your face and ID details should be visible in the selfie</li>
          <li>Avoid glare or shadows on documents</li>
          <li>Review usually takes 1-2 business days</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit for Verification'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
        </form>
      </div>
    </div>
  );
}

IndividualVerificationForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default IndividualVerificationForm;
