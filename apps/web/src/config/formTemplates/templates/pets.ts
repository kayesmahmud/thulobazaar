/**
 * Pets & Animals Template
 *
 * Live animals carry no Condition field — a puppy is not "Brand New".
 * Pet & Animal food carries none either (B-17: it was mandatory on mobile).
 */

import type { FormTemplate } from '../types';
import { conditionOptional, brandField } from '../fields/common';
import {
  animalTypePetField,
  animalTypeFarmField,
  animalTypeField,
  breedField,
  petAgeField,
  petGenderField,
  petColorField,
  petWeightField,
  priceUnitAnimalField,
  milkYieldField,
  vaccinationField,
  petPapersField,
  trainedField,
  friendlyWithField,
  petProductTypeField,
  suitableForField,
} from '../fields/pets';
import { productWeightField, expiryDateField } from '../fields/general';

const PETS = ['Pets'];
const FARM_ANIMALS = ['Farm Animals'];
const OTHER_ANIMALS = ['Other Pets & Animals'];
const PET_FOOD = ['Pet & Animal food'];
const PET_ACCESSORIES = ['Pet & Animal Accessories'];

const LIVE_ANIMALS = [...PETS, ...FARM_ANIMALS, ...OTHER_ANIMALS];

export const petsTemplate: FormTemplate = {
  name: 'Pets & Animals',
  icon: '🐾',
  fields: [
    { ...animalTypePetField, appliesTo: PETS },
    { ...animalTypeFarmField, appliesTo: FARM_ANIMALS },
    { ...animalTypeField, appliesTo: OTHER_ANIMALS },
    { ...breedField, appliesTo: [...PETS, ...FARM_ANIMALS] },
    { ...breedField, label: 'Breed / Species', labelNe: 'नस्ल / प्रजाति', appliesTo: OTHER_ANIMALS },
    { ...petAgeField, appliesTo: LIVE_ANIMALS },
    { ...petGenderField, appliesTo: LIVE_ANIMALS },
    { ...petColorField, appliesTo: [...PETS, ...OTHER_ANIMALS] },
    { ...petWeightField, appliesTo: FARM_ANIMALS },
    { ...priceUnitAnimalField, appliesTo: FARM_ANIMALS },
    { ...milkYieldField, appliesTo: FARM_ANIMALS },
    { ...vaccinationField, appliesTo: [...PETS, ...FARM_ANIMALS] },
    { ...petPapersField, appliesTo: PETS },
    { ...trainedField, appliesTo: PETS },
    { ...friendlyWithField, appliesTo: PETS },
    { ...petProductTypeField, appliesTo: PET_ACCESSORIES },
    { ...suitableForField, appliesTo: [...PET_FOOD, ...PET_ACCESSORIES] },
    { ...conditionOptional, appliesTo: PET_ACCESSORIES },
    { ...brandField, placeholder: 'e.g., Pedigree, Royal Canin, Whiskas', appliesTo: PET_FOOD },
    { ...brandField, appliesTo: PET_ACCESSORIES },
    { ...productWeightField, appliesTo: PET_FOOD },
    { ...expiryDateField, appliesTo: PET_FOOD },
  ],
};
