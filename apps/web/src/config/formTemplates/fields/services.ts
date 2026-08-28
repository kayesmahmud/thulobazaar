/**
 * Services, Jobs, Overseas Jobs & Education Fields
 *
 * `serviceType`, `availability`, `serviceLocation` and `pricePeriod` are single
 * keys with per-subcategory option lists, exported once per option domain under
 * the same `name`. The template picks one per subcategory via appliesTo.
 */

import type { TextField, SelectField, MultiselectField } from '../types';

export const experienceField: SelectField = {
  name: 'experience',
  label: 'Experience',
  labelNe: 'अनुभव',
  type: 'select',
  required: false,
  options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
  optionsNe: ['१ वर्ष भन्दा कम', '१-३ वर्ष', '३-५ वर्ष', '५-१० वर्ष', '१०+ वर्ष'],
  appliesTo: 'all',};

export const availabilityField: MultiselectField = {
  name: 'availability',
  label: 'Availability',
  labelNe: 'उपलब्धता',
  type: 'multiselect',
  required: false,
  options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
  optionsNe: ['हप्ताको दिन', 'शनिबार/आइतबार', 'साँझ', '२४/७', 'कलमा'],
  appliesTo: 'all',};

// Live-in vs live-out is the decisive attribute for domestic help; a select
// carries it without a boolean that would leak "false" into the spec rows.
export const availabilityDomesticField: MultiselectField = {
  name: 'availability',
  label: 'Availability',
  labelNe: 'उपलब्धता',
  type: 'multiselect',
  required: false,
  options: ['Full Day', 'Half Day', 'Live-in', 'Weekdays', 'Weekends', 'On-Call'],
  optionsNe: ['पूरा दिन', 'आधा दिन', 'बसेर काम', 'हप्ताको दिन', 'शनिबार/आइतबार', 'कलमा'],
  appliesTo: 'all',};

export const availabilityTeachingField: MultiselectField = {
  name: 'availability',
  label: 'Availability',
  labelNe: 'उपलब्धता',
  type: 'multiselect',
  required: false,
  options: ['Morning', 'Day', 'Evening', 'Weekend', 'Flexible'],
  optionsNe: ['बिहान', 'दिउँसो', 'साँझ', 'शनिबार/आइतबार', 'लचिलो'],
  appliesTo: 'all',};

export const availabilityEventField: MultiselectField = {
  name: 'availability',
  label: 'Availability',
  labelNe: 'उपलब्धता',
  type: 'multiselect',
  required: false,
  options: ['Weekdays', 'Weekends', 'Peak Season (Wedding)', 'Flexible'],
  optionsNe: ['हप्ताको दिन', 'शनिबार/आइतबार', 'विवाहको सिजन', 'लचिलो'],
  appliesTo: 'all',};

export const serviceLocationField: SelectField = {
  name: 'serviceLocation',
  label: 'Service Location',
  labelNe: 'सेवा स्थान',
  type: 'select',
  required: false,
  options: ['At Customer Location', 'At Provider Location', 'Remote/Online'],
  optionsNe: ['ग्राहकको स्थानमा', 'प्रदायकको स्थानमा', 'रिमोट/अनलाइन'],
  appliesTo: 'all',};

export const serviceLocationFitnessField: SelectField = {
  name: 'serviceLocation',
  label: 'Service Location',
  labelNe: 'सेवा स्थान',
  type: 'select',
  required: false,
  options: ['At Customer Location', 'At Gym/Studio', 'At Salon/Parlour'],
  optionsNe: ['ग्राहकको स्थानमा', 'जिम/स्टुडियोमा', 'सैलुन/पार्लरमा'],
  appliesTo: 'all',};

export const serviceLocationDomesticField: SelectField = {
  name: 'serviceLocation',
  label: 'Service Location',
  labelNe: 'सेवा स्थान',
  type: 'select',
  required: false,
  options: ['At Customer Home', 'At Daycare Centre'],
  optionsNe: ['ग्राहकको घरमा', 'डेकेयर केन्द्रमा'],
  appliesTo: 'all',};

