/**
 * General Fields - Home & Living, Hobbies, Business & Industry, Essentials, Agriculture
 *
 * `productType`, `material` and `priceUnit` are single keys with a per-subcategory
 * option list. Every variant is exported under the same `name` so fieldLookup
 * merges their option maps.
 */

import type { TextField, NumberField, SelectField, DateField } from '../types';

// ============================================
// HOME & LIVING - Furniture
// ============================================

export const furnitureTypeBedroomField: SelectField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: false,
  options: ['Bed', 'Bed + Mattress Set', 'Mattress only', 'Wardrobe', 'Dressing Table', 'Bunk Bed', 'Dresser', 'Nightstand', 'Other'],
  optionsNe: ['पलङ', 'पलङ + ग्द्दा सेट', 'ग्द्दा मात्र', 'दराज', 'ड्रेसिङ टेबल', 'बंक बेड', 'ड्रेसर', 'साइड टेबल', 'अन्य'],
  appliesTo: 'all',};

export const furnitureTypeLivingField: SelectField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: false,
  options: ['Sofa', 'Sofa Set', 'Center Table', 'TV Stand', 'Shoe Rack', 'Cabinet', 'Divan', 'Shelf', 'Recliner', 'Other'],
  optionsNe: ['सोफा', 'सोफा सेट', 'सेन्टर टेबल', 'टिभी स्ट्यान्ड', 'जुत्ता र्‍याक', 'क्याबिनेट', 'दिवान', 'शेल्फ', 'रिक्लाइनर', 'अन्य'],
  appliesTo: 'all',};

export const furnitureTypeKitchenField: SelectField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: false,
  options: ['Dining Table', 'Dining Set', 'Dining Chair', 'Kitchen Cabinet', 'Crockery Unit', 'Rack', 'Bar Stool', 'Other'],
  optionsNe: ['डाइनिङ टेबल', 'डाइनिङ सेट', 'डाइनिङ कुर्सी', 'किचन क्याबिनेट', 'क्रोकरी युनिट', 'र्‍याक', 'बार स्टुल', 'अन्य'],
  appliesTo: 'all',};

export const furnitureTypeOfficeField: SelectField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: false,
  options: [
    'Desk', 'Workstation', 'Office Chair', 'Filing Cabinet', 'Bookshelf', 'Conference Table',
    'Reception Desk', 'Display Rack', 'Shop Counter', 'Cash Counter', 'Safe / Locker', 'Other',
  ],
  optionsNe: [
    'डेस्क', 'वर्कस्टेशन', 'अफिस कुर्सी', 'फाइलिङ क्याबिनेट', 'बुकसेल्फ', 'कन्फरेन्स टेबल',
    'रिसेप्सन डेस्क', 'डिस्प्ले र्‍याक', 'पसल काउन्टर', 'क्यास काउन्टर', 'सेफ / लकर', 'अन्य',
  ],
  appliesTo: 'all',};

export const furnitureTypeChildrenField: SelectField = {
  name: 'furnitureType',
  label: 'Furniture Type',
  labelNe: 'फर्निचर प्रकार',
  type: 'select',
  required: false,
  options: ['Crib', 'Kids Bed', 'Bunk Bed', 'Study Table', 'Study Chair', 'Play Pen', 'Toy Storage', 'High Chair', 'Other'],
  optionsNe: ['क्रिब', 'बच्चाको पलङ', 'बंक बेड', 'स्टडी टेबल', 'स्टडी कुर्सी', 'प्ले पेन', 'खेलौना भण्डार', 'हाई चेयर', 'अन्य'],
  appliesTo: 'all',};

export const materialFurnitureField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Wood (Sal)', 'Wood (Teak)', 'Wood (Sisau)', 'Plywood', 'MDF', 'Metal', 'Plastic', 'Glass', 'Cane / Bamboo', 'Rexine', 'Mixed'],
  optionsNe: ['काठ (साल)', 'काठ (टिक)', 'काठ (सिसौ)', 'प्लाइउड', 'एमडीएफ', 'धातु', 'प्लास्टिक', 'सिसा', 'बेत / बाँस', 'रेक्सिन', 'मिश्रित'],
  appliesTo: 'all',};

