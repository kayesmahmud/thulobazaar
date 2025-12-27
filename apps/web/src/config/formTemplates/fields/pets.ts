/**
 * Pets & Animals Fields
 */

import type { FormField } from '../types';

export const animalTypeField: FormField = {
  name: 'animalType',
  label: 'Animal Type',
  type: 'select',
  required: true,
  options: ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig', 'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other'],
  appliesTo: 'all',
};

export const breedField: FormField = {
  name: 'breed',
  label: 'Breed',
  type: 'text',
  required: false,
  placeholder: 'e.g., Golden Retriever, Persian Cat',
  appliesTo: 'all',
};

export const petAgeField: FormField = {
  name: 'age',
  label: 'Age',
  type: 'select',
  required: true,
  options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
  appliesTo: 'all',
};

export const petGenderField: FormField = {
  name: 'gender',
  label: 'Gender',
  type: 'select',
  required: false,
  options: ['Male', 'Female', 'Unknown'],
  appliesTo: 'all',
};

export const vaccinationField: FormField = {
  name: 'vaccination',
  label: 'Vaccination Status',
  type: 'select',
  required: true,
  options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
  appliesTo: 'all',
};

export const petPapersField: FormField = {
  name: 'papers',
  label: 'Pet Papers/Documents',
  type: 'select',
  required: false,
  options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
  appliesTo: 'all',
};

export const petColorField: FormField = {
  name: 'color',
  label: 'Color/Coat Color',
  type: 'text',
  required: false,
  placeholder: 'e.g., Brown, Black, White',
  appliesTo: 'all',
};

export const petWeightField: FormField = {
  name: 'weight',
  label: 'Weight',
  type: 'number',
  required: false,
  placeholder: 'in kg',
  appliesTo: 'all',
};

export const trainedField: FormField = {
  name: 'trained',
  label: 'Trained',
  type: 'select',
  required: false,
  options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
  appliesTo: 'all',
};

export const friendlyWithField: FormField = {
  name: 'friendlyWith',
  label: 'Friendly With',
  type: 'multiselect',
  required: false,
  options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
  appliesTo: 'all',
};

export const petProductTypeField: FormField = {
  name: 'productType',
  label: 'Product Type',
  type: 'select',
  required: true,
  options: ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
  appliesTo: 'all',
};

export const suitableForField: FormField = {
  name: 'suitableFor',
  label: 'Suitable For',
  type: 'select',
  required: false,
  options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
  appliesTo: 'all',
};