export const languagesField: MultiselectField = {
  name: 'languages',
  label: 'Languages Known',
  labelNe: 'भाषा',
  type: 'multiselect',
  required: false,
  options: ['Nepali', 'English', 'Hindi', 'Newari', 'Other'],
  optionsNe: ['नेपाली', 'अंग्रेजी', 'हिन्दी', 'नेवारी', 'अन्य'],
  appliesTo: 'all',};

export const pricePeriodField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Visit', 'Per Day', 'Per Month', 'Per Project'],
  optionsNe: ['प्रति घण्टा', 'प्रति भिजिट', 'प्रति दिन', 'प्रति महिना', 'प्रति प्रोजेक्ट'],
  appliesTo: 'all',};

export const pricePeriodInspectionField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Visit', 'Per Day', 'Per Project', 'Free Inspection'],
  optionsNe: ['प्रति घण्टा', 'प्रति भिजिट', 'प्रति दिन', 'प्रति प्रोजेक्ट', 'निःशुल्क निरीक्षण'],
  appliesTo: 'all',};

export const pricePeriodJobField: SelectField = {
  name: 'pricePeriod',
  label: 'Salary Period',
  labelNe: 'तलब अवधि',
  type: 'select',
  required: false,
  options: ['Per Month', 'Per Day', 'Per Hour', 'Per Project'],
  optionsNe: ['प्रति महिना', 'प्रति दिन', 'प्रति घण्टा', 'प्रति प्रोजेक्ट'],
  appliesTo: 'all',};

export const pricePeriodTransportJobField: SelectField = {
  name: 'pricePeriod',
  label: 'Salary Period',
  labelNe: 'तलब अवधि',
  type: 'select',
  required: false,
  options: ['Per Month', 'Per Day', 'Per Hour', 'Per Trip', 'Per Project'],
  optionsNe: ['प्रति महिना', 'प्रति दिन', 'प्रति घण्टा', 'प्रति ट्रिप', 'प्रति प्रोजेक्ट'],
  appliesTo: 'all',};

export const pricePeriodTuitionField: SelectField = {
  name: 'pricePeriod',
  label: 'Fee Period',
  labelNe: 'शुल्क अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Month', 'Per Subject', 'Per Course'],
  optionsNe: ['प्रति घण्टा', 'प्रति महिना', 'प्रति विषय', 'प्रति कोर्स'],
  appliesTo: 'all',};

export const pricePeriodItField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Project', 'Per Month'],
  optionsNe: ['प्रति घण्टा', 'प्रति प्रोजेक्ट', 'प्रति महिना'],
  appliesTo: 'all',};

export const pricePeriodEventField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Event', 'Per Day', 'Per Hour', 'Per Package'],
  optionsNe: ['प्रति कार्यक्रम', 'प्रति दिन', 'प्रति घण्टा', 'प्रति प्याकेज'],
  appliesTo: 'all',};

export const pricePeriodConsultationField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Visit', 'Per Case', 'Per Month', 'Free Consultation'],
  optionsNe: ['प्रति घण्टा', 'प्रति भिजिट', 'प्रति केस', 'प्रति महिना', 'निःशुल्क परामर्श'],
  appliesTo: 'all',};

export const pricePeriodTravelField: SelectField = {
  name: 'pricePeriod',
  label: 'Price Period',
  labelNe: 'मूल्य अवधि',
  type: 'select',
  required: false,
  options: ['Per Person', 'Per Package', 'Per Vehicle', 'Per Day'],
  optionsNe: ['प्रति व्यक्ति', 'प्रति प्याकेज', 'प्रति सवारी', 'प्रति दिन'],
  appliesTo: 'all',};

// ============================================
// serviceType — one key, one option list per subcategory
// ============================================

