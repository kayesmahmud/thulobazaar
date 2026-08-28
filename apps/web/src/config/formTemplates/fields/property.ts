/**
 * Property Fields
 *
 * `propertyType`, `roomType` and `landType` are three separate keys — the old
 * single `landType` key carried five incompatible option domains at once.
 * Several fields are exported more than once under the same `name` with a
 * different option list; the property template picks the right one per
 * subcategory via appliesTo, and fieldLookup merges their option maps.
 */

import type { TextField, NumberField, SelectField, MultiselectField } from '../types';

export const propertyTypeHousesField: SelectField = {
  name: 'propertyType',
  label: 'Property Type',
  labelNe: 'सम्पत्ति प्रकार',
  type: 'select',
  required: false,
  options: ['Bungalow', 'Duplex', 'Semi-detached', 'Row House', 'Villa', 'Traditional'],
  optionsNe: ['बंगला', 'डुप्लेक्स', 'सेमी-डिट्याच्ड', 'रो हाउस', 'भिल्ला', 'परम्परागत'],
  appliesTo: 'all',};

export const propertyTypeHouseRentalsField: SelectField = {
  name: 'propertyType',
  label: 'Property Type',
  labelNe: 'सम्पत्ति प्रकार',
  type: 'select',
  required: false,
  options: ['Full House', 'Flat in House', 'Half House', 'Ground Floor', 'Top Floor'],
  optionsNe: ['पूरा घर', 'घरभित्रको फ्ल्याट', 'आधा घर', 'भुइँ तल्ला', 'माथिल्लो तल्ला'],
  appliesTo: 'all',};

export const propertyTypeCommercialField: SelectField = {
  name: 'propertyType',
  label: 'Property Type',
  labelNe: 'सम्पत्ति प्रकार',
  type: 'select',
  required: false,
  options: ['Office Space', 'Shop', 'Showroom', 'Warehouse', 'Factory', 'Restaurant Space', 'Hotel', 'Commercial Complex'],
  optionsNe: ['अफिस स्पेस', 'पसल', 'सोरुम', 'गोदाम', 'कारखाना', 'रेस्टुरेन्ट स्पेस', 'होटल', 'व्यापारिक कम्प्लेक्स'],
  appliesTo: 'all',};

export const roomTypeField: SelectField = {
  name: 'roomType',
  label: 'Room Type',
  labelNe: 'कोठा प्रकार',
  type: 'select',
  required: false,
  options: ['Single Room', '1 Room + Kitchen', '2 Rooms + Kitchen', 'Shared Room', 'Master Bedroom', 'Hostel Bed', 'Flat'],
  optionsNe: ['एक कोठा', '१ कोठा + भान्सा', '२ कोठा + भान्सा', 'सेयर कोठा', 'मास्टर बेडरुम', 'होस्टेल बेड', 'फ्ल्याट'],
  appliesTo: 'all',};

export const landTypeField: SelectField = {
  name: 'landType',
  label: 'Land Type',
  labelNe: 'जग्गा प्रकार',
  type: 'select',
  required: false,
  options: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
  optionsNe: ['आवासीय', 'व्यापारिक', 'कृषि', 'औद्योगिक', 'मिश्रित'],
  appliesTo: 'all',};

export const totalAreaField: NumberField = {
  name: 'totalArea',
  label: 'Total Area',
  labelNe: 'कुल क्षेत्रफल',
  type: 'number',
  required: false,
  placeholder: 'Enter area',
  placeholderNe: 'क्षेत्रफल लेख्नुहोस्',
  appliesTo: 'all',};

// Terai land is sold in dhur/kattha/bigha — without them a Terai plot cannot be
// listed correctly at all.
export const areaUnitField: SelectField = {
  name: 'areaUnit',
  label: 'Area Unit',
  labelNe: 'क्षेत्रफल एकाइ',
  type: 'select',
  required: false,
  options: ['sq ft', 'aana', 'ropani', 'dhur', 'kattha', 'bigha', 'sq meter'],
  optionsNe: ['वर्ग फिट', 'आना', 'रोपनी', 'धुर', 'कट्ठा', 'बिघा', 'वर्ग मिटर'],
  appliesTo: 'all',};

export const builtUpAreaField: NumberField = {
  name: 'builtUpArea',
  label: 'Built-up Area (sq ft)',
  labelNe: 'बनेको क्षेत्रफल (वर्ग फिट)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 2400',
  placeholderNe: 'जस्तै, २४००',
  appliesTo: 'all',};

export const bedroomsField: SelectField = {
  name: 'bedrooms',
  label: 'Bedrooms',
  labelNe: 'शयनकोठा',
  type: 'select',
  required: false,
  options: ['Studio', '1', '2', '3', '4', '5', '6+'],
  optionsNe: ['स्टुडियो', '१', '२', '३', '४', '५', '६+'],
  appliesTo: 'all',};

export const bathroomsField: SelectField = {
  name: 'bathrooms',
  label: 'Bathrooms',
  labelNe: 'स्नानकोठा',
  type: 'select',
  required: false,
  options: ['1', '2', '3', '4', '5+'],
  optionsNe: ['१', '२', '३', '४', '५+'],
  appliesTo: 'all',};

