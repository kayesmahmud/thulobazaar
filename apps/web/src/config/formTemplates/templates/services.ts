/**
 * Services, Jobs, Overseas Jobs & Education Template
 *
 * Single source for all four parents — there is no subcategories/services.ts.
 * Jobs and Overseas Jobs are one shared set each: the eight rows in either parent
 * differ only by a trade/licence field or by salary currency. Fields are gated on
 * real DB subcategory names, never on job titles.
 */

import type { FormTemplate } from '../types';
import { conditionOptional } from '../fields/common';
import { JOBS_SUBCATEGORIES, OVERSEAS_JOBS_SUBCATEGORIES } from '../sharedFields';
import {
  experienceField,
  availabilityField,
  availabilityDomesticField,
  availabilityTeachingField,
  availabilityEventField,
  serviceLocationField,
  serviceLocationFitnessField,
  serviceLocationDomesticField,
  languagesField,
  languageOfInstructionField,
  pricePeriodField,
  pricePeriodInspectionField,
  pricePeriodItField,
  pricePeriodEventField,
  pricePeriodConsultationField,
  pricePeriodTravelField,
  pricePeriodJobField,
  pricePeriodTransportJobField,
  pricePeriodTuitionField,
  serviceTypeBuildingField,
  serviceTypeDomesticField,
  serviceTypeFitnessBeautyField,
  serviceTypeItField,
  serviceTypeMediaEventField,
  serviceTypeProfessionalField,
  serviceTypeRepairField,
  serviceTypeTravelField,
  serviceTypeStudyAbroadField,
  genderServedField,
  tripDurationField,
  lookingForField,
  ageRangeField,
  maritalStatusField,
  jobPostTypeField,
  jobTypeField,
  workLocationTypeField,
  companyNameField,
  educationRequiredField,
  tradeSkillField,
  licenseCategoryField,
  recruitingAgencyField,
  recruiterLicenseField,
  contractDurationField,
  genderRequirementField,
  benefitsField,
  salaryCurrencyField,
  serviceChargeField,
  subjectsField,
  gradeLevelField,
  modeOfTeachingField,
  courseTypeField,
  courseDurationField,
  bookLevelField,
  publisherField,
  destinationCountryField,
  studyLevelField,
} from '../fields/services';

const BUILDING = ['Building maintenance'];
const DOMESTIC = ['Domestic & Daycare Services'];
const FITNESS_BEAUTY = ['Fitness & Beauty Services'];
const IT = ['IT Services'];
const MATRIMONIALS = ['Matrimonials'];
const MEDIA_EVENT = ['Media & Event Management Services'];
const PROFESSIONAL = ['Professional Services'];
const REPAIR = ['Servicing & Repair'];
const TRAVEL = ['Tours & Travels'];
const SERVICES_WITH_EXPERIENCE = [
  ...BUILDING, ...DOMESTIC, ...FITNESS_BEAUTY, ...IT, ...MEDIA_EVENT, ...PROFESSIONAL, ...REPAIR,
];

const TUITION = ['Tuition'];
const COURSES = ['Courses'];
const TEXTBOOKS = ['Textbooks'];
const STUDY_ABROAD = ['Study Abroad'];

const JOBS = [...JOBS_SUBCATEGORIES];
const CONSTRUCTION_JOBS = ['Construction & Trades'];
const TRANSPORT_JOBS = ['Transportation & Logistics'];
const JOBS_STANDARD_PERIOD = JOBS.filter(name => !TRANSPORT_JOBS.includes(name));
const OVERSEAS = [...OVERSEAS_JOBS_SUBCATEGORIES];
const OVERSEAS_EURO = ['Bulgaria', 'Croatia', 'Serbia'];