export const serviceTypeBuildingField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Plumbing', 'Electrical', 'Painting', 'Masonry & Tiling', 'Carpentry', 'Cleaning',
    'Pest Control', 'Waterproofing', 'Welding & Grill', 'House Shifting', 'Other',
  ],
  optionsNe: [
    'प्लम्बिङ', 'इलेक्ट्रिकल', 'रंगरोगन', 'डकर्मी र टायल', 'सिकर्मी', 'सरसफाइ',
    'किरा नियन्त्रण', 'वाटरप्रुफिङ', 'वेल्डिङ र ग्रिल', 'घरसारी', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeDomesticField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'House Maid', 'Cook', 'Nanny', 'Elderly Care', 'Daycare Centre',
    'Housekeeping', 'Domestic Driver', 'Other',
  ],
  optionsNe: [
    'घरेलु सहयोगी', 'भान्से', 'बच्चा हेरचाह', 'ज्येष्ठ नागरिक हेरचाह', 'डेकेयर केन्द्र',
    'हाउसकिपिङ', 'घरेलु चालक', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeFitnessBeautyField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Gym Trainer', 'Yoga', 'Zumba & Dance', 'Salon & Parlour', 'Bridal Makeup',
    'Hair & Spa', 'Massage Therapy', 'Nutrition', 'Other',
  ],
  optionsNe: [
    'जिम ट्रेनर', 'योग', 'जुम्बा र नृत्य', 'सैलुन र पार्लर', 'दुलही मेकअप',
    'कपाल र स्पा', 'मसाज थेरापी', 'पोषण', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeItField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Web Development', 'Mobile App', 'Software', 'Graphic Design', 'Digital Marketing & SEO',
    'Networking', 'Computer Repair', 'Data Entry', 'Hosting', 'Other',
  ],
  optionsNe: [
    'वेब डेभलपमेन्ट', 'मोबाइल एप', 'सफ्टवेयर', 'ग्राफिक डिजाइन', 'डिजिटल मार्केटिङ र एसईओ',
    'नेटवर्किङ', 'कम्प्युटर मर्मत', 'डाटा एन्ट्री', 'होस्टिङ', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeMediaEventField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Photography', 'Videography', 'Wedding Planning', 'Decoration', 'Catering',
    'Sound & DJ', 'Tent House', 'MC / Anchor', 'Printing', 'Other',
  ],
  optionsNe: [
    'फोटोग्राफी', 'भिडियोग्राफी', 'विवाह योजना', 'सजावट', 'क्याटरिङ',
    'साउन्ड र डिजे', 'टेन्ट हाउस', 'एमसी / एंकर', 'प्रिन्टिङ', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeProfessionalField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Legal', 'Accounting & Tax', 'Audit', 'Architecture', 'Engineering',
    'Translation', 'Business Consulting', 'Insurance', 'Photography', 'Other',
  ],
  optionsNe: [
    'कानुनी', 'लेखा र कर', 'लेखापरीक्षण', 'आर्किटेक्चर', 'इन्जिनियरिङ',
    'अनुवाद', 'व्यापार परामर्श', 'बीमा', 'फोटोग्राफी', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeRepairField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Mobile & Laptop', 'TV & Electronics', 'AC & Fridge', 'Washing Machine', 'Plumbing',
    'Electrical', 'Furniture', 'Vehicle', 'Watch', 'Other',
  ],
  optionsNe: [
    'मोबाइल र ल्यापटप', 'टिभी र इलेक्ट्रोनिक्स', 'एसी र फ्रिज', 'वासिङ मेसिन', 'प्लम्बिङ',
    'इलेक्ट्रिकल', 'फर्निचर', 'सवारी साधन', 'घडी', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeTravelField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Trekking', 'Tour Package', 'Air Ticketing', 'Hotel Booking', 'Vehicle Hire',
    'Visa & Documentation', 'Pilgrimage', 'Adventure', 'Other',
  ],
  optionsNe: [
    'ट्रेकिङ', 'टुर प्याकेज', 'हवाई टिकट', 'होटल बुकिङ', 'सवारी भाडा',
    'भिसा र कागजात', 'तीर्थयात्रा', 'साहसिक', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeMobileRepairField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Screen Repair', 'Battery Replacement', 'Software & Flashing', 'Water Damage',
    'Unlocking & IMEI', 'Data Recovery', 'Buy-Back', 'Other',
  ],
  optionsNe: [
    'स्क्रिन मर्मत', 'ब्याट्री फेर्ने', 'सफ्टवेयर र फ्ल्यासिङ', 'पानी क्षति',
    'अनलक र आईएमईआई', 'डाटा रिकभरी', 'बाइ-ब्याक', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeAutoField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: [
    'Servicing & Oil Change', 'Denting & Painting', 'Mechanical', 'Electrical', 'AC Service',
    'Tyre & Alignment', 'Battery', 'Car Wash', 'Insurance', 'Bluebook Renewal', 'Towing', 'Other',
  ],
  optionsNe: [
    'सर्भिसिङ र मोबिल', 'डेन्टिङ र पेन्टिङ', 'मेकानिकल', 'इलेक्ट्रिकल', 'एसी सर्भिस',
    'टायर र एलाइनमेन्ट', 'ब्याट्री', 'कार वास', 'बीमा', 'ब्लुबुक नवीकरण', 'टोइङ', 'अन्य',
  ],
  appliesTo: 'all',};