export const floorNumberField: NumberField = {
  name: 'floorNumber',
  label: 'Floor Number',
  labelNe: 'तल्ला नम्बर',
  type: 'number',
  required: false,
  placeholder: 'e.g., 5',
  placeholderNe: 'जस्तै, ५',
  appliesTo: 'all',};

export const totalFloorsField: NumberField = {
  name: 'totalFloors',
  label: 'Total Floors in Building',
  labelNe: 'भवनको कुल तल्ला',
  type: 'number',
  required: false,
  placeholder: 'e.g., 12',
  placeholderNe: 'जस्तै, १२',
  appliesTo: 'all',};

export const furnishingField: SelectField = {
  name: 'furnishing',
  label: 'Furnishing',
  labelNe: 'फर्निचर',
  type: 'select',
  required: false,
  options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
  optionsNe: ['पूर्ण फर्निचर', 'आंशिक फर्निचर', 'फर्निचर बिना'],
  appliesTo: 'all',};

export const constructionTypeField: SelectField = {
  name: 'constructionType',
  label: 'Construction Type',
  labelNe: 'निर्माण प्रकार',
  type: 'select',
  required: false,
  options: ['RCC Pillar', 'Semi-Pillar', 'Load Bearing', 'Wooden'],
  optionsNe: ['आरसीसी पिलर', 'सेमी-पिलर', 'लोड बेयरिङ', 'काठको'],
  appliesTo: 'all',};

// Replaces the old `propertyAge` range picker. A new key, not a relabel: ads
// posted before this store '0-1 years', which cannot become a year — they keep
// rendering under the legacy label instead.
// Years are AD. The cap runs a few years ahead so an under-construction
// building can quote its expected completion year.
export const buildYearField: NumberField = {
  name: 'buildYear',
  label: 'Build Year',
  labelNe: 'निर्माण वर्ष',
  type: 'number',
  required: false,
  placeholder: 'e.g. 2019',
  placeholderNe: 'जस्तै २०१९',
  min: 1950,
  max: new Date().getFullYear() + 5,
  appliesTo: 'all',};

export const facingField: SelectField = {
  name: 'facing',
  label: 'Facing',
  labelNe: 'मुख दिशा',
  type: 'select',
  required: false,
  options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'],
  optionsNe: ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम', 'उत्तर-पूर्व', 'उत्तर-पश्चिम', 'दक्षिण-पूर्व', 'दक्षिण-पश्चिम'],
  appliesTo: 'all',};

export const roadAccessField: SelectField = {
  name: 'roadAccess',
  label: 'Road Type',
  labelNe: 'सडक प्रकार',
  type: 'select',
  required: false,
  options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
  optionsNe: ['पक्की सडक', 'ग्राभेल सडक', 'कच्ची सडक', 'प्रत्यक्ष पहुँच छैन'],
  appliesTo: 'all',};

// Replaces the free-number `roadWidth`. A new key, not a relabel: older ads
// store a raw number, which has no matching option — they keep rendering under
// the legacy label instead. Bands follow how Nepali listings quote road width.
export const roadSizeField: SelectField = {
  name: 'roadSize',
  label: 'Road Size',
  labelNe: 'सडक आकार',
  type: 'select',
  required: false,
  options: ['Under 8 feet', '8-13 feet', '13-16 feet', '16-20 feet', '20+ feet'],
  optionsNe: ['८ फिटभन्दा कम', '८-१३ फिट', '१३-१६ फिट', '१६-२० फिट', '२०+ फिट'],
  appliesTo: 'all',};

export const parkingField: SelectField = {
  name: 'parking',
  label: 'Parking',
  labelNe: 'पार्किङ',
  type: 'select',
  required: false,
  options: ['None', 'Bike', 'Car', 'Bike + Car', '2+ Cars'],
  optionsNe: ['छैन', 'बाइक', 'कार', 'बाइक + कार', '२+ कार'],
  appliesTo: 'all',};

export const parkingCommercialField: SelectField = {
  name: 'parking',
  label: 'Parking',
  labelNe: 'पार्किङ',
  type: 'select',
  required: false,
  options: ['None', 'Bike', 'Car', 'Bike + Car', '2+ Cars', 'Truck / Loading Bay'],
  optionsNe: ['छैन', 'बाइक', 'कार', 'बाइक + कार', '२+ कार', 'ट्रक / लोडिङ बे'],
  appliesTo: 'all',};

export const amenitiesApartmentField: MultiselectField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: [
    'Lift/Elevator', 'Power Backup', '24hr Water', 'Security/Gated', 'Balcony',
    'Modular Kitchen', 'Gym', 'Swimming Pool', 'Kids Play Area', 'Club House', 'Visitor Parking',
  ],
  optionsNe: [
    'लिफ्ट', 'पावर ब्याकअप', '२४ घण्टा पानी', 'सुरक्षा/गेटेड', 'बाल्कनी',
    'मोड्युलर किचन', 'जिम', 'स्विमिङ पुल', 'बालबालिका खेल्ने ठाउँ', 'क्लब हाउस', 'आगन्तुक पार्किङ',
  ],
  appliesTo: 'all',};

