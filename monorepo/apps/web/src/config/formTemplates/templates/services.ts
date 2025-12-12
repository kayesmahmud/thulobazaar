/**
 * Services & Jobs Template
 */

import type { FormTemplate } from '../types';
import { JOB_CATEGORIES, OVERSEAS_COUNTRIES } from '../sharedFields';

const SERVICE_CATEGORIES = ['Servicing & Repair', 'IT Services', 'Professional Services', 'Gym & Fitness', 'Beauty Services'];
const SERVICE_WITH_DOMESTIC = [...SERVICE_CATEGORIES.slice(0, 4), 'Domestic & Daycare Services'];
const PHYSICAL_SERVICES = ['Gym & Fitness', 'Beauty Services'];
const EDUCATION_SERVICES = ['Tuition', 'Professional Services'];

export const servicesTemplate: FormTemplate = {
  name: 'Services & Jobs',
  icon: '🔧💼',
  fields: [
    // For Services
    {
      name: 'experience',
      label: 'Experience',
      type: 'select',
      required: false,
      options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
      appliesTo: SERVICE_CATEGORIES,
    },
    {
      name: 'availability',
      label: 'Availability',
      type: 'multiselect',
      required: false,
      options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
      appliesTo: SERVICE_WITH_DOMESTIC,
    },
    {
      name: 'serviceLocation',
      label: 'Service Location',
      type: 'select',
      required: false,
      options: ['At Customer Location', 'At Provider Location', 'Remote/Online'],
      appliesTo: ['Servicing & Repair', 'IT Services', 'Professional Services'],
    },
    {
      name: 'physicalServiceLocation',
      label: 'Service Location',
      type: 'select',
      required: false,
      options: ['At Customer Location', 'At Provider Location'],
      appliesTo: PHYSICAL_SERVICES,
    },
    {
      name: 'massageLocation',
      label: 'Service Location',
      type: 'select',
      required: true,
      options: ['At Home', 'At Massage Parlour'],
      appliesTo: ['Body Massage'],
    },
    {
      name: 'languages',
      label: 'Languages Known',
      type: 'multiselect',
      required: false,
      options: ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
      appliesTo: EDUCATION_SERVICES,
    },
    // For Jobs
    {
      name: 'experienceRequired',
      label: 'Experience Required',
      type: 'select',
      required: false,
      options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
      appliesTo: [...JOB_CATEGORIES],
    },
    {
      name: 'salaryRange',
      label: 'Salary Range',
      type: 'select',
      required: false,
      options: [
        'Below 20,000', '20,000-30,000', '30,000-50,000',
        '50,000-1,00,000', 'Above 1,00,000', 'Negotiable',
      ],
      appliesTo: [...JOB_CATEGORIES],
    },
    {
      name: 'educationRequired',
      label: 'Education Required',
      type: 'select',
      required: false,
      options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
      appliesTo: [...JOB_CATEGORIES],
    },
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
      required: false,
      placeholder: 'Enter company name',
      appliesTo: [...JOB_CATEGORIES],
    },
    // For Education (Tuition)
    {
      name: 'subjects',
      label: 'Subject',
      type: 'multiselect',
      required: true,
      options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
      appliesTo: ['Tuition'],
    },
    {
      name: 'gradeLevel',
      label: 'Grade/Level',
      type: 'multiselect',
      required: true,
      options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
      appliesTo: ['Tuition'],
    },
    {
      name: 'modeOfTeaching',
      label: 'Mode of Teaching',
      type: 'select',
      required: false,
      options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
      appliesTo: ['Tuition'],
    },
    // For Overseas Jobs
    {
      name: 'country',
      label: 'Country',
      type: 'select',
      required: true,
      options: ['Bulgaria', 'Croatia', 'Serbia', 'Saudi Arabia', 'UAE', 'Qatar', 'Malaysia', 'Singapore', 'Japan', 'South Korea'],
      appliesTo: [...OVERSEAS_COUNTRIES],
    },
    {
      name: 'jobPosition',
      label: 'Job Position',
      type: 'text',
      required: true,
      placeholder: 'e.g., Construction Worker, Chef, Driver',
      appliesTo: [...OVERSEAS_COUNTRIES],
    },
    {
      name: 'visaType',
      label: 'Visa Type',
      type: 'select',
      required: false,
      options: ['Work Visa', 'Employment Visa', 'Sponsored'],
      appliesTo: [...OVERSEAS_COUNTRIES],
    },
  ],
};