export const serviceTypeStudyAbroadField: SelectField = {
  name: 'serviceType',
  label: 'Service Type',
  labelNe: 'सेवा प्रकार',
  type: 'select',
  required: false,
  options: ['Counselling', 'Test Preparation', 'Documentation', 'Visa Processing', 'Scholarship'],
  optionsNe: ['परामर्श', 'परीक्षा तयारी', 'कागजात', 'भिसा प्रक्रिया', 'छात्रवृत्ति'],
  appliesTo: 'all',};

export const genderServedField: SelectField = {
  name: 'genderServed',
  label: 'Clients Served',
  labelNe: 'सेवा दिइने',
  type: 'select',
  required: false,
  options: ['Male', 'Female', 'Unisex'],
  optionsNe: ['पुरुष', 'महिला', 'दुवै'],
  appliesTo: 'all',};

export const tripDurationField: SelectField = {
  name: 'tripDuration',
  label: 'Trip Duration',
  labelNe: 'यात्रा अवधि',
  type: 'select',
  required: false,
  options: ['1 Day', '2-3 Days', '4-7 Days', '1-2 Weeks', '2+ Weeks'],
  optionsNe: ['१ दिन', '२-३ दिन', '४-७ दिन', '१-२ हप्ता', '२+ हप्ता'],
  appliesTo: 'all',};

// Matrimonials — deliberately no caste, religion, complexion or horoscope fields.
export const lookingForField: SelectField = {
  name: 'lookingFor',
  label: 'Looking For',
  labelNe: 'खोजिएको',
  type: 'select',
  required: false,
  options: ['Bride', 'Groom'],
  optionsNe: ['दुलही', 'दुलहा'],
  appliesTo: 'all',};

export const ageRangeField: SelectField = {
  name: 'ageRange',
  label: 'Age Range',
  labelNe: 'उमेर समूह',
  type: 'select',
  required: false,
  options: ['18-24', '25-29', '30-34', '35-39', '40-49', '50+'],
  optionsNe: ['१८-२४', '२५-२९', '३०-३४', '३५-३९', '४०-४९', '५०+'],
  appliesTo: 'all',};

export const maritalStatusField: SelectField = {
  name: 'maritalStatus',
  label: 'Marital Status',
  labelNe: 'वैवाहिक स्थिति',
  type: 'select',
  required: false,
  options: ['Never Married', 'Divorced', 'Widowed'],
  optionsNe: ['अविवाहित', 'सम्बन्ध विच्छेद', 'विधुर/विधवा'],
  appliesTo: 'all',};

// ============================================
// Jobs
// ============================================