export const amenitiesHouseField: MultiselectField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: [
    'Boring/Well', 'Overhead Tank', 'Solar Heater', 'Inverter', 'Compound Wall',
    'Garden', 'Garage', 'CCTV', 'Modular Kitchen', 'Terrace',
  ],
  optionsNe: [
    'बोरिङ/इनार', 'ट्याङ्की', 'सोलार हिटर', 'इन्भर्टर', 'कम्पाउन्ड वाल',
    'बगैंचा', 'ग्यारेज', 'सीसीटीभी', 'मोड्युलर किचन', 'कौसी',
  ],
  appliesTo: 'all',};

export const amenitiesHouseRentalField: MultiselectField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: [
    'Separate Electricity Meter', '24hr Water', 'Overhead Tank', 'Solar Heater', 'Inverter',
    'Parking', 'Terrace', 'Garden', 'CCTV', 'Modular Kitchen',
  ],
  optionsNe: [
    'छुट्टै बिजुली मिटर', '२४ घण्टा पानी', 'ट्याङ्की', 'सोलार हिटर', 'इन्भर्टर',
    'पार्किङ', 'कौसी', 'बगैंचा', 'सीसीटीभी', 'मोड्युलर किचन',
  ],
  appliesTo: 'all',};

export const amenitiesCommercialField: MultiselectField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: [
    'Lift/Elevator', 'Power Backup', 'Water Supply', 'Parking', 'CCTV',
    'Air Conditioning', 'Attached Toilet', 'Loading Access', 'Separate Entrance', 'Fire Safety',
  ],
  optionsNe: [
    'लिफ्ट', 'पावर ब्याकअप', 'पानी आपूर्ति', 'पार्किङ', 'सीसीटीभी',
    'एयर कन्डिसन', 'एट्याच्ड शौचालय', 'लोडिङ पहुँच', 'छुट्टै प्रवेश', 'अग्नि सुरक्षा',
  ],
  appliesTo: 'all',};

export const amenitiesRoomField: MultiselectField = {
  name: 'amenities',
  label: 'Amenities',
  labelNe: 'सुविधाहरू',
  type: 'multiselect',
  required: false,
  options: [
    'Attached Bathroom', 'Shared Bathroom', 'Kitchen Access', '24hr Water', 'Hot Water',
    'WiFi', 'Separate Meter', 'Parking', 'Laundry', 'Terrace', 'Furnished Bed',
  ],
  optionsNe: [
    'एट्याच्ड बाथरुम', 'सेयर बाथरुम', 'भान्सा प्रयोग', '२४ घण्टा पानी', 'तातो पानी',
    'वाइफाइ', 'छुट्टै मिटर', 'पार्किङ', 'लुगा धुने', 'कौसी', 'बेड सहित',
  ],
  appliesTo: 'all',};

export const preferredTenantField: SelectField = {
  name: 'preferredTenant',
  label: 'Preferred Tenant',
  labelNe: 'रुचाइएको भाडावाल',
  type: 'select',
  required: false,
  options: ['Family', 'Bachelors', 'Students', 'Working Professionals', 'Girls Only', 'Boys Only', 'Anyone'],
  optionsNe: ['परिवार', 'ब्याचलर', 'विद्यार्थी', 'जागिरे', 'केटी मात्र', 'केटा मात्र', 'जोसुकै'],
  appliesTo: 'all',};

export const securityDepositField: SelectField = {
  name: 'securityDeposit',
  label: 'Security Deposit',
  labelNe: 'धरौटी',
  type: 'select',
  required: false,
  options: ['None', '1 month', '2 months', '3 months', 'Negotiable'],
  optionsNe: ['छैन', '१ महिना', '२ महिना', '३ महिना', 'मोलमोलाई योग्य'],
  appliesTo: 'all',};

export const securityDepositCommercialField: SelectField = {
  name: 'securityDeposit',
  label: 'Security Deposit',
  labelNe: 'धरौटी',
  type: 'select',
  required: false,
  options: ['None', '1 month', '2 months', '3 months', '6 months', 'Negotiable'],
  optionsNe: ['छैन', '१ महिना', '२ महिना', '३ महिना', '६ महिना', 'मोलमोलाई योग्य'],
  appliesTo: 'all',};

export const availableFromField: SelectField = {
  name: 'availableFrom',
  label: 'Available From',
  labelNe: 'उपलब्ध मिति',
  type: 'select',
  required: false,
  options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
  optionsNe: ['तुरुन्तै', '१५ दिन', '१ महिना', '२ महिना', '३ महिना'],
  appliesTo: 'all',};

export const googleMapsLinkField: TextField = {
  name: 'googleMapsLink',
  label: 'Google Maps',
  labelNe: 'गुगल म्यापको लिङ्क',
  type: 'text',
  required: false,
  placeholder: 'Paste Google Maps link',
  placeholderNe: 'गुगल म्यापको लिङ्क पेस्ट गर्नुहोस्',
  appliesTo: 'all',};
