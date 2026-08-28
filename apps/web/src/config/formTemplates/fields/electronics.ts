/**
 * Electronics & Mobiles Fields
 *
 * Brand, storage, RAM and screen-size lists carry no `optionsNe` on purpose:
 * they are model numbers, capacities and brand names that Nepali sellers type
 * and search in Latin script. A deliberate English fallback beats a wrong or
 * mismatched translation.
 */

import type { TextField, NumberField, SelectField, MultiselectField } from '../types';

export const storageField: SelectField = {
  name: 'storage',
  label: 'Storage Capacity',
  labelNe: 'भण्डारण क्षमता',
  type: 'select',
  required: false,
  options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
  appliesTo: 'all',};

export const storageLaptopField: SelectField = {
  name: 'storage',
  label: 'Storage Capacity',
  labelNe: 'भण्डारण क्षमता',
  type: 'select',
  required: false,
  options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD', 'SSD + HDD (Dual)'],
  appliesTo: 'all',};

export const storageDesktopField: SelectField = {
  name: 'storage',
  label: 'Storage Capacity',
  labelNe: 'भण्डारण क्षमता',
  type: 'select',
  required: false,
  options: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD', '4TB HDD', 'SSD + HDD (Dual)'],
  appliesTo: 'all',};

export const storageConsoleField: SelectField = {
  name: 'storage',
  label: 'Storage Capacity',
  labelNe: 'भण्डारण क्षमता',
  type: 'select',
  required: false,
  options: ['256GB', '500GB', '512GB', '825GB', '1TB', '2TB'],
  appliesTo: 'all',};

// 32GB and 64GB phones do not exist; 2GB/3GB laptops do not either.
export const ramPhoneField: SelectField = {
  name: 'ram',
  label: 'RAM',
  labelNe: 'र्‍याम',
  type: 'select',
  required: false,
  options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'],
  appliesTo: 'all',};

export const ramComputerField: SelectField = {
  name: 'ram',
  label: 'RAM',
  labelNe: 'र्‍याम',
  type: 'select',
  required: false,
  options: ['4GB', '8GB', '16GB', '32GB', '64GB'],
  appliesTo: 'all',};

export const batteryHealthField: SelectField = {
  name: 'batteryHealth',
  label: 'Battery Health',
  labelNe: 'ब्याट्री स्वास्थ्य',
  type: 'select',
  required: false,
  options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
  optionsNe: ['१००%', '९५-९९%', '९०-९४%', '८५-८९%', '८०-८४%', '८०% भन्दा कम'],
  appliesTo: 'all',};

export const processorField: TextField = {
  name: 'processor',
  label: 'Processor',
  labelNe: 'प्रोसेसर',
  type: 'text',
  required: false,
  placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
  placeholderNe: 'जस्तै, Intel Core i5, AMD Ryzen 7',
  appliesTo: 'all',};

export const graphicsField: TextField = {
  name: 'graphics',
  label: 'Graphics Card',
  labelNe: 'ग्राफिक्स कार्ड',
  type: 'text',
  required: false,
  placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
  placeholderNe: 'जस्तै, NVIDIA RTX 3060',
  appliesTo: 'all',};

// A TV panel spec, not a laptop one — the old list offered "Retina" for TVs.
export const screenResolutionField: SelectField = {
  name: 'screenResolution',
  label: 'Screen Resolution',
  labelNe: 'स्क्रिन रिजोलुसन',
  type: 'select',
  required: false,
  options: ['HD Ready', 'Full HD', '4K UHD', '8K'],
  optionsNe: ['एचडी रेडी', 'फुल एचडी', '4K UHD', '8K'],
  appliesTo: 'all',};

export const screenSizeTvField: SelectField = {
  name: 'screenSize',
  label: 'Screen Size',
  labelNe: 'स्क्रिन साइज',
  type: 'select',
  required: false,
  options: ['24"', '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"+'],
  appliesTo: 'all',};

export const screenSizeLaptopField: SelectField = {
  name: 'screenSize',
  label: 'Screen Size',
  labelNe: 'स्क्रिन साइज',
  type: 'select',
  required: false,
  options: ['11.6"', '13.3"', '14"', '15.6"', '16"', '17.3"'],
  appliesTo: 'all',};