export const jobPostTypeField: SelectField = {
  name: 'jobPostType',
  label: 'Post Type',
  labelNe: 'पोस्ट प्रकार',
  type: 'select',
  required: false,
  options: ['Hiring', 'Looking for a Job'],
  optionsNe: ['कर्मचारी चाहियो', 'जागिर खोज्दै'],
  appliesTo: 'all',};

export const jobTypeField: SelectField = {
  name: 'jobType',
  label: 'Job Type',
  labelNe: 'जागिर प्रकार',
  type: 'select',
  required: false,
  options: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
  optionsNe: ['पूर्णकालीन', 'अंशकालीन', 'करार', 'इन्टर्नशिप', 'फ्रिल्यान्स'],
  appliesTo: 'all',};

export const workLocationTypeField: SelectField = {
  name: 'workLocationType',
  label: 'Work Location',
  labelNe: 'कामको स्थान',
  type: 'select',
  required: false,
  options: ['On-site', 'Hybrid', 'Remote', 'Field Work'],
  optionsNe: ['कार्यस्थलमा', 'हाइब्रिड', 'घरबाट', 'फिल्ड कार्य'],
  appliesTo: 'all',};

export const companyNameField: TextField = {
  name: 'companyName',
  label: 'Company / Employer Name',
  labelNe: 'कम्पनी / रोजगारदाताको नाम',
  type: 'text',
  required: false,
  placeholder: 'Enter company name',
  placeholderNe: 'कम्पनीको नाम लेख्नुहोस्',
  appliesTo: 'all',};

export const educationRequiredField: SelectField = {
  name: 'educationRequired',
  label: 'Education Required',
  labelNe: 'आवश्यक शिक्षा',
  type: 'select',
  required: false,
  options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
  optionsNe: ['औपचारिक शिक्षा छैन', 'एसएलसी/एसईई', '+२', 'स्नातक', 'स्नातकोत्तर', 'पीएचडी'],
  appliesTo: 'all',};

export const tradeSkillField: SelectField = {
  name: 'tradeSkill',
  label: 'Trade / Skill',
  labelNe: 'सीप',
  type: 'select',
  required: false,
  options: [
    'Mason', 'Carpenter', 'Electrician', 'Plumber', 'Painter', 'Welder',
    'Steel Fixer', 'Helper', 'Site Supervisor', 'Other',
  ],
  optionsNe: [
    'डकर्मी', 'सिकर्मी', 'इलेक्ट्रिसियन', 'प्लम्बर', 'रंगरोगन गर्ने', 'वेल्डर',
    'स्टिल फिक्सर', 'सहयोगी', 'साइट सुपरभाइजर', 'अन्य',
  ],
  appliesTo: 'all',};

export const licenseCategoryField: MultiselectField = {
  name: 'licenseCategory',
  label: 'Licence Category',
  labelNe: 'लाइसेन्स श्रेणी',
  type: 'multiselect',
  required: false,
  options: [
    'A - Motorcycle', 'B - Car/Jeep', 'C - Truck', 'D - Bus', 'K - Scooter',
    'Heavy Equipment', 'Not Required',
  ],
  optionsNe: [
    'A - मोटरसाइकल', 'B - कार/जीप', 'C - ट्रक', 'D - बस', 'K - स्कुटर',
    'हेभी उपकरण', 'आवश्यक छैन',
  ],
  appliesTo: 'all',};

// ============================================
// Overseas Jobs
// ============================================

export const recruitingAgencyField: TextField = {
  name: 'companyName',
  label: 'Recruiting Agency / Employer',
  labelNe: 'भर्ना एजेन्सी / रोजगारदाता',
  type: 'text',
  required: false,
  placeholder: 'Enter agency or employer name',
  placeholderNe: 'एजेन्सी वा रोजगारदाताको नाम लेख्नुहोस्',
  appliesTo: 'all',};

