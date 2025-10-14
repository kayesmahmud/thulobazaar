import React from 'react';
import './TemplateForm.css';

/**
 * Home & Living Template Form
 * Handles Bedroom Furniture, Living Room Furniture, Office Furniture, etc.
 */
function HomeLivingForm({ fields, values, onChange, errors, subcategoryName }) {
  const handleInputChange = (fieldName, value) => {
    onChange(fieldName, value);
  };

  const handleMultiSelectChange = (fieldName, option) => {
    const currentValues = values[fieldName] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    onChange(fieldName, newValues);
  };

  const renderField = (field) => {
    const value = values[field.name] || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="form-field">
            <label className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="text"
              className={`form-input ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-field">
            <label className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              type="number"
              className={`form-input ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              required={field.required}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="form-field">
            <label className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              className={`form-select ${error ? 'error' : ''}`}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="form-field">
            <label className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="multiselect-options">
              {field.options.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={(values[field.name] || []).includes(option)}
                    onChange={() => handleMultiSelectChange(field.name, option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
              />
              <span>
                {field.label}
                {field.required && <span className="required">*</span>}
              </span>
            </label>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="template-form home-living-form">
      <div className="template-form-header">
        <h3>🛋️ Home & Living Details</h3>
        <p className="template-form-subtitle">
          Provide specific details about your {subcategoryName || 'furniture item'}
        </p>
      </div>

      <div className="template-form-fields">
        {fields.map(field => renderField(field))}
      </div>
    </div>
  );
}

export default HomeLivingForm;