export const smartFeaturesField: MultiselectField = {
  name: 'smartFeatures',
  label: 'Smart Features',
  labelNe: 'स्मार्ट सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: ['Smart TV', 'HDR', 'Android TV', 'WebOS', 'Tizen', 'Built-in WiFi', 'Voice Control'],
  optionsNe: ['स्मार्ट टिभी', 'एचडीआर', 'एन्ड्रोइड टिभी', 'वेबओएस', 'टाइजेन', 'बिल्ट-इन वाइफाइ', 'भ्वाइस कन्ट्रोल'],
  appliesTo: 'all',};

export const megapixelsField: NumberField = {
  name: 'megapixels',
  label: 'Megapixels',
  labelNe: 'मेगापिक्सेल',
  type: 'number',
  required: false,
  placeholder: 'leave blank for lenses & accessories',
  placeholderNe: 'लेन्स र सहायक सामग्रीको लागि खाली छोड्नुहोस्',
  appliesTo: 'all',};

// Sensor size used to be stored under the screenSize key — a live mislabelling.
export const sensorSizeField: SelectField = {
  name: 'sensorSize',
  label: 'Sensor Size',
  labelNe: 'सेन्सर साइज',
  type: 'select',
  required: false,
  options: ['Full Frame', 'APS-C', 'Micro 4/3', '1 inch', 'Medium Format', 'Action/Compact', 'N/A'],
  appliesTo: 'all',};

export const cameraTypeField: SelectField = {
  name: 'cameraType',
  label: 'Camera Type',
  labelNe: 'क्यामेरा प्रकार',
  type: 'select',
  required: false,
  options: [
    'DSLR', 'Mirrorless', 'Point & Shoot', 'Action Camera', 'Camcorder',
    'Drone', 'Lens', 'Tripod & Gimbal', 'Lighting', 'Other',
  ],
  optionsNe: [
    'डीएसएलआर', 'मिररलेस', 'पोइन्ट एन्ड सुट', 'एक्सन क्यामेरा', 'क्यामकोर्डर',
    'ड्रोन', 'लेन्स', 'ट्राइपोड र जिम्बल', 'लाइटिङ', 'अन्य',
  ],
  appliesTo: 'all',};

export const accessoryTypeMobileField: SelectField = {
  name: 'accessoryType',
  label: 'Accessory Type',
  labelNe: 'सहायक सामग्री प्रकार',
  type: 'select',
  required: false,
  options: [
    'Case / Cover', 'Screen Protector', 'Charger & Cable', 'Power Bank', 'Earphones',
    'Speaker', 'Selfie Stick', 'Memory Card', 'Mount / Holder', 'Other',
  ],
  optionsNe: [
    'केस / कभर', 'स्क्रिन प्रोटेक्टर', 'चार्जर र केबल', 'पावर बैंक', 'इयरफोन',
    'स्पिकर', 'सेल्फी स्टिक', 'मेमोरी कार्ड', 'माउन्ट / होल्डर', 'अन्य',
  ],
  appliesTo: 'all',};

export const accessoryTypeTvField: SelectField = {
  name: 'accessoryType',
  label: 'Accessory Type',
  labelNe: 'सहायक सामग्री प्रकार',
  type: 'select',
  required: false,
  options: [
    'Set-Top Box', 'Streaming Device', 'Soundbar', 'Wall Mount', 'Remote',
    'Projector', 'DVD Player', 'Cables', 'Other',
  ],
  optionsNe: [
    'सेट-टप बक्स', 'स्ट्रिमिङ डिभाइस', 'साउन्डबार', 'वाल माउन्ट', 'रिमोट',
    'प्रोजेक्टर', 'डिभिडी प्लेयर', 'केबल', 'अन्य',
  ],
  appliesTo: 'all',};

export const accessoryTypeComputerField: SelectField = {
  name: 'accessoryType',
  label: 'Accessory Type',
  labelNe: 'सहायक सामग्री प्रकार',
  type: 'select',
  required: false,
  options: [
    'Monitor', 'Keyboard & Mouse', 'Printer & Scanner', 'Storage Drive', 'RAM & Components',
    'Graphics Card', 'Router', 'UPS', 'Laptop Bag', 'Cooling Pad', 'Webcam', 'Other',
  ],
  optionsNe: [
    'मोनिटर', 'किबोर्ड र माउस', 'प्रिन्टर र स्क्यानर', 'स्टोरेज ड्राइभ', 'र्‍याम र पार्ट्स',
    'ग्राफिक्स कार्ड', 'राउटर', 'यूपीएस', 'ल्यापटप ब्याग', 'कुलिङ प्याड', 'वेबक्याम', 'अन्य',
  ],
  appliesTo: 'all',};