export const recruiterLicenseField: TextField = {
  name: 'recruiterLicense',
  label: 'Recruitment Licence No. (DoFE)',
  labelNe: 'भर्ना इजाजतपत्र नं. (वैदेशिक रोजगार विभाग)',
  type: 'text',
  required: false,
  placeholder: 'e.g., 1234/075/076',
  placeholderNe: 'जस्तै, १२३४/०७५/०७६',
  appliesTo: 'all',};

export const contractDurationField: SelectField = {
  name: 'contractDuration',
  label: 'Contract Duration',
  labelNe: 'करार अवधि',
  type: 'select',
  required: false,
  options: ['1 year', '2 years', '3 years', '3+ years'],
  optionsNe: ['१ वर्ष', '२ वर्ष', '३ वर्ष', '३+ वर्ष'],
  appliesTo: 'all',};

// Not `gender` — that key already means the animal's sex under Pets & Animals.
export const genderRequirementField: SelectField = {
  name: 'genderRequirement',
  label: 'Gender Requirement',
  labelNe: 'लिङ्ग आवश्यकता',
  type: 'select',
  required: false,
  options: ['Male', 'Female', 'Both'],
  optionsNe: ['पुरुष', 'महिला', 'दुवै'],
  appliesTo: 'all',};

export const benefitsField: MultiselectField = {
  name: 'benefits',
  label: 'Benefits',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: ['Food', 'Accommodation', 'Transport', 'Medical Insurance', 'Overtime'],
  optionsNe: ['खाना', 'बसोबास', 'यातायात', 'स्वास्थ्य बीमा', 'ओभरटाइम'],
  appliesTo: 'all',};

// Currency codes are not translated — the Nepali form shows the same codes.
export const salaryCurrencyField: SelectField = {
  name: 'salaryCurrency',
  label: 'Salary Currency',
  labelNe: 'तलब मुद्रा',
  type: 'select',
  required: false,
  options: ['NPR', 'USD'],
  appliesTo: 'all',};

export const serviceChargeField: SelectField = {
  name: 'serviceCharge',
  label: 'Service Charge',
  labelNe: 'सेवा शुल्क',
  type: 'select',
  required: false,
  options: ['Free Visa Free Ticket', 'As per Government Rule', 'Contact for Details'],
  optionsNe: ['नि:शुल्क भिसा नि:शुल्क टिकट', 'सरकारी नियम अनुसार', 'विस्तृत जानकारीको लागि सम्पर्क'],
  appliesTo: 'all',};

// ============================================
// Education
// ============================================

export const subjectsField: MultiselectField = {
  name: 'subjects',
  label: 'Subject',
  labelNe: 'विषय',
  type: 'multiselect',
  required: false,
  options: ['Math', 'Science', 'English', 'Nepali', 'Social Studies', 'Computer', 'Accounts', 'All Subjects'],
  optionsNe: ['गणित', 'विज्ञान', 'अंग्रेजी', 'नेपाली', 'सामाजिक अध्ययन', 'कम्प्युटर', 'लेखा', 'सबै विषय'],
  appliesTo: 'all',};

export const gradeLevelField: MultiselectField = {
  name: 'gradeLevel',
  label: 'Grade/Level',
  labelNe: 'कक्षा/तह',
  type: 'multiselect',
  required: false,
  options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
  optionsNe: ['प्राथमिक (१-५)', 'माध्यमिक (६-१०)', '+२/मध्यवर्ती', 'स्नातक', 'स्नातकोत्तर'],
  appliesTo: 'all',};

export const modeOfTeachingField: SelectField = {
  name: 'modeOfTeaching',
  label: 'Class Mode',
  labelNe: 'कक्षा विधि',
  type: 'select',
  required: false,
  options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
  optionsNe: ['घर ट्युसन', 'अनलाइन', 'संस्थामा', 'सामूहिक कक्षा'],
  appliesTo: 'all',};