export const materialTextileField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Cotton', 'Silk', 'Wool', 'Polyester', 'Jute', 'Velvet', 'Synthetic', 'Mixed'],
  optionsNe: ['सुती', 'सिल्क', 'ऊन', 'पोलिस्टर', 'जुट', 'भेलभेट', 'सिन्थेटिक', 'मिश्रित'],
  appliesTo: 'all',};

export const materialBathroomField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Ceramic', 'Steel', 'Brass', 'PVC', 'Glass', 'Marble', 'Other'],
  optionsNe: ['सेरामिक', 'स्टिल', 'पित्तल', 'पीभीसी', 'सिसा', 'मार्बल', 'अन्य'],
  appliesTo: 'all',};

export const materialHouseholdField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Steel', 'Aluminium', 'Plastic', 'Glass', 'Ceramic', 'Copper / Brass', 'Non-stick', 'Wood', 'Mixed'],
  optionsNe: ['स्टिल', 'एल्युमिनियम', 'प्लास्टिक', 'सिसा', 'सेरामिक', 'तामा / पित्तल', 'नन-स्टिक', 'काठ', 'मिश्रित'],
  appliesTo: 'all',};

export const materialDoorField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Wood', 'Plywood / Flush', 'MDF', 'Steel', 'Aluminium', 'uPVC', 'Glass', 'Fiber'],
  optionsNe: ['काठ', 'प्लाइउड / फ्लस', 'एमडीएफ', 'स्टिल', 'एल्युमिनियम', 'यूपीभीसी', 'सिसा', 'फाइबर'],
  appliesTo: 'all',};

export const dimensionsField: TextField = {
  name: 'dimensions',
  label: 'Dimensions (L × W × H)',
  labelNe: 'आयाम (ल × चौ × उ)',
  type: 'text',
  required: false,
  placeholder: 'e.g., 6ft × 5ft × 2ft',
  placeholderNe: 'जस्तै, ६ फिट × ५ फिट × २ फिट',
  appliesTo: 'all',};

export const doorSizeField: TextField = {
  name: 'dimensions',
  label: 'Size (H × W)',
  labelNe: 'साइज (उ × चौ)',
  type: 'text',
  required: false,
  placeholder: 'e.g., 7ft × 3ft',
  placeholderNe: 'जस्तै, ७ फिट × ३ फिट',
  appliesTo: 'all',};

export const seatingCapacityField: SelectField = {
  name: 'seatingCapacity',
  label: 'Seater',
  labelNe: 'सिटर',
  type: 'select',
  required: false,
  options: ['1 Seater', '2 Seater', '3 Seater', '5 Seater', '7+ Seater'],
  optionsNe: ['१ सिटर', '२ सिटर', '३ सिटर', '५ सिटर', '७+ सिटर'],
  appliesTo: 'all',};

export const seatingCapacityDiningField: SelectField = {
  name: 'seatingCapacity',
  label: 'Seater',
  labelNe: 'सिटर',
  type: 'select',
  required: false,
  options: ['2 Seater', '4 Seater', '6 Seater', '8+ Seater'],
  optionsNe: ['२ सिटर', '४ सिटर', '६ सिटर', '८+ सिटर'],
  appliesTo: 'all',};

export const productTypeTextilesField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Bedsheet', 'Curtain', 'Blanket', 'Cushion', 'Carpet / Rug', 'Doormat',
    'Towel', 'Table Cover', 'Wall Decor', 'Artificial Plants', 'Other',
  ],
  optionsNe: [
    'तन्ना', 'पर्दा', 'सिरक', 'कुसन', 'कार्पेट / गलैंचा', 'डोरम्याट',
    'तौलिया', 'टेबल कभर', 'भित्ते सजावट', 'नक्कली बिरुवा', 'अन्य',
  ],
  appliesTo: 'all',};

export const productTypeBathroomField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: ['Sanitary Ware', 'Taps & Fittings', 'Shower', 'Geyser', 'Cabinet / Mirror', 'Bathtub', 'Accessories', 'Other'],
  optionsNe: ['स्यानिटरी वेयर', 'धारा र फिटिङ', 'सावर', 'गिजर', 'क्याबिनेट / ऐना', 'बाथटब', 'सहायक सामग्री', 'अन्य'],
  appliesTo: 'all',};

