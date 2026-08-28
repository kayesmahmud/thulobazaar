/**
 * Vehicle Fields
 */

import type { TextField, NumberField, SelectField, MultiselectField } from '../types';
import { MIN_MODEL_YEAR, MAX_MODEL_YEAR } from '../sharedFields';

export const vehicleYearField: NumberField = {
  name: 'year',
  label: 'Year of Manufacture',
  labelNe: 'निर्माण वर्ष',
  type: 'number',
  required: false,
  min: MIN_MODEL_YEAR,
  max: MAX_MODEL_YEAR,
  placeholder: 'e.g., 2020',
  placeholderNe: 'जस्तै, २०२०',
  appliesTo: 'all',};

// "Mileage" means km/l in South Asia — the field actually holds odometer km.
export const mileageField: NumberField = {
  name: 'mileage',
  label: 'Kilometers Driven',
  labelNe: 'चलेको किलोमिटर',
  type: 'number',
  required: false,
  placeholder: 'in km',
  placeholderNe: 'किमी मा',
  appliesTo: 'all',};

export const fuelTypeField: SelectField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: false,
  options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
  optionsNe: ['पेट्रोल', 'डिजेल', 'इलेक्ट्रिक', 'हाइब्रिड', 'सीएनजी'],
  appliesTo: 'all',};

// Nepal's electric two-wheeler market is real (NIU, Yatri, Yadea); CNG/LPG/hybrid
// motorbikes are not.
export const fuelTypeMotorbikeField: SelectField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: false,
  options: ['Petrol', 'Electric'],
  optionsNe: ['पेट्रोल', 'इलेक्ट्रिक'],
  appliesTo: 'all',
};

export const fuelTypeThreeWheelerField: SelectField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: false,
  options: ['Electric', 'Petrol', 'Diesel', 'CNG'],
  optionsNe: ['इलेक्ट्रिक', 'पेट्रोल', 'डिजेल', 'सीएनजी'],
  appliesTo: 'all',
};

export const fuelTypeBusField: SelectField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: false,
  options: ['Diesel', 'Electric', 'CNG'],
  optionsNe: ['डिजेल', 'इलेक्ट्रिक', 'सीएनजी'],
  appliesTo: 'all',
};

export const fuelTypeVanField: SelectField = {
  name: 'fuelType',
  label: 'Fuel Type',
  labelNe: 'इन्धन प्रकार',
  type: 'select',
  required: false,
  options: ['Diesel', 'Petrol', 'Electric', 'CNG'],
  optionsNe: ['डिजेल', 'पेट्रोल', 'इलेक्ट्रिक', 'सीएनजी'],
  appliesTo: 'all',
};

export const transmissionField: SelectField = {
  name: 'transmission',
  label: 'Transmission',
  labelNe: 'ट्रान्समिसन',
  type: 'select',
  required: false,
  options: ['Manual', 'Automatic', 'Semi-Automatic'],
  optionsNe: ['म्यानुअल', 'अटोम्याटिक', 'सेमी-अटोम्याटिक'],
  appliesTo: 'all',};

export const engineCapacityField: NumberField = {
  name: 'engineCapacity',
  label: 'Engine Capacity (cc)',
  labelNe: 'इन्जिन क्षमता (cc)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 1500',
  placeholderNe: 'जस्तै, १५००',
  appliesTo: 'all',};

export const ownersField: SelectField = {
  name: 'owners',
  label: 'Number of Owners',
  labelNe: 'मालिक संख्या',
  type: 'select',
  required: false,
  options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
  optionsNe: ['पहिलो मालिक', 'दोस्रो मालिक', 'तेस्रो मालिक', 'चौथो वा बढी'],
  appliesTo: 'all',};

export const registrationYearField: NumberField = {
  name: 'registrationYear',
  label: 'Registration Year',
  labelNe: 'दर्ता वर्ष',
  type: 'number',
  required: false,
  min: MIN_MODEL_YEAR,
  max: MAX_MODEL_YEAR,
  placeholder: 'e.g., 2020',
  placeholderNe: 'जस्तै, २०२०',
  appliesTo: 'all',};