export const servicesTemplate: FormTemplate = {
  name: 'Services & Jobs',
  icon: '🔧💼',
  fields: [
    // ---- Services ----
    { ...serviceTypeBuildingField, appliesTo: BUILDING },
    { ...serviceTypeDomesticField, appliesTo: DOMESTIC },
    { ...serviceTypeFitnessBeautyField, appliesTo: FITNESS_BEAUTY },
    { ...serviceTypeItField, appliesTo: IT },
    { ...serviceTypeMediaEventField, appliesTo: MEDIA_EVENT },
    { ...serviceTypeProfessionalField, appliesTo: PROFESSIONAL },
    { ...serviceTypeRepairField, appliesTo: REPAIR },
    { ...serviceTypeTravelField, appliesTo: TRAVEL },
    { ...serviceLocationField, appliesTo: [...IT, ...PROFESSIONAL, ...REPAIR] },
    { ...serviceLocationFitnessField, appliesTo: FITNESS_BEAUTY },
    { ...serviceLocationDomesticField, appliesTo: DOMESTIC },
    { ...genderServedField, appliesTo: FITNESS_BEAUTY },
    { ...tripDurationField, appliesTo: TRAVEL },
    { ...availabilityField, appliesTo: [...BUILDING, ...FITNESS_BEAUTY, ...IT, ...PROFESSIONAL, ...REPAIR] },
    { ...availabilityDomesticField, appliesTo: DOMESTIC },
    { ...availabilityEventField, appliesTo: MEDIA_EVENT },
    { ...experienceField, appliesTo: SERVICES_WITH_EXPERIENCE },
    { ...languagesField, appliesTo: [...DOMESTIC, ...PROFESSIONAL] },
    { ...pricePeriodField, appliesTo: DOMESTIC },
    { ...pricePeriodInspectionField, appliesTo: [...BUILDING, ...FITNESS_BEAUTY, ...REPAIR] },
    { ...pricePeriodItField, appliesTo: IT },
    { ...pricePeriodEventField, appliesTo: MEDIA_EVENT },
    { ...pricePeriodConsultationField, appliesTo: PROFESSIONAL },
    { ...pricePeriodTravelField, appliesTo: TRAVEL },
    // Matrimonials has no price at all, so no price period either.
    { ...lookingForField, appliesTo: MATRIMONIALS },
    { ...ageRangeField, appliesTo: MATRIMONIALS },
    { ...maritalStatusField, appliesTo: MATRIMONIALS },

    // ---- Education ----
    { ...courseTypeField, appliesTo: COURSES },
    { ...courseDurationField, appliesTo: COURSES },
    { ...subjectsField, appliesTo: TUITION },
    { ...gradeLevelField, appliesTo: TUITION },
    { ...modeOfTeachingField, appliesTo: [...TUITION, ...COURSES] },
    { ...languageOfInstructionField, appliesTo: TUITION },
    { ...availabilityField, appliesTo: COURSES },
    { ...experienceField, appliesTo: [...TUITION, ...COURSES] },
    { ...availabilityTeachingField, appliesTo: TUITION },
    { ...pricePeriodTuitionField, appliesTo: TUITION },
    { ...pricePeriodField, appliesTo: COURSES },
    { ...bookLevelField, appliesTo: TEXTBOOKS },
    { ...publisherField, appliesTo: TEXTBOOKS },
    { ...conditionOptional, appliesTo: TEXTBOOKS },
    { ...destinationCountryField, appliesTo: STUDY_ABROAD },
    { ...studyLevelField, appliesTo: STUDY_ABROAD },
    { ...serviceTypeStudyAbroadField, appliesTo: STUDY_ABROAD },
    // 'Other Education' is a deliberate catch-all — zero fields is correct.

    // ---- Jobs ----
    { ...jobPostTypeField, appliesTo: JOBS },
    { ...tradeSkillField, appliesTo: CONSTRUCTION_JOBS },
    { ...licenseCategoryField, appliesTo: TRANSPORT_JOBS },
    { ...jobTypeField, appliesTo: JOBS },
    { ...workLocationTypeField, appliesTo: JOBS },
    { ...companyNameField, appliesTo: JOBS },
    { ...experienceField, appliesTo: JOBS },
    { ...educationRequiredField, appliesTo: JOBS },
    { ...pricePeriodJobField, appliesTo: JOBS_STANDARD_PERIOD },
    { ...pricePeriodTransportJobField, appliesTo: TRANSPORT_JOBS },

    // ---- Overseas Jobs ----
    { ...recruitingAgencyField, appliesTo: OVERSEAS },
    { ...recruiterLicenseField, appliesTo: OVERSEAS },
    { ...contractDurationField, appliesTo: OVERSEAS },
    { ...genderRequirementField, appliesTo: OVERSEAS },
    { ...experienceField, appliesTo: OVERSEAS },
    { ...benefitsField, appliesTo: OVERSEAS },
    { ...salaryCurrencyField, options: ['NPR', 'EUR', 'USD'], appliesTo: OVERSEAS_EURO },
    { ...salaryCurrencyField, options: ['MYR', 'NPR', 'USD'], appliesTo: ['Malaysia'] },
    { ...salaryCurrencyField, options: ['QAR', 'NPR', 'USD'], appliesTo: ['Qatar'] },
    { ...salaryCurrencyField, options: ['SAR', 'NPR', 'USD'], appliesTo: ['Saudi Arabia'] },
    { ...salaryCurrencyField, options: ['SGD', 'NPR', 'USD'], appliesTo: ['Singapore'] },
    { ...salaryCurrencyField, options: ['AED', 'NPR', 'USD'], appliesTo: ['UAE'] },
    { ...serviceChargeField, appliesTo: OVERSEAS },
  ],
};
