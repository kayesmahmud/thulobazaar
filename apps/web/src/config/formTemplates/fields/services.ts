/**
 * Services & Jobs Fields
 */

import type { FormField } from '../types';

export const experienceField: FormField = {
  name: 'experience',
  label: 'Experience',
  type: 'select',
  required: false,
  options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  appliesTo: 'all',
};

export const availabilityField: FormField = {
  name: 'availability',
  label: 'Availability',
  type: 'multiselect',
  required: false,
  options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
  appliesTo: 'all',
};

export const serviceLocationField: FormField = {
  name: 'serviceLocation',
  label: 'Service Location',
  type: 'select',
  required: false,
  options: ['At Customer Location', 'At Provider Location', 'Remote/Online'],
  appliesTo: 'all',
};

export const languagesField: FormField = {
  name: 'languages',
  label: 'Languages Known',
  type: 'multiselect',
  required: false,
  options: ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
  appliesTo: 'all',
};

// Job-specific fields
export const experienceRequiredField: FormField = {
  name: 'experienceRequired',
  label: 'Experience Required',
  type: 'select',
  required: false,
  options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  appliesTo: 'all',
};

export const salaryRangeField: FormField = {
  name: 'salaryRange',
  label: 'Salary Range',
  type: 'select',
  required: false,
  options: ['Below 20,000', '20,000-30,000', '30,000-50,000', '50,000-1,00,000', 'Above 1,00,000', 'Negotiable'],
  appliesTo: 'all',
};

export const educationRequiredField: FormField = {
  name: 'educationRequired',
  label: 'Education Required',
  type: 'select',
  required: false,
  options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
  appliesTo: 'all',
};

export const companyNameField: FormField = {
  name: 'companyName',
  label: 'Company Name',
  type: 'text',
  required: false,
  placeholder: 'Enter company name',
  appliesTo: 'all',
};

export const jobTypeField: FormField = {
  name: 'jobType',
  label: 'Job Type',
  type: 'select',
  required: false,
  options: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
  appliesTo: 'all',
};

// Education/Tuition fields
export const subjectsField: FormField = {
  name: 'subjects',
  label: 'Subject',
  type: 'multiselect',
  required: true,
  options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
  appliesTo: 'all',
};

export const gradeLevelField: FormField = {
  name: 'gradeLevel',
  label: 'Grade/Level',
  type: 'multiselect',
  required: true,
  options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
  appliesTo: 'all',
};

export const modeOfTeachingField: FormField = {
  name: 'modeOfTeaching',
  label: 'Mode of Teaching',
  type: 'select',
  required: false,
  options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
  appliesTo: 'all',
};

// Overseas Jobs fields
export const countryField: FormField = {
  name: 'country',
  label: 'Country',
  type: 'select',
  required: true,
  options: ['Bulgaria', 'Croatia', 'Serbia', 'Saudi Arabia', 'UAE', 'Qatar', 'Malaysia', 'Singapore', 'Japan', 'South Korea'],
  appliesTo: 'all',
};

export const jobPositionField: FormField = {
  name: 'jobPosition',
  label: 'Job Position',
  type: 'text',
  required: true,
  placeholder: 'e.g., Construction Worker, Chef, Driver',
  appliesTo: 'all',
};

export const visaTypeField: FormField = {
  name: 'visaType',
  label: 'Visa Type',
  type: 'select',
  required: false,
  options: ['Work Visa', 'Employment Visa', 'Sponsored'],
  appliesTo: 'all',
};
