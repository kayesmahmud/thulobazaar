/**
 * Services & Jobs Subcategory Configurations
 *
 * IMPORTANT: Education/Tuition does NOT have Condition or Brand fields
 * since they are service-based, not product-based.
 */

import type { SubcategoryConfig } from '../types';
import {
  experienceField,
  availabilityField,
  serviceLocationField,
  languagesField,
  experienceRequiredField,
  salaryRangeField,
  educationRequiredField,
  companyNameField,
  jobTypeField,
  subjectsField,
  gradeLevelField,
  modeOfTeachingField,
  countryField,
  jobPositionField,
  visaTypeField,
} from '../fields';

// ============================================
// SERVICES (No Condition/Brand - they are services!)
// ============================================

export const tuition: SubcategoryConfig = {
  name: 'Tuition',
  fields: [
    // NO condition or brand - this is a service, not a product
    { field: subjectsField },
    { field: gradeLevelField },
    { field: modeOfTeachingField },
    { field: experienceField },
    { field: languagesField },
    { field: availabilityField },
  ],
};

export const servicingRepair: SubcategoryConfig = {
  name: 'Servicing & Repair',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField },
  ],
};

export const itServices: SubcategoryConfig = {
  name: 'IT Services',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField, override: { options: ['At Customer Location', 'At Provider Location', 'Remote/Online'] } },
    { field: languagesField },
  ],
};

export const professionalServices: SubcategoryConfig = {
  name: 'Professional Services',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField },
    { field: languagesField },
  ],
};

export const gymFitness: SubcategoryConfig = {
  name: 'Gym & Fitness',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField, override: { label: 'Location', options: ['At Customer Location', 'At Provider Location'] } },
  ],
};

export const beautyServices: SubcategoryConfig = {
  name: 'Beauty Services',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField, override: { label: 'Location', options: ['At Customer Location', 'At Salon/Parlour'] } },
  ],
};

export const bodyMassage: SubcategoryConfig = {
  name: 'Body Massage',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: serviceLocationField, override: { label: 'Location', options: ['At Home', 'At Massage Parlour'], required: true } },
  ],
};

export const domesticDaycare: SubcategoryConfig = {
  name: 'Domestic & Daycare Services',
  fields: [
    { field: experienceField },
    { field: availabilityField },
    { field: languagesField },
  ],
};

// ============================================
// JOBS
// ============================================

export const fullTimeJobs: SubcategoryConfig = {
  name: 'Full Time Jobs',
  fields: [
    { field: companyNameField },
    { field: jobTypeField, override: { options: ['Full Time'] } },
    { field: experienceRequiredField },
    { field: educationRequiredField },
    { field: salaryRangeField },
  ],
};

export const partTimeJobs: SubcategoryConfig = {
  name: 'Part Time Jobs',
  fields: [
    { field: companyNameField },
    { field: jobTypeField, override: { options: ['Part Time'] } },
    { field: experienceRequiredField },
    { field: educationRequiredField },
    { field: salaryRangeField },
  ],
};

export const internships: SubcategoryConfig = {
  name: 'Internships',
  fields: [
    { field: companyNameField },
    { field: jobTypeField, override: { options: ['Internship'] } },
    { field: educationRequiredField },
    { field: salaryRangeField, override: { label: 'Stipend', options: ['Unpaid', 'Below 10,000', '10,000-20,000', '20,000-30,000', 'Above 30,000'] } },
  ],
};

export const freelanceJobs: SubcategoryConfig = {
  name: 'Freelance Jobs',
  fields: [
    { field: companyNameField, override: { required: false } },
    { field: jobTypeField, override: { options: ['Freelance', 'Contract'] } },
    { field: experienceRequiredField },
    { field: salaryRangeField, override: { label: 'Budget' } },
  ],
};

// ============================================
// OVERSEAS JOBS
// ============================================

export const overseasMiddleEast: SubcategoryConfig = {
  name: 'Middle East Jobs',
  fields: [
    { field: countryField, override: { options: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'] } },
    { field: jobPositionField },
    { field: visaTypeField },
    { field: experienceRequiredField },
    { field: salaryRangeField, override: { label: 'Expected Salary' } },
  ],
};

export const overseasAsia: SubcategoryConfig = {
  name: 'Asia Jobs',
  fields: [
    { field: countryField, override: { options: ['Malaysia', 'Singapore', 'Japan', 'South Korea', 'Hong Kong', 'Taiwan'] } },
    { field: jobPositionField },
    { field: visaTypeField },
    { field: experienceRequiredField },
    { field: salaryRangeField, override: { label: 'Expected Salary' } },
  ],
};

export const overseasEurope: SubcategoryConfig = {
  name: 'Europe Jobs',
  fields: [
    { field: countryField, override: { options: ['Bulgaria', 'Croatia', 'Serbia', 'Poland', 'Romania', 'Portugal', 'Malta'] } },
    { field: jobPositionField },
    { field: visaTypeField },
    { field: experienceRequiredField },
    { field: salaryRangeField, override: { label: 'Expected Salary' } },
  ],
};

// Export all services subcategories as a map
export const servicesSubcategories: Record<string, SubcategoryConfig> = {
  // Education/Services - NO Condition/Brand
  'Tuition': tuition,
  'Servicing & Repair': servicingRepair,
  'IT Services': itServices,
  'Professional Services': professionalServices,
  'Gym & Fitness': gymFitness,
  'Beauty Services': beautyServices,
  'Body Massage': bodyMassage,
  'Domestic & Daycare Services': domesticDaycare,
  // Jobs
  'Full Time Jobs': fullTimeJobs,
  'Part Time Jobs': partTimeJobs,
  'Internships': internships,
  'Freelance Jobs': freelanceJobs,
  // Overseas Jobs
  'Middle East Jobs': overseasMiddleEast,
  'Asia Jobs': overseasAsia,
  'Europe Jobs': overseasEurope,
};
