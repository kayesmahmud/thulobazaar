/**
 * Fashion & Apparel Fields
 *
 * `clothingType` is one key with a per-subcategory option list — a shirt seller
 * was being offered "Saree" and a saree seller "T-Shirt".
 */

import type { NumberField, SelectField } from '../types';

export const sizeField: SelectField = {
  name: 'size',
  label: 'Size',
  labelNe: 'साइज',
  type: 'select',
  required: false,
  options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  optionsNe: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'फ्री साइज'],
  appliesTo: 'all',};

// Men's trousers are bought by waist inches in Nepal, not by S/M/L.
export const waistSizeField: SelectField = {
  name: 'size',
  label: 'Waist Size (inches)',
  labelNe: 'कम्मर साइज (इन्च)',
  type: 'select',
  required: false,
  options: ['28', '30', '32', '34', '36', '38', '40', '42', '44', 'Free Size'],
  optionsNe: ['२८', '३०', '३२', '३४', '३६', '३८', '४०', '४२', '४४', 'फ्री साइज'],
  appliesTo: 'all',};

export const clothingTypeShirtsField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Shirt', 'T-Shirt', 'Polo', 'Tank Top'],
  optionsNe: ['सर्ट', 'टी-सर्ट', 'पोलो', 'ट्यांक टप'],
  appliesTo: 'all',};

export const clothingTypePantsField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Jeans', 'Chinos', 'Formal Pants', 'Track Pants', 'Shorts'],
  optionsNe: ['जिन्स', 'चिनोज', 'फर्मल प्यान्ट', 'ट्र्याक प्यान्ट', 'हाफ प्यान्ट'],
  appliesTo: 'all',};

export const clothingTypeJacketField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Jacket', 'Coat', 'Blazer', 'Hoodie', 'Windbreaker'],
  optionsNe: ['ज्याकेट', 'कोट', 'ब्लेजर', 'हुडी', 'विन्डब्रेकर'],
  appliesTo: 'all',};

export const clothingTypeMensTraditionalField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Daura Suruwal', 'Dhaka Topi', 'Topi', 'Dhoti', 'Kurta', 'Sherwani', 'Other'],
  optionsNe: ['दौरा सुरुवाल', 'ढाका टोपी', 'टोपी', 'धोती', 'कुर्ता', 'शेरवानी', 'अन्य'],
  appliesTo: 'all',};

export const clothingTypeWesternField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Dress', 'Top', 'Jeans', 'Skirt', 'Leggings', 'Jacket', 'Coat'],
  optionsNe: ['ड्रेस', 'टप', 'जिन्स', 'स्कर्ट', 'लेगिङ्स', 'ज्याकेट', 'कोट'],
  appliesTo: 'all',};

export const clothingTypeWomensTraditionalField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Saree', 'Kurta', 'Kurtha Suruwal', 'Lehenga', 'Gunyo Cholo', 'Sherwani', 'Dhoti', 'Topi', 'Other'],
  optionsNe: ['साडी', 'कुर्ता', 'कुर्था सुरुवाल', 'लेहेंगा', 'गुन्यु चोलो', 'शेरवानी', 'धोती', 'टोपी', 'अन्य'],
  appliesTo: 'all',};

export const clothingTypeWinterField: SelectField = {
  name: 'clothingType',
  label: 'Clothing Type',
  labelNe: 'लुगा प्रकार',
  type: 'select',
  required: false,
  options: ['Jacket', 'Coat', 'Sweater', 'Hoodie', 'Shawl / Pashmina', 'Thermal', 'Gloves', 'Cap', 'Muffler', 'Other'],
  optionsNe: ['ज्याकेट', 'कोट', 'स्वेटर', 'हुडी', 'शल / पस्मिना', 'थर्मल', 'पन्जा', 'टोपी', 'मफलर', 'अन्य'],
  appliesTo: 'all',};

export const fitTypeField: SelectField = {
  name: 'fitType',
  label: 'Fit Type',
  labelNe: 'फिट प्रकार',
  type: 'select',
  required: false,
  options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
  optionsNe: ['रेगुलर फिट', 'स्लिम फिट', 'लुज फिट', 'स्किनी फिट'],
  appliesTo: 'all',};

export const sleeveTypeField: SelectField = {
  name: 'sleeveType',
  label: 'Sleeve Type',
  labelNe: 'बाहुला प्रकार',
  type: 'select',
  required: false,
  options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
  optionsNe: ['पूरा बाहुला', 'आधा बाहुला', 'बाहुला बिना', '३/४ बाहुला'],
  appliesTo: 'all',};

// For a saree or a daura, the fabric IS the price.
export const fabricField: SelectField = {
  name: 'fabric',
  label: 'Fabric',
  labelNe: 'कपडा',
  type: 'select',
  required: false,
  options: ['Cotton', 'Silk', 'Dhaka', 'Wool / Pashmina', 'Linen', 'Synthetic', 'Mixed'],
  optionsNe: ['सुती', 'सिल्क', 'ढाका', 'ऊन / पस्मिना', 'लिनेन', 'सिन्थेटिक', 'मिश्रित'],
  appliesTo: 'all',};

