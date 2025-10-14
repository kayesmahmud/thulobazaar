import React from 'react';
import './TemplateSpecs.css';

/**
 * Services & Jobs Specifications Display
 * Shows custom fields for services, jobs, tuition, and overseas employment
 */
function ServicesSpecs({ customFields }) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  // Define field labels mapping
  const fieldLabels = {
    // Service fields
    experience: 'Experience',
    availability: 'Availability',
    serviceLocation: 'Service Location',
    physicalServiceLocation: 'Service Location',
    massageLocation: 'Service Location',
    languages: 'Languages Known',

    // Job fields
    experienceRequired: 'Experience Required',
    salaryRange: 'Salary Range',
    educationRequired: 'Education Required',
    companyName: 'Company Name',

    // Tuition fields
    subjects: 'Subjects',
    gradeLevel: 'Grade/Level',
    modeOfTeaching: 'Mode of Teaching',

    // Overseas Jobs fields
    country: 'Country',
    jobPosition: 'Job Position',
    visaType: 'Visa Type'
  };

  // Filter out empty values
  const specs = Object.entries(customFields)
    .filter(([key, value]) => value && value !== '' && value.length !== 0)
    .map(([key, value]) => ({
      label: fieldLabels[key] || key,
      value: Array.isArray(value) ? value.join(', ') : value
    }));

  if (specs.length === 0) {
    return null;
  }

  return (
    <div className="template-specs services-specs">
      <div className="specs-header">
        <h3>💼 Specifications</h3>
      </div>

      <div className="specs-grid">
        {specs.map((spec, index) => (
          <div key={index} className="spec-item">
            <div className="spec-label">{spec.label}</div>
            <div className="spec-value">{spec.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServicesSpecs;