export const registrationLocationField: SelectField = {
  name: 'registrationLocation',
  label: 'Registration Zone',
  labelNe: 'दर्ता प्रदेश',
  type: 'select',
  required: false,
  options: ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'],
  optionsNe: ['कोशी', 'मधेश', 'बागमती', 'गण्डकी', 'लुम्बिनी', 'कर्णाली', 'सुदूरपश्चिम'],
  appliesTo: 'all',};

export const plateTypeField: SelectField = {
  name: 'plateType',
  label: 'Plate Type',
  labelNe: 'नम्बर प्लेट प्रकार',
  type: 'select',
  required: false,
  options: ['Private', 'Public/Commercial', 'Government', 'Corporation', 'Tourist'],
  optionsNe: ['निजी', 'सार्वजनिक/व्यावसायिक', 'सरकारी', 'संस्थान', 'पर्यटक'],
  appliesTo: 'all',};

export const seatsField: SelectField = {
  name: 'seats',
  label: 'Number of Seats',
  labelNe: 'सिट संख्या',
  type: 'select',
  required: false,
  options: ['2', '4', '5', '7', '8+'],
  optionsNe: ['२', '४', '५', '७', '८+'],
  appliesTo: 'all',};

// The car-shaped list caps far too low for a Hiace or a school van.
export const seatsVanField: SelectField = {
  name: 'seats',
  label: 'Number of Seats',
  labelNe: 'सिट संख्या',
  type: 'select',
  required: false,
  options: ['2', '4', '5', '7', '9', '11', '14+'],
  optionsNe: ['२', '४', '५', '७', '९', '११', '१४+'],
  appliesTo: 'all',
};

export const bodyTypeField: SelectField = {
  name: 'bodyType',
  label: 'Body Type',
  labelNe: 'बडी प्रकार',
  type: 'select',
  required: false,
  options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
  optionsNe: ['सेडान', 'एसयुभी', 'ह्याचब्याक', 'कुपे', 'कन्भर्टिबल', 'पिकअप', 'भ्यान'],
  appliesTo: 'all',};

// One key, per-subcategory option lists — replaces bodyType everywhere except Cars,
// whose silhouette list is genuinely a body type.
export const vehicleTypeField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Car', 'Motorbike', 'Van', 'Truck', 'Bus', 'Three Wheeler'],
  optionsNe: ['कार', 'मोटरबाइक', 'भ्यान', 'ट्रक', 'बस', 'तीन पाङ्ग्रे'],
  appliesTo: 'all',};

export const vehicleTypeMotorbikeField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Scooter', 'Commuter', 'Sports', 'Cruiser', 'Off-road', 'Moped', 'Electric'],
  optionsNe: ['स्कुटर', 'कम्युटर', 'स्पोर्ट्स', 'क्रुजर', 'अफ-रोड', 'मोपेड', 'इलेक्ट्रिक'],
  appliesTo: 'all',
};

export const vehicleTypeThreeWheelerField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Auto Rickshaw', 'E-Rickshaw', 'Safa Tempo', 'Passenger Tempo', 'Loader / Cargo'],
  optionsNe: ['अटो रिक्सा', 'इ-रिक्सा', 'सफा टेम्पो', 'यात्रु टेम्पो', 'लोडर / कार्गो'],
  appliesTo: 'all',
};

export const vehicleTypeTruckField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Mini Truck / Pickup', 'Tipper', 'Tanker', 'Container', 'Flatbed', 'Trailer', 'Mixer', 'Crane', 'Other'],
  optionsNe: ['मिनी ट्रक / पिकअप', 'टिपर', 'ट्यांकर', 'कन्टेनर', 'फ्ल्याटबेड', 'ट्रेलर', 'मिक्सर', 'क्रेन', 'अन्य'],
  appliesTo: 'all',
};

export const vehicleTypeBusField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Micro', 'Mini Bus', 'Deluxe / Tourist', 'Local', 'School Bus', 'Sleeper'],
  optionsNe: ['माइक्रो', 'मिनी बस', 'डिलक्स / पर्यटक', 'लोकल', 'स्कुल बस', 'स्लिपर'],
  appliesTo: 'all',
};

