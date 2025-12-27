/**
 * Pets & Animals Subcategory Configurations
 */

import type { SubcategoryConfig } from '../types';
import {
  conditionNewUsed,
  brandField,
  animalTypeField,
  breedField,
  petAgeField,
  petGenderField,
  vaccinationField,
  petPapersField,
  petColorField,
  petWeightField,
  trainedField,
  friendlyWithField,
  petProductTypeField,
  suitableForField,
} from '../fields';

export const dogs: SubcategoryConfig = {
  name: 'Dogs',
  fields: [
    { field: animalTypeField, override: { options: ['Dog'] } },
    { field: breedField, override: { placeholder: 'e.g., Golden Retriever, Labrador, German Shepherd' } },
    { field: petAgeField },
    { field: petGenderField },
    { field: vaccinationField },
    { field: petPapersField },
    { field: petColorField },
    { field: petWeightField },
    { field: trainedField },
    { field: friendlyWithField },
  ],
};

export const cats: SubcategoryConfig = {
  name: 'Cats',
  fields: [
    { field: animalTypeField, override: { options: ['Cat'] } },
    { field: breedField, override: { placeholder: 'e.g., Persian, Siamese, Maine Coon' } },
    { field: petAgeField },
    { field: petGenderField },
    { field: vaccinationField },
    { field: petColorField },
    { field: petWeightField },
    { field: trainedField, override: { options: ['Litter Trained', 'Partially Trained', 'Not Trained'] } },
  ],
};

export const birds: SubcategoryConfig = {
  name: 'Birds',
  fields: [
    { field: animalTypeField, override: { options: ['Bird'] } },
    { field: breedField, override: { label: 'Species', placeholder: 'e.g., Parrot, Budgie, Cockatiel, Love Birds' } },
    { field: petAgeField },
    { field: petGenderField },
    { field: petColorField },
    { field: trainedField, override: { options: ['Talks', 'Tame', 'Wild'] } },
  ],
};

export const fish: SubcategoryConfig = {
  name: 'Fish & Aquariums',
  fields: [
    { field: animalTypeField, override: { options: ['Fish'] } },
    { field: breedField, override: { label: 'Species', placeholder: 'e.g., Goldfish, Guppy, Betta, Koi' } },
    { field: petColorField },
  ],
};

export const rabbits: SubcategoryConfig = {
  name: 'Rabbits',
  fields: [
    { field: animalTypeField, override: { options: ['Rabbit'] } },
    { field: breedField, override: { placeholder: 'e.g., Holland Lop, Flemish Giant' } },
    { field: petAgeField },
    { field: petGenderField },
    { field: vaccinationField },
    { field: petColorField },
  ],
};

export const otherPets: SubcategoryConfig = {
  name: 'Other Pets',
  fields: [
    { field: animalTypeField },
    { field: breedField },
    { field: petAgeField },
    { field: petGenderField },
    { field: petColorField },
  ],
};

export const livestock: SubcategoryConfig = {
  name: 'Livestock',
  fields: [
    { field: animalTypeField, override: { options: ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Pig', 'Horse', 'Donkey'] } },
    { field: breedField },
    { field: petAgeField, override: { label: 'Age' } },
    { field: petGenderField, override: { label: 'Gender' } },
    { field: vaccinationField },
    { field: petWeightField, override: { label: 'Weight (kg)' } },
  ],
};

export const poultry: SubcategoryConfig = {
  name: 'Poultry',
  fields: [
    { field: animalTypeField, override: { options: ['Chicken', 'Duck', 'Turkey', 'Quail', 'Pigeon'] } },
    { field: breedField },
    { field: petAgeField, override: { label: 'Age' } },
  ],
};

export const petFood: SubcategoryConfig = {
  name: 'Pet Food',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Unopened'], required: true } },
    { field: brandField, override: { placeholder: 'e.g., Pedigree, Royal Canin, Whiskas' } },
    { field: suitableForField },
  ],
};

export const petAccessories: SubcategoryConfig = {
  name: 'Pet Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField },
    { field: petProductTypeField },
    { field: suitableForField },
  ],
};

// Export all pets subcategories as a map
export const petsSubcategories: Record<string, SubcategoryConfig> = {
  'Dogs': dogs,
  'Cats': cats,
  'Birds': birds,
  'Fish & Aquariums': fish,
  'Rabbits': rabbits,
  'Other Pets': otherPets,
  'Livestock': livestock,
  'Poultry': poultry,
  'Pet Food': petFood,
  'Pet Accessories': petAccessories,
};