// Home & Living > Household Items is DURABLES; Essentials > Household is consumables.
export const productTypeHouseholdDurablesField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: ['Cookware', 'Crockery', 'Storage', 'Water Tank', 'Cleaning Tools', 'Lighting', 'Plastic Ware', 'Other'],
  optionsNe: ['भाँडाकुँडा', 'क्रोकरी', 'भण्डारण', 'पानी ट्याङ्की', 'सफाइ सामग्री', 'बत्ती', 'प्लास्टिक सामान', 'अन्य'],
  appliesTo: 'all',};

export const productTypeDoorsField: SelectField = {
  name: 'productType',
  label: 'Door Type',
  labelNe: 'ढोका प्रकार',
  type: 'select',
  required: false,
  options: [
    'Main Door', 'Room Door', 'Bathroom Door', 'Sliding Door', 'Flush Door',
    'Panel / Carved', 'Safety Grill', 'Window', 'Frame (Chaukath)', 'Other',
  ],
  optionsNe: [
    'मुख्य ढोका', 'कोठाको ढोका', 'बाथरुम ढोका', 'स्लाइडिङ ढोका', 'फ्लस ढोका',
    'प्यानल / कुँदिएको', 'सेफ्टी ग्रिल', 'झ्याल', 'चौकाठ', 'अन्य',
  ],
  appliesTo: 'all',};

// ============================================
// HOBBIES, SPORTS & KIDS
// ============================================

export const sportTypeField: SelectField = {
  name: 'sportType',
  label: 'Sport Type',
  labelNe: 'खेल प्रकार',
  type: 'select',
  required: false,
  options: [
    'Cricket', 'Football', 'Futsal', 'Badminton', 'Basketball', 'Volleyball',
    'Table Tennis', 'Cycling', 'Swimming', 'Trekking', 'Martial Arts', 'Other',
  ],
  optionsNe: [
    'क्रिकेट', 'फुटबल', 'फुटसल', 'ब्याडमिन्टन', 'बास्केटबल', 'भलिबल',
    'टेबल टेनिस', 'साइक्लिङ', 'पौडी', 'ट्रेकिङ', 'मार्सल आर्ट', 'अन्य',
  ],
  appliesTo: 'all',};

// Treadmills were being stored under "Sport Type".
export const equipmentTypeField: SelectField = {
  name: 'equipmentType',
  label: 'Equipment Type',
  labelNe: 'उपकरण प्रकार',
  type: 'select',
  required: false,
  options: [
    'Treadmill', 'Exercise Bike', 'Elliptical', 'Dumbbells', 'Home Gym',
    'Bench', 'Yoga / Mats', 'Supplements', 'Other',
  ],
  optionsNe: [
    'ट्रेडमिल', 'एक्सरसाइज बाइक', 'एलिप्टिकल', 'डम्बेल', 'होम जिम',
    'बेन्च', 'योग / म्याट', 'सप्लिमेन्ट', 'अन्य',
  ],
  appliesTo: 'all',};

export const instrumentTypeField: SelectField = {
  name: 'instrumentType',
  label: 'Instrument Type',
  labelNe: 'वाद्य प्रकार',
  type: 'select',
  required: false,
  options: [
    'Guitar', 'Keyboard / Piano', 'Drums', 'Madal', 'Tabla', 'Sarangi',
    'Harmonium', 'Bansuri', 'Violin', 'Flute', 'DJ / Studio Gear', 'Other',
  ],
  optionsNe: [
    'गिटार', 'किबोर्ड / पियानो', 'ड्रम', 'मादल', 'तबला', 'सारंगी',
    'हार्मोनियम', 'बाँसुरी', 'भायोलिन', 'मुरली', 'डिजे / स्टुडियो', 'अन्य',
  ],
  appliesTo: 'all',};

export const itemTypeKidsField: SelectField = {
  name: 'itemType',
  label: 'Item Type',
  labelNe: 'सामान प्रकार',
  type: 'select',
  required: false,
  options: [
    'Toys', 'Stroller', 'Car Seat', 'Carrier', 'Crib', 'High Chair',
    'Walker', 'School Bag', 'Ride-on', 'Books', 'Other',
  ],
  optionsNe: [
    'खेलौना', 'स्ट्रोलर', 'कार सिट', 'क्यारियर', 'क्रिब', 'हाई चेयर',
    'वाकर', 'स्कुल ब्याग', 'राइड-अन', 'पुस्तक', 'अन्य',
  ],
  appliesTo: 'all',};