export const vehicleTypeVanField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: ['Passenger Van', 'Cargo / Delivery', 'School Van', 'Micro / Hiace', 'Ambulance'],
  optionsNe: ['यात्रु भ्यान', 'कार्गो / डेलिभरी', 'स्कुल भ्यान', 'माइक्रो / हाइस', 'एम्बुलेन्स'],
  appliesTo: 'all',
};

export const vehicleTypeHeavyDutyField: SelectField = {
  name: 'vehicleType',
  label: 'Vehicle Type',
  labelNe: 'सवारी प्रकार',
  type: 'select',
  required: false,
  options: [
    'Excavator', 'Backhoe', 'Wheel Loader', 'Bulldozer', 'Crane', 'Roller',
    'Grader', 'Tractor', 'Forklift', 'Mixer', 'Drilling Rig', 'Other',
  ],
  optionsNe: [
    'एक्साभेटर', 'ब्याकहो', 'व्हील लोडर', 'बुलडोजर', 'क्रेन', 'रोलर',
    'ग्रेडर', 'ट्र्याक्टर', 'फोर्कलिफ्ट', 'मिक्सर', 'ड्रिलिङ रिग', 'अन्य',
  ],
  appliesTo: 'all',
};

export const payloadCapacityField: NumberField = {
  name: 'payloadCapacity',
  label: 'Load Capacity (tons)',
  labelNe: 'भार क्षमता (टन)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 3, 10, 16',
  placeholderNe: 'जस्तै, ३, १०, १६',
  appliesTo: 'all',};

export const passengerCapacityField: NumberField = {
  name: 'passengerCapacity',
  label: 'Passenger Capacity',
  labelNe: 'यात्रु क्षमता',
  type: 'number',
  required: false,
  placeholder: 'e.g., 25, 45',
  placeholderNe: 'जस्तै, २५, ४५',
  appliesTo: 'all',};

export const routePermitField: TextField = {
  name: 'routePermit',
  label: 'Route Permit',
  labelNe: 'रुट परमिट',
  type: 'text',
  required: false,
  placeholder: 'e.g., Kathmandu-Pokhara, or None',
  placeholderNe: 'जस्तै, काठमाडौं-पोखरा, वा छैन',
  appliesTo: 'all',};

export const operatingHoursField: NumberField = {
  name: 'operatingHours',
  label: 'Operating Hours',
  labelNe: 'चलेको घण्टा',
  type: 'number',
  required: false,
  placeholder: 'e.g., 4500',
  placeholderNe: 'जस्तै, ४५००',
  appliesTo: 'all',};

export const boatTypeField: SelectField = {
  name: 'boatType',
  label: 'Boat Type',
  labelNe: 'डुङ्गा प्रकार',
  type: 'select',
  required: false,
  options: ['Wooden Boat', 'Fiber Boat', 'Motor Boat', 'Pedal Boat', 'Raft', 'Kayak', 'Ferry', 'Other'],
  optionsNe: ['काठको डुङ्गा', 'फाइबर डुङ्गा', 'मोटर बोट', 'प्याडल बोट', 'र्‍याफ्ट', 'काया‌क', 'फेरी', 'अन्य'],
  appliesTo: 'all',};

export const partTypeField: SelectField = {
  name: 'partType',
  label: 'Part Type',
  labelNe: 'पार्ट्स प्रकार',
  type: 'select',
  required: false,
  options: [
    'Engine & Transmission', 'Brakes & Suspension', 'Tyres & Wheels', 'Battery',
    'Lights & Electricals', 'Body Parts', 'Interior', 'Mirrors & Glass',
    'Audio & Electronics', 'Filters & Fluids', 'Helmets & Riding Gear', 'Car Care', 'Other',
  ],
  optionsNe: [
    'इन्जिन र ट्रान्समिसन', 'ब्रेक र सस्पेन्सन', 'टायर र पाङ्ग्रा', 'ब्याट्री',
    'लाइट र इलेक्ट्रिकल', 'बडी पार्ट्स', 'भित्री सामान', 'ऐना र सिसा',
    'अडियो र इलेक्ट्रोनिक्स', 'फिल्टर र मोबिल', 'हेलमेट र राइडिङ गियर', 'कार केयर', 'अन्य',
  ],
  appliesTo: 'all',};