export const fabricWomensField: SelectField = {
  name: 'fabric',
  label: 'Fabric',
  labelNe: 'कपडा',
  type: 'select',
  required: false,
  options: ['Cotton', 'Silk', 'Georgette', 'Chiffon', 'Banarasi', 'Dhaka', 'Wool / Pashmina', 'Synthetic', 'Mixed'],
  optionsNe: ['सुती', 'सिल्क', 'जर्जेट', 'सिफन', 'बनारसी', 'ढाका', 'ऊन / पस्मिना', 'सिन्थेटिक', 'मिश्रित'],
  appliesTo: 'all',};

export const footwearTypeField: SelectField = {
  name: 'footwearType',
  label: 'Footwear Type',
  labelNe: 'जुत्ता प्रकार',
  type: 'select',
  required: false,
  options: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Wedges', 'Pumps', 'Sports Shoes'],
  optionsNe: ['स्निकर्स', 'औपचारिक जुत्ता', 'सेन्डल', 'चप्पल', 'बुट', 'हिल', 'फ्ल्याट', 'वेजेज', 'पम्प्स', 'खेलकुद जुत्ता'],
  appliesTo: 'all',};

export const shoeSizeField: NumberField = {
  name: 'shoeSize',
  label: 'Shoe Size (EU)',
  labelNe: 'जुत्ता साइज (EU)',
  type: 'number',
  required: false,
  min: 30,
  max: 50,
  placeholder: 'e.g., 38, 40, 42',
  placeholderNe: 'जस्तै, ३८, ४०, ४२',
  appliesTo: 'all',};

export const watchTypeField: SelectField = {
  name: 'watchType',
  label: 'Watch Type',
  labelNe: 'घडी प्रकार',
  type: 'select',
  required: false,
  options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph', 'Automatic', 'Mechanical'],
  optionsNe: ['एनालग', 'डिजिटल', 'स्मार्ट वाच', 'क्रोनोग्राफ', 'अटोम्याटिक', 'मेकानिकल'],
  appliesTo: 'all',};

export const strapMaterialField: SelectField = {
  name: 'strapMaterial',
  label: 'Strap Material',
  labelNe: 'स्ट्र्याप सामग्री',
  type: 'select',
  required: false,
  options: ['Leather', 'Metal', 'Rubber', 'Silicone', 'Fabric'],
  optionsNe: ['छाला', 'धातु', 'रबर', 'सिलिकन', 'कपडा'],
  appliesTo: 'all',};

export const accessoryTypeBagsField: SelectField = {
  name: 'accessoryType',
  label: 'Accessory Type',
  labelNe: 'सहायक सामग्री प्रकार',
  type: 'select',
  required: false,
  options: ['Backpack', 'Handbag', 'Sling Bag', 'Wallet', 'Belt', 'Luggage', 'Laptop Bag', 'Cap', 'Scarf', 'Other'],
  optionsNe: ['ब्याकप्याक', 'ह्यान्डब्याग', 'स्लिङ ब्याग', 'वालेट', 'बेल्ट', 'लगेज', 'ल्यापटप ब्याग', 'क्याप', 'स्कार्फ', 'अन्य'],
  appliesTo: 'all',};

export const materialBagsField: SelectField = {
  name: 'material',
  label: 'Material',
  labelNe: 'सामग्री',
  type: 'select',
  required: false,
  options: ['Leather', 'PU Leather', 'Canvas', 'Nylon', 'Fabric', 'Other'],
  optionsNe: ['छाला', 'पीयू छाला', 'क्यानभास', 'नाइलन', 'कपडा', 'अन्य'],
  appliesTo: 'all',};

export const eyewearTypeField: SelectField = {
  name: 'eyewearType',
  label: 'Eyewear Type',
  labelNe: 'चस्मा प्रकार',
  type: 'select',
  required: false,
  options: ['Sunglasses', 'Frames', 'Prescription Glasses', 'Reading Glasses', 'Contact Lenses', 'Other'],
  optionsNe: ['सनग्लास', 'फ्रेम', 'पावर चस्मा', 'पढ्ने चस्मा', 'कन्ट्याक्ट लेन्स', 'अन्य'],
  appliesTo: 'all',};

// The metal is the entire basis of the price on a jewellery listing.
export const jewelleryMaterialField: SelectField = {
  name: 'jewelleryMaterial',
  label: 'Material',
  labelNe: 'धातु',
  type: 'select',
  required: false,
  options: ['Gold', 'Silver', 'Platinum', 'Diamond', 'Gemstone', 'Pearl', 'Imitation', 'Other'],
  optionsNe: ['सुन', 'चाँदी', 'प्लेटिनम', 'हीरा', 'रत्न', 'मोती', 'नक्कली', 'अन्य'],
  appliesTo: 'all',};