export const ageGroupField: SelectField = {
  name: 'ageGroup',
  label: 'Age Group',
  labelNe: 'उमेर समूह',
  type: 'select',
  required: false,
  options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-4 years', '4-6 years', '6-10 years'],
  optionsNe: ['०-३ महिना', '३-६ महिना', '६-१२ महिना', '१-२ वर्ष', '२-४ वर्ष', '४-६ वर्ष', '६-१० वर्ष'],
  appliesTo: 'all',};

export const mediaTypeField: SelectField = {
  name: 'mediaType',
  label: 'Media Type',
  labelNe: 'मिडिया प्रकार',
  type: 'select',
  required: false,
  options: ['Book', 'Textbook', 'Magazine', 'Comics', 'Music CD / Vinyl', 'Movie DVD', 'Other'],
  optionsNe: ['पुस्तक', 'पाठ्यपुस्तक', 'पत्रिका', 'कमिक्स', 'म्युजिक सीडी / भाइनल', 'मुभी डीभिडी', 'अन्य'],
  appliesTo: 'all',};

// "Brand: Vidyarthi Pustak Bhandar" is not a brand.
export const authorPublisherField: TextField = {
  name: 'authorPublisher',
  label: 'Author / Publisher',
  labelNe: 'लेखक / प्रकाशक',
  type: 'text',
  required: false,
  placeholder: 'e.g., Laxmi Prasad Devkota, Sajha Prakashan',
  placeholderNe: 'जस्तै, लक्ष्मीप्रसाद देवकोटा, साझा प्रकाशन',
  appliesTo: 'all',};

export const mediaLanguageField: SelectField = {
  name: 'language',
  label: 'Language',
  labelNe: 'भाषा',
  type: 'select',
  required: false,
  options: ['Nepali', 'English', 'Hindi', 'Other'],
  optionsNe: ['नेपाली', 'अंग्रेजी', 'हिन्दी', 'अन्य'],
  appliesTo: 'all',};

// ============================================
// BUSINESS & INDUSTRY
// ============================================

// The old list offered "Office Equipment" and "Medical Equipment" — its own
// sibling subcategories.
export const machineryTypeField: SelectField = {
  name: 'machineryType',
  label: 'Machinery Type',
  labelNe: 'मेसिनरी प्रकार',
  type: 'select',
  required: false,
  options: [
    'Construction', 'Manufacturing', 'Food Processing', 'Woodworking', 'Metalworking & Welding',
    'Printing', 'Generator', 'Power Tools', 'Water Pump', 'Other',
  ],
  optionsNe: [
    'निर्माण', 'उत्पादन', 'खाद्य प्रशोधन', 'काठ काम', 'धातु काम र वेल्डिङ',
    'प्रिन्टिङ', 'जेनेरेटर', 'पावर टुल्स', 'पानी पम्प', 'अन्य',
  ],
  appliesTo: 'all',};

export const equipmentTypeMedicalField: SelectField = {
  name: 'machineryType',
  label: 'Equipment Type',
  labelNe: 'उपकरण प्रकार',
  type: 'select',
  required: false,
  options: [
    'Diagnostic', 'Surgical', 'Monitoring', 'Laboratory', 'Therapy',
    'Mobility & Rehab', 'Hospital Furniture', 'Dental', 'Oxygen & Respiratory', 'Consumables',
  ],
  optionsNe: [
    'निदान', 'शल्यक्रिया', 'मोनिटरिङ', 'प्रयोगशाला', 'थेरापी',
    'मोबिलिटी र रिह्याब', 'अस्पताल फर्निचर', 'दन्त', 'अक्सिजन र श्वासप्रश्वास', 'उपभोग्य सामग्री',
  ],
  appliesTo: 'all',};