export const compatibleVehicleField: TextField = {
  name: 'compatibleVehicle',
  label: 'Fits Which Vehicle',
  labelNe: 'कुन सवारीमा मिल्छ',
  type: 'text',
  required: false,
  placeholder: 'e.g., Pulsar 150 (2015-2020), Suzuki Swift',
  placeholderNe: 'जस्तै, पल्सर १५० (२०१५-२०२०), सुजुकी स्विफ्ट',
  appliesTo: 'all',};

export const rentalPeriodField: SelectField = {
  name: 'rentalPeriod',
  label: 'Rental Period',
  labelNe: 'भाडा अवधि',
  type: 'select',
  required: false,
  options: ['Per Hour', 'Per Day', 'Per Week', 'Per Month', 'Per Trip'],
  optionsNe: ['प्रति घण्टा', 'प्रति दिन', 'प्रति हप्ता', 'प्रति महिना', 'प्रति ट्रिप'],
  appliesTo: 'all',};

export const withDriverField: SelectField = {
  name: 'withDriver',
  label: 'Driver',
  labelNe: 'चालक',
  type: 'select',
  required: false,
  options: ['With Driver', 'Self-Drive', 'Both'],
  optionsNe: ['चालक सहित', 'आफैं चलाउने', 'दुवै'],
  appliesTo: 'all',};

export const vehicleTypesServicedField: MultiselectField = {
  name: 'vehicleTypesServiced',
  label: 'Vehicles Serviced',
  labelNe: 'सेवा दिइने सवारी',
  type: 'multiselect',
  required: false,
  options: ['Car', 'Motorbike & Scooter', 'Van & Jeep', 'Truck & Bus', 'Three Wheeler', 'Heavy Equipment'],
  optionsNe: ['कार', 'मोटरबाइक र स्कुटर', 'भ्यान र जीप', 'ट्रक र बस', 'तीन पाङ्ग्रे', 'हेभी उपकरण'],
  appliesTo: 'all',};

export const serviceOptionsField: MultiselectField = {
  name: 'serviceOptions',
  label: 'Service Options',
  labelNe: 'सेवा सुविधा',
  type: 'multiselect',
  required: false,
  options: ['Pickup & Drop', 'On-site Service', '24hr Service', 'Work Warranty', 'Genuine Parts'],
  optionsNe: ['पिकअप र ड्रप', 'स्थलमै सेवा', '२४ घण्टा सेवा', 'कामको ग्यारेन्टी', 'जेनुइन पार्ट्स'],
  appliesTo: 'all',};

export const bicycleTypeField: SelectField = {
  name: 'bicycleType',
  label: 'Bicycle Type',
  labelNe: 'साइकल प्रकार',
  type: 'select',
  required: false,
  options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Gravel/Touring', 'BMX', 'Folding', 'Electric', 'Kids Bike'],
  optionsNe: ['माउन्टेन बाइक', 'रोड बाइक', 'हाइब्रिड', 'ग्राभेल/टुरिङ', 'बीएमएक्स', 'फोल्डिङ', 'इलेक्ट्रिक', 'बच्चाको साइकल'],
  appliesTo: 'all',};

export const frameSizeField: SelectField = {
  name: 'frameSize',
  label: 'Frame Size',
  labelNe: 'फ्रेम साइज',
  type: 'select',
  required: false,
  options: ['Kids', 'XS (13-14")', 'S (15-16")', 'M (17-18")', 'L (19-20")', 'XL (21"+)'],
  optionsNe: ['बच्चाको', 'XS (१३-१४")', 'S (१५-१६")', 'M (१७-१८")', 'L (१९-२०")', 'XL (२१"+)'],
  appliesTo: 'all',};

export const gearsField: SelectField = {
  name: 'gears',
  label: 'Gears',
  labelNe: 'गियर',
  type: 'select',
  required: false,
  options: ['Single Speed', '3-7 Gears', '8-14 Gears', '15-21 Gears', '21+ Gears'],
  optionsNe: ['सिंगल स्पिड', '३-७ गियर', '८-१४ गियर', '१५-२१ गियर', '२१+ गियर'],
  appliesTo: 'all',};
