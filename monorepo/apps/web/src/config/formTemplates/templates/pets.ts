/**
 * Pets & Animals Template
 */

import type { FormTemplate } from '../types';

const PETS_ANIMALS = ['Pets', 'Farm Animals', 'Other Pets & Animals'];
const PETS_FARM = ['Pets', 'Farm Animals'];

export const petsTemplate: FormTemplate = {
  name: 'Pets & Animals',
  icon: '🐾',
  fields: [
    {
      name: 'animalType',
      label: 'Animal Type',
      type: 'select',
      required: true,
      options: [
        'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Guinea Pig',
        'Cow', 'Buffalo', 'Goat', 'Chicken', 'Duck', 'Other',
      ],
      appliesTo: PETS_ANIMALS,
    },
    {
      name: 'breed',
      label: 'Breed',
      type: 'text',
      required: false,
      placeholder: 'e.g., Golden Retriever, Persian Cat',
      appliesTo: PETS_ANIMALS,
    },
    {
      name: 'age',
      label: 'Age',
      type: 'select',
      required: true,
      options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
      appliesTo: PETS_ANIMALS,
    },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: false,
      options: ['Male', 'Female', 'Unknown'],
      appliesTo: PETS_ANIMALS,
    },
    {
      name: 'vaccination',
      label: 'Vaccination Status',
      type: 'select',
      required: true,
      options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
      appliesTo: PETS_FARM,
    },
    {
      name: 'papers',
      label: 'Pet Papers/Documents',
      type: 'select',
      required: false,
      options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
      appliesTo: ['Pets'],
    },
    {
      name: 'color',
      label: 'Color/Coat Color',
      type: 'text',
      required: false,
      placeholder: 'e.g., Brown, Black, White',
      appliesTo: PETS_FARM,
    },
    {
      name: 'weight',
      label: 'Weight',
      type: 'number',
      required: false,
      placeholder: 'in kg',
      appliesTo: PETS_FARM,
    },
    {
      name: 'trained',
      label: 'Trained',
      type: 'select',
      required: false,
      options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
      appliesTo: ['Pets'],
    },
    {
      name: 'friendlyWith',
      label: 'Friendly With',
      type: 'multiselect',
      required: false,
      options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
      appliesTo: ['Pets'],
    },
    // For Pet Accessories
    {
      name: 'productType',
      label: 'Product Type',
      type: 'select',
      required: true,
      options: ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
      appliesTo: ['Pet & Animal Accessories'],
    },
    {
      name: 'suitableFor',
      label: 'Suitable For',
      type: 'select',
      required: false,
      options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
      appliesTo: ['Pet & Animal Accessories', 'Pet & Animal food'],
    },
  ],
};