export const powerSourceField: SelectField = {
  name: 'powerSource',
  label: 'Power Source',
  labelNe: 'शक्ति स्रोत',
  type: 'select',
  required: false,
  options: ['Electric', 'Electric (3 Phase)', 'Manual', 'Diesel', 'Petrol', 'Battery', 'Solar'],
  optionsNe: ['इलेक्ट्रिक', 'इलेक्ट्रिक (३ फेज)', 'म्यानुअल', 'डिजेल', 'पेट्रोल', 'ब्याट्री', 'सोलार'],
  appliesTo: 'all',};

export const productTypeOfficeSuppliesField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Paper & Notebooks', 'Pens & Writing', 'Files & Folders', 'Printer Consumables',
    'Office Machines', 'Whiteboard', 'Desk Accessories', 'School Supplies', 'Other',
  ],
  optionsNe: [
    'कागज र कापी', 'कलम र लेखन', 'फाइल र फोल्डर', 'प्रिन्टर सामग्री',
    'कार्यालय मेसिन', 'ह्वाइटबोर्ड', 'डेस्क सामग्री', 'विद्यालय सामग्री', 'अन्य',
  ],
  appliesTo: 'all',};

export const productTypeRawMaterialsField: SelectField = {
  name: 'productType',
  label: 'Material Type',
  labelNe: 'सामग्री प्रकार',
  type: 'select',
  required: false,
  options: [
    'Metal & Steel', 'Cement & Aggregates', 'Timber', 'Plastic', 'Chemicals',
    'Textile & Yarn', 'Paper', 'Rubber', 'Glass', 'Electrical', 'Other',
  ],
  optionsNe: [
    'धातु र फलाम', 'सिमेन्ट र गिट्टी बालुवा', 'काठ', 'प्लास्टिक', 'रसायन',
    'कपडा र धागो', 'कागज', 'रबर', 'सिसा', 'इलेक्ट्रिकल', 'अन्य',
  ],
  appliesTo: 'all',};

export const productTypeSafetyField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: ['CCTV', 'Alarms', 'Fire Safety', 'Safety Gear', 'Locks & Safes', 'Access Control', 'Security Doors', 'Other'],
  optionsNe: ['सीसीटीभी', 'अलार्म', 'अग्नि सुरक्षा', 'सुरक्षा पोशाक', 'ताल्चा र सेफ', 'एक्सेस कन्ट्रोल', 'सुरक्षा ढोका', 'अन्य'],
  appliesTo: 'all',};

export const productTypeLicencesField: SelectField = {
  name: 'productType',
  label: 'Listing Type',
  labelNe: 'सूची प्रकार',
  type: 'select',
  required: false,
  options: [
    'Business Licence', 'Permit / Quota', 'Tender Notice', 'Company Registration',
    'Franchise', 'Trademark', 'Other',
  ],
  optionsNe: [
    'व्यवसाय इजाजतपत्र', 'अनुमति / कोटा', 'टेन्डर सूचना', 'कम्पनी दर्ता',
    'फ्रान्चाइज', 'ट्रेडमार्क', 'अन्य',
  ],
  appliesTo: 'all',};

export const minOrderQuantityField: NumberField = {
  name: 'minOrderQuantity',
  label: 'Minimum Order Quantity',
  labelNe: 'न्यूनतम अर्डर मात्रा',
  type: 'number',
  required: false,
  placeholder: 'e.g., 50',
  placeholderNe: 'जस्तै, ५०',
  appliesTo: 'all',};

export const quantityField: NumberField = {
  name: 'quantity',
  label: 'Quantity Available',
  labelNe: 'उपलब्ध मात्रा',
  type: 'number',
  required: false,
  placeholder: 'Enter quantity',
  placeholderNe: 'मात्रा लेख्नुहोस्',
  appliesTo: 'all',};

// ============================================
// ESSENTIALS
// ============================================

export const priceUnitField: SelectField = {
  name: 'priceUnit',
  label: 'Price Unit',
  labelNe: 'मूल्य एकाइ',
  type: 'select',
  required: false,
  options: ['per Kg', 'per Piece', 'per Packet', 'per Bag', 'per Ton', 'per Metre', 'per Sq ft'],
  optionsNe: ['प्रति केजी', 'प्रति गोटा', 'प्रति प्याकेट', 'प्रति बोरा', 'प्रति टन', 'प्रति मिटर', 'प्रति वर्ग फिट'],
  appliesTo: 'all',};

