/**
 * Pets & Animals Fields
 */

import type { TextField, NumberField, SelectField, MultiselectField } from '../types';

export const animalTypePetField: SelectField = {
  name: 'animalType',
  label: 'Animal Type',
  labelNe: 'पशु प्रकार',
  type: 'select',
  required: false,
  options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Turtle', 'Other'],
  optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'खरायो', 'ह्यामस्टर', 'गिनी पिग', 'कछुवा', 'अन्य'],
  appliesTo: 'all',};

export const animalTypeFarmField: SelectField = {
  name: 'animalType',
  label: 'Animal Type',
  labelNe: 'पशु प्रकार',
  type: 'select',
  required: false,
  options: ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Yak / Chauri', 'Horse', 'Chicken', 'Duck', 'Turkey', 'Pigeon', 'Rabbit', 'Other'],
  optionsNe: ['गाई', 'भैंसी', 'बाख्रा', 'भेडा', 'सुँगुर', 'याक / चौंरी', 'घोडा', 'कुखुरा', 'हाँस', 'टर्की', 'परेवा', 'खरायो', 'अन्य'],
  appliesTo: 'all',};

export const animalTypeField: SelectField = {
  name: 'animalType',
  label: 'Animal Type',
  labelNe: 'पशु प्रकार',
  type: 'select',
  required: false,
  options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Turtle', 'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other'],
  optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'खरायो', 'ह्यामस्टर', 'गिनी पिग', 'कछुवा', 'गाई', 'भैंसी', 'बाख्रा', 'कुखुरा', 'हाँस', 'अन्य'],
  appliesTo: 'all',};

export const breedField: TextField = {
  name: 'breed',
  label: 'Breed',
  labelNe: 'नस्ल',
  type: 'text',
  required: false,
  placeholder: 'e.g., Golden Retriever, Persian Cat',
  placeholderNe: 'जस्तै, गोल्डेन रिट्रिभर, पर्सियन बिरालो',
  appliesTo: 'all',};

export const petAgeField: SelectField = {
  name: 'age',
  label: 'Age',
  labelNe: 'उमेर',
  type: 'select',
  required: false,
  options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
  optionsNe: ['०-३ महिना', '३-६ महिना', '६-१२ महिना', '१-२ वर्ष', '२-५ वर्ष', '५+ वर्ष'],
  appliesTo: 'all',};

export const petGenderField: SelectField = {
  name: 'gender',
  label: 'Gender',
  labelNe: 'लिङ्ग',
  type: 'select',
  required: false,
  options: ['Male', 'Female', 'Unknown'],
  optionsNe: ['भाले', 'पोथी', 'थाहा छैन'],
  appliesTo: 'all',};

export const vaccinationField: SelectField = {
  name: 'vaccination',
  label: 'Vaccination Status',
  labelNe: 'खोप स्थिति',
  type: 'select',
  required: false,
  options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
  optionsNe: ['पूर्ण खोप लगाइएको', 'आंशिक खोप', 'खोप नलगाइएको'],
  appliesTo: 'all',};

export const petPapersField: SelectField = {
  name: 'papers',
  label: 'Pedigree / Papers',
  labelNe: 'वंशावली / कागजात',
  type: 'select',
  required: false,
  options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
  optionsNe: ['छ - सबै कागजात', 'केही कागजात', 'कागजात छैन'],
  appliesTo: 'all',};

export const petColorField: TextField = {
  name: 'color',
  label: 'Color / Coat',
  labelNe: 'रङ / भुत्ला',
  type: 'text',
  required: false,
  placeholder: 'e.g., Brown, Black, White',
  placeholderNe: 'जस्तै, खैरो, कालो, सेतो',
  appliesTo: 'all',};

export const petWeightField: NumberField = {
  name: 'weight',
  label: 'Weight (kg)',
  labelNe: 'तौल (केजी)',
  type: 'number',
  required: false,
  placeholder: 'in kg',
  placeholderNe: 'केजीमा',
  appliesTo: 'all',};

export const trainedField: SelectField = {
  name: 'trained',
  label: 'Trained',
  labelNe: 'प्रशिक्षित',
  type: 'select',
  required: false,
  options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
  optionsNe: ['पूर्ण प्रशिक्षित', 'आंशिक प्रशिक्षित', 'प्रशिक्षित छैन'],
  appliesTo: 'all',};

export const friendlyWithField: MultiselectField = {
  name: 'friendlyWith',
  label: 'Friendly With',
  labelNe: 'मैत्रीपूर्ण',
  type: 'multiselect',
  required: false,
  options: ['Children', 'Other Pets', 'Strangers'],
  optionsNe: ['बच्चाहरू', 'अन्य पालतु', 'अपरिचित'],
  appliesTo: 'all',};

// The decisive spec on any cow or buffalo listing.
export const milkYieldField: NumberField = {
  name: 'milkYield',
  label: 'Milk Yield (litres/day)',
  labelNe: 'दूध उत्पादन (लिटर/दिन)',
  type: 'number',
  required: false,
  placeholder: 'e.g., 12',
  placeholderNe: 'जस्तै, १२',
  appliesTo: 'all',};

export const priceUnitAnimalField: SelectField = {
  name: 'priceUnit',
  label: 'Price Unit',
  labelNe: 'मूल्य एकाइ',
  type: 'select',
  required: false,
  options: ['Per Animal', 'Per Kg (live weight)'],
  optionsNe: ['प्रति पशु', 'प्रति केजी (जिउँदो तौल)'],
  appliesTo: 'all',};

export const petProductTypeField: SelectField = {
  name: 'productType',
  label: 'Product Type',
  labelNe: 'उत्पादन प्रकार',
  type: 'select',
  required: false,
  options: [
    'Cage / Kennel', 'Aquarium', 'Leash & Collar', 'Bedding', 'Bowls & Feeders',
    'Grooming', 'Toys', 'Pet Clothing', 'Veterinary', 'Livestock Equipment', 'Other',
  ],
  optionsNe: [
    'पिंजरा / केनेल', 'एक्वारियम', 'पट्टा र कलर', 'ओछ्यान', 'भाँडा र फिडर',
    'ग्रुमिङ', 'खेलौना', 'पशु लुगा', 'पशु चिकित्सा', 'पशुपालन उपकरण', 'अन्य',
  ],
  appliesTo: 'all',};

// The subcategory is "Pet & Animal food" — livestock has to be listable.
export const suitableForField: MultiselectField = {
  name: 'suitableFor',
  label: 'Suitable For',
  labelNe: 'उपयुक्त',
  type: 'multiselect',
  required: false,
  options: ['Dogs', 'Cats', 'Birds', 'Fish', 'Rabbits', 'Cattle', 'Goats', 'Poultry', 'All Pets'],
  optionsNe: ['कुकुर', 'बिरालो', 'चरा', 'माछा', 'खरायो', 'गाईवस्तु', 'बाख्रा', 'कुखुरा', 'सबै पालतु'],
  appliesTo: 'all',};