export const audioTypeField: SelectField = {
  name: 'audioType',
  label: 'Audio Type',
  labelNe: 'अडियो प्रकार',
  type: 'select',
  required: false,
  options: [
    'Headphones', 'Earbuds (TWS)', 'Bluetooth Speaker', 'Home Theatre', 'Soundbar',
    'Amplifier', 'DJ / PA System', 'Microphone', 'Studio Monitor', 'Other',
  ],
  optionsNe: [
    'हेडफोन', 'इयरबड्स (टीडब्ल्युएस)', 'ब्लुटुथ स्पिकर', 'होम थिएटर', 'साउन्डबार',
    'एम्प्लिफायर', 'डिजे / पीए सिस्टम', 'माइक्रोफोन', 'स्टुडियो मोनिटर', 'अन्य',
  ],
  appliesTo: 'all',};

export const gamingItemTypeField: SelectField = {
  name: 'gamingItemType',
  label: 'Item Type',
  labelNe: 'सामान प्रकार',
  type: 'select',
  required: false,
  options: ['Console', 'Game', 'Controller', 'VR Headset', 'Accessory', 'Other'],
  optionsNe: ['कन्सोल', 'गेम', 'कन्ट्रोलर', 'भीआर हेडसेट', 'सहायक सामग्री', 'अन्य'],
  appliesTo: 'all',};

export const wearableTypeField: SelectField = {
  name: 'wearableType',
  label: 'Wearable Type',
  labelNe: 'वियरेबल प्रकार',
  type: 'select',
  required: false,
  options: ['Smartwatch', 'Fitness Band', 'Smart Ring', 'Kids GPS Watch', 'Wearable Earbuds', 'Other'],
  optionsNe: ['स्मार्टवाच', 'फिटनेस ब्यान्ड', 'स्मार्ट रिङ', 'बच्चाको जीपीएस घडी', 'वियरेबल इयरबड्स', 'अन्य'],
  appliesTo: 'all',};

export const compatibilityField: SelectField = {
  name: 'compatibility',
  label: 'Compatibility',
  labelNe: 'अनुकूलता',
  type: 'select',
  required: false,
  options: ['Android', 'iOS', 'Both'],
  optionsNe: ['एन्ड्रोइड', 'आईओएस', 'दुवै'],
  appliesTo: 'all',};

export const connectivityField: SelectField = {
  name: 'connectivity',
  label: 'Connectivity',
  labelNe: 'कनेक्टिभिटी',
  type: 'select',
  required: false,
  options: ['WiFi only', 'WiFi + Cellular'],
  optionsNe: ['वाइफाइ मात्र', 'वाइफाइ + सेलुलर'],
  appliesTo: 'all',};

export const monitorIncludedField: SelectField = {
  name: 'monitorIncluded',
  label: 'Monitor Included',
  labelNe: 'मोनिटर सहित',
  type: 'select',
  required: false,
  options: ['Yes - Full Setup', 'No - CPU Only'],
  optionsNe: ['छ - पूरा सेटअप', 'छैन - सीपीयू मात्र'],
  appliesTo: 'all',};

// "box bill cha?" is the first question on any used-phone deal in Nepal.
export const boxAndBillField: SelectField = {
  name: 'boxAndBill',
  label: 'Box & Bill',
  labelNe: 'बक्स र बिल',
  type: 'select',
  required: false,
  options: ['Both', 'Box Only', 'Bill Only', 'Neither'],
  optionsNe: ['दुवै', 'बक्स मात्र', 'बिल मात्र', 'दुवै छैन'],
  appliesTo: 'all',};

export const applianceTypeAcField: SelectField = {
  name: 'applianceType',
  label: 'Appliance Type',
  labelNe: 'उपकरण प्रकार',
  type: 'select',
  required: false,
  options: [
    'Split AC', 'Window AC', 'Portable AC', 'Cassette / Ducted AC', 'Air Cooler',
    'Air Purifier', 'Geyser', 'Heater', 'Fan', 'Other',
  ],
  optionsNe: [
    'स्प्लिट एसी', 'विन्डो एसी', 'पोर्टेबल एसी', 'क्यासेट / डक्टेड एसी', 'एयर कुलर',
    'एयर प्युरिफायर', 'गिजर', 'हिटर', 'पंखा', 'अन्य',
  ],
  appliesTo: 'all',};