export const priceUnitGroceryField: SelectField = {
  name: 'priceUnit',
  label: 'Price Unit',
  labelNe: 'मूल्य एकाइ',
  type: 'select',
  required: false,
  options: ['per Kg', 'per Gram', 'per Litre', 'per Piece', 'per Packet', 'per Dozen', 'per Sack (Bora)', 'per Carton'],
  optionsNe: ['प्रति केजी', 'प्रति ग्राम', 'प्रति लिटर', 'प्रति गोटा', 'प्रति प्याकेट', 'प्रति दर्जन', 'प्रति बोरा', 'प्रति कार्टुन'],
  appliesTo: 'all',};

export const priceUnitProduceField: SelectField = {
  name: 'priceUnit',
  label: 'Price Unit',
  labelNe: 'मूल्य एकाइ',
  type: 'select',
  required: false,
  options: ['per Kg', 'per Gram', 'per Dozen', 'per Piece', 'per Crate', 'per Sack (Bora)', 'per Muri'],
  optionsNe: ['प्रति केजी', 'प्रति ग्राम', 'प्रति दर्जन', 'प्रति गोटा', 'प्रति क्रेट', 'प्रति बोरा', 'प्रति मुरी'],
  appliesTo: 'all',};

export const priceUnitCropsField: SelectField = {
  name: 'priceUnit',
  label: 'Price Unit',
  labelNe: 'मूल्य एकाइ',
  type: 'select',
  required: false,
  options: ['per Kg', 'per Quintal', 'per Muri', 'per Pathi', 'per Packet', 'per Sapling', 'per Sack (Bora)'],
  optionsNe: ['प्रति केजी', 'प्रति क्विन्टल', 'प्रति मुरी', 'प्रति पाथी', 'प्रति प्याकेट', 'प्रति बिरुवा', 'प्रति बोरा'],
  appliesTo: 'all',};

export const productTypeGroceryField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: ['Rice & Flour', 'Pulses', 'Oil & Ghee', 'Spices', 'Dairy', 'Snacks', 'Beverage', 'Instant Food', 'Other'],
  optionsNe: ['चामल र पिठो', 'दाल', 'तेल र घिउ', 'मसला', 'दुग्ध पदार्थ', 'खाजा', 'पेय पदार्थ', 'तयारी खाना', 'अन्य'],
  appliesTo: 'all',};

export const productTypeHealthcareField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: ['Medicine', 'First Aid', 'Medical Device', 'Supplements', 'Mobility Aids', 'Ayurvedic / Herbal', 'Other'],
  optionsNe: ['औषधि', 'प्राथमिक उपचार', 'चिकित्सा उपकरण', 'सप्लिमेन्ट', 'हिँडडुल सहायक', 'आयुर्वेदिक / जडिबुटी', 'अन्य'],
  appliesTo: 'all',};

export const productTypeBabyField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Diapers', 'Baby Food', 'Baby Care', 'Feeding', 'Baby Clothes',
    'Stroller / Carrier', 'Cot / Crib', 'Bath', 'Toys', 'Other',
  ],
  optionsNe: [
    'डाइपर', 'बच्चाको खाना', 'बच्चाको हेरचाह', 'दूध खुवाउने सामान', 'बच्चाको लुगा',
    'स्ट्रोलर / क्यारियर', 'खाट / क्रिब', 'नुहाउने सामान', 'खेलौना', 'अन्य',
  ],
  appliesTo: 'all',};

// Essentials > Household is CONSUMABLES; Home & Living > Household Items is durables.
export const productTypeHouseholdConsumablesField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Cleaning', 'Laundry & Detergent', 'Toiletries', 'Pest Control',
    'Storage', 'Kitchen Consumables', 'Other',
  ],
  optionsNe: [
    'सफाइ', 'लुगा धुने सामग्री', 'नुहाउने सामान', 'किरा नियन्त्रण',
    'भण्डारण', 'भान्साको उपभोग्य सामान', 'अन्य',
  ],
  appliesTo: 'all',};