// The old list offered Chinese/Japanese/Korean/Arabic and dropped Nepali —
// the language the overwhelming majority of tuition is actually delivered in.
export const languageOfInstructionField: MultiselectField = {
  name: 'languages',
  label: 'Language of Instruction',
  labelNe: 'शिक्षण भाषा',
  type: 'multiselect',
  required: false,
  options: ['Nepali', 'English', 'Hindi', 'Newari', 'Other'],
  optionsNe: ['नेपाली', 'अंग्रेजी', 'हिन्दी', 'नेवारी', 'अन्य'],
  appliesTo: 'all',};

export const courseTypeField: SelectField = {
  name: 'courseType',
  label: 'Course Type',
  labelNe: 'कोर्स प्रकार',
  type: 'select',
  required: false,
  options: [
    'IELTS / TOEFL / PTE', 'Language', 'Computer & IT', 'Accounting & Tally', 'Driving',
    'Cooking', 'Beauty & Tailoring', 'Music, Dance & Art', 'Bridge & Entrance',
    'Professional Certification', 'Other',
  ],
  optionsNe: [
    'आईईएलटीएस / टोफेल / पीटीई', 'भाषा', 'कम्प्युटर र आईटी', 'लेखा र ट्याली', 'ड्राइभिङ',
    'खाना पकाउने', 'ब्युटी र सिलाइकटाइ', 'संगीत, नृत्य र कला', 'ब्रिज र प्रवेश परीक्षा',
    'व्यावसायिक प्रमाणपत्र', 'अन्य',
  ],
  appliesTo: 'all',};

export const courseDurationField: SelectField = {
  name: 'courseDuration',
  label: 'Course Duration',
  labelNe: 'कोर्स अवधि',
  type: 'select',
  required: false,
  options: ['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', '1+ years'],
  optionsNe: ['१ महिना भन्दा कम', '१-३ महिना', '३-६ महिना', '६-१२ महिना', '१+ वर्ष'],
  appliesTo: 'all',};

export const bookLevelField: SelectField = {
  name: 'bookLevel',
  label: 'Book Level',
  labelNe: 'पुस्तक तह',
  type: 'select',
  required: false,
  options: ['School (1-10)', '+2', 'Bachelor', 'Master', 'Entrance', 'Loksewa', 'Other'],
  optionsNe: ['विद्यालय (१-१०)', '+२', 'स्नातक', 'स्नातकोत्तर', 'प्रवेश परीक्षा', 'लोकसेवा', 'अन्य'],
  appliesTo: 'all',};

export const publisherField: TextField = {
  name: 'publisher',
  label: 'Publisher',
  labelNe: 'प्रकाशक',
  type: 'text',
  required: false,
  placeholder: 'e.g., Vidyarthi Pustak Bhandar, Ekta Books',
  placeholderNe: 'जस्तै, विद्यार्थी पुस्तक भण्डार, एकता बुक्स',
  appliesTo: 'all',};

export const destinationCountryField: MultiselectField = {
  name: 'destinationCountry',
  label: 'Destination Country',
  labelNe: 'गन्तव्य देश',
  type: 'multiselect',
  required: false,
  options: [
    'Australia', 'USA', 'UK', 'Canada', 'Japan', 'Korea', 'Germany', 'New Zealand',
    'Ireland', 'China', 'India', 'UAE', 'Poland', 'Other',
  ],
  optionsNe: [
    'अस्ट्रेलिया', 'अमेरिका', 'बेलायत', 'क्यानडा', 'जापान', 'कोरिया', 'जर्मनी', 'न्युजिल्यान्ड',
    'आयरल्यान्ड', 'चीन', 'भारत', 'यूएई', 'पोल्यान्ड', 'अन्य',
  ],
  appliesTo: 'all',};

export const studyLevelField: SelectField = {
  name: 'studyLevel',
  label: 'Study Level',
  labelNe: 'अध्ययन तह',
  type: 'select',
  required: false,
  options: ['Foundation / Diploma', 'Bachelor', 'Master', 'PhD', 'Language Course'],
  optionsNe: ['फाउन्डेसन / डिप्लोमा', 'स्नातक', 'स्नातकोत्तर', 'पीएचडी', 'भाषा कोर्स'],
  appliesTo: 'all',};