export const applianceTypeHomeField: SelectField = {
  name: 'applianceType',
  label: 'Appliance Type',
  labelNe: 'उपकरण प्रकार',
  type: 'select',
  required: false,
  options: [
    'Refrigerator', 'Washing Machine', 'Microwave', 'Rice Cooker', 'Induction',
    'Gas Stove', 'Water Purifier', 'Geyser', 'Blender / Mixer', 'Vacuum Cleaner',
    'Iron', 'Fan', 'Heater', 'Other',
  ],
  optionsNe: [
    'फ्रिज', 'वासिङ मेसिन', 'माइक्रोवेभ', 'राइस कुकर', 'इन्डक्सन',
    'ग्यास चुल्हो', 'वाटर प्युरिफायर', 'गिजर', 'ब्लेन्डर / मिक्सर', 'भ्याकुम क्लिनर',
    'इस्त्री', 'पंखा', 'हिटर', 'अन्य',
  ],
  appliesTo: 'all',};

export const capacityTonField: SelectField = {
  name: 'capacity',
  label: 'Capacity (Ton)',
  labelNe: 'क्षमता (टन)',
  type: 'select',
  required: false,
  options: ['0.75', '1', '1.5', '2', '2.5', '3+', 'N/A'],
  optionsNe: ['०.७५', '१', '१.५', '२', '२.५', '३+', 'लागू हुँदैन'],
  appliesTo: 'all',};

export const machineTypeField: SelectField = {
  name: 'machineType',
  label: 'Machine Type',
  labelNe: 'मेसिन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Inkjet Printer', 'Laser Printer', 'All-in-One', 'Photocopier', 'Scanner', 'Plotter', 'Other',
  ],
  optionsNe: [
    'इंकजेट प्रिन्टर', 'लेजर प्रिन्टर', 'अल-इन-वन', 'फोटोकपियर', 'स्क्यानर', 'प्लटर', 'अन्य',
  ],
  appliesTo: 'all',};

// ---- Mobiles > SIM Cards ----

export const networkOperatorField: SelectField = {
  name: 'networkOperator',
  label: 'Network Operator',
  labelNe: 'नेटवर्क',
  type: 'select',
  required: false,
  options: ['NTC', 'Ncell', 'Smart Cell', 'Hello Nepal', 'Other'],
  optionsNe: ['एनटीसी', 'एनसेल', 'स्मार्ट सेल', 'हेलो नेपाल', 'अन्य'],
  appliesTo: 'all',};

export const numberTypeField: SelectField = {
  name: 'numberType',
  label: 'Number Type',
  labelNe: 'नम्बर प्रकार',
  type: 'select',
  required: false,
  options: ['Normal', 'VIP / Golden Number'],
  optionsNe: ['साधारण', 'भीआईपी / गोल्डेन नम्बर'],
  appliesTo: 'all',};

export const simTypeField: SelectField = {
  name: 'simType',
  label: 'SIM Type',
  labelNe: 'सिम प्रकार',
  type: 'select',
  required: false,
  options: ['Prepaid', 'Postpaid', 'Data Only'],
  optionsNe: ['प्रिपेड', 'पोस्टपेड', 'डाटा मात्र'],
  appliesTo: 'all',};

// ---- Brand selects (free text produced "samsung"/"SAMSUNG"/"Samsang") ----

export const brandPhoneField: SelectField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'select',
  required: false,
  options: ['Apple', 'Samsung', 'Xiaomi / Redmi', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Tecno', 'Infinix', 'Nokia', 'Honor', 'Other'],
  appliesTo: 'all',};

export const brandLaptopField: SelectField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'select',
  required: false,
  options: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Microsoft', 'Other'],
  appliesTo: 'all',};

export const brandTvField: SelectField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'select',
  required: false,
  options: ['Samsung', 'LG', 'Sony', 'TCL', 'CG', 'Yasuda', 'Himstar', 'Colors', 'Hisense', 'Videocon', 'Other'],
  appliesTo: 'all',};

export const brandAcField: SelectField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'select',
  required: false,
  options: ['CG', 'Yasuda', 'Himstar', 'Gree', 'Midea', 'Hisense', 'LG', 'Samsung', 'Voltas', 'Daikin', 'Panasonic', 'Other'],
  appliesTo: 'all',};

export const brandHomeApplianceField: SelectField = {
  name: 'brand',
  label: 'Brand',
  labelNe: 'ब्रान्ड',
  type: 'select',
  required: false,
  options: ['CG', 'Baltra', 'Yasuda', 'Himstar', 'LG', 'Samsung', 'Whirlpool', 'Philips', 'Panasonic', 'Other'],
  appliesTo: 'all',};