export const productTypeMeatField: SelectField = {
  name: 'productType',
  label: 'Meat Type',
  labelNe: 'मासु प्रकार',
  type: 'select',
  required: false,
  options: ['Chicken', 'Mutton (Khasi)', 'Buff', 'Pork', 'Fish', 'Prawn & Seafood', 'Eggs', 'Frozen / Processed', 'Other'],
  optionsNe: ['कुखुरा', 'खसीको मासु', 'भैंसीको मासु', 'सुँगुरको मासु', 'माछा', 'झिंगेमाछा र समुद्री', 'अन्डा', 'फ्रोजन / प्रशोधित', 'अन्य'],
  appliesTo: 'all',};

export const organicField: SelectField = {
  name: 'organic',
  label: 'Farming Method',
  labelNe: 'खेती विधि',
  type: 'select',
  required: false,
  options: ['Organic', 'Conventional'],
  optionsNe: ['जैविक', 'सामान्य'],
  appliesTo: 'all',};

export const expiryDateField: DateField = {
  name: 'expiryDate',
  label: 'Expiry Date',
  labelNe: 'म्याद सकिने मिति',
  type: 'date',
  required: false,
  appliesTo: 'all',};

export const productWeightField: TextField = {
  name: 'productWeight',
  label: 'Pack Size',
  labelNe: 'प्याक साइज',
  type: 'text',
  required: false,
  placeholder: 'e.g., 250ml, 100gm, 1kg',
  placeholderNe: 'जस्तै, २५०मिली, १००ग्राम, १ केजी',
  appliesTo: 'all',};

export const productVolumeField: TextField = {
  name: 'productWeight',
  label: 'Weight / Volume',
  labelNe: 'तौल / आयतन',
  type: 'text',
  required: false,
  placeholder: 'e.g., 250ml, 100gm, 50gm',
  placeholderNe: 'जस्तै, २५०मिली, १००ग्राम, ५०ग्राम',
  appliesTo: 'all',};

// ============================================
// AGRICULTURE
// ============================================

export const productTypeCropsField: SelectField = {
  name: 'productType',
  label: 'Item Type',
  labelNe: 'सामान प्रकार',
  type: 'select',
  required: false,
  options: [
    'Seeds', 'Saplings', 'Harvested Grain', 'Bulk Vegetables', 'Fruit Trees',
    'Flowers', 'Mushroom / Spawn', 'Other',
  ],
  optionsNe: [
    'बीउ', 'बिरुवा', 'उत्पादित अन्न', 'थोक तरकारी', 'फलफूलका बोट',
    'फूल', 'च्याउ / बीउ', 'अन्य',
  ],
  appliesTo: 'all',};

export const productTypeOtherAgricultureField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Fertilizer & Pesticide', 'Animal Feed', 'Veterinary', 'Irrigation',
    'Greenhouse & Nets', 'Farm Produce', 'Beekeeping', 'Other',
  ],
  optionsNe: [
    'मल र विषादी', 'दाना', 'पशु चिकित्सा', 'सिँचाइ',
    'हरितगृह र जाली', 'कृषि उपज', 'मौरीपालन', 'अन्य',
  ],
  appliesTo: 'all',};

export const cropTypeField: TextField = {
  name: 'cropType',
  label: 'Crop / Plant Name',
  labelNe: 'बाली / बिरुवाको नाम',
  type: 'text',
  required: false,
  placeholder: 'e.g., Rice, Wheat, Tomato',
  placeholderNe: 'जस्तै, धान, गहुँ, गोलभेडा',
  appliesTo: 'all',};

export const farmingToolTypeField: SelectField = {
  name: 'farmingToolType',
  label: 'Farming Tool Type',
  labelNe: 'कृषि औजार',
  type: 'select',
  required: false,
  options: [
    'Tractor', 'Power Tiller', 'Rotavator', 'Plough', 'Harvester', 'Thresher',
    'Chaff Cutter', 'Grass Cutter', 'Milking Machine', 'Water Pump',
    'Pipes & Irrigation', 'Sprayer', 'Hand Tool', 'Other',
  ],
  optionsNe: [
    'ट्र्याक्टर', 'पावर टिलर', 'रोटाभेटर', 'हलो', 'हार्भेस्टर', 'थ्रेसर',
    'कुटी काट्ने मेसिन', 'घाँस काट्ने मेसिन', 'दूध दुहुने मेसिन', 'पानी पम्प',
    'पाइप र सिँचाइ', 'स्प्रेयर', 'हात औजार', 'अन्य',
  ],
  appliesTo: 'all',};
