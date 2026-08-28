/**
 * Fashion & Apparel Template
 *
 * Covers both fashion parents. Four subcategory names ('Footwear',
 * 'Bags & Accessories', 'Optical & Sunglasses', 'Wholesale - Bulk') exist under
 * both parents and are resolved by name, so one entry serves both.
 *
 * Hygiene subcategories (grooming, beauty, lingerie) carry no Condition field —
 * used personal care must not be listable.
 */

import type { FormTemplate } from '../types';
import { conditionOptional, brandField, colorField } from '../fields/common';
import {
  sizeField,
  waistSizeField,
  clothingTypeShirtsField,
  clothingTypePantsField,
  clothingTypeJacketField,
  clothingTypeMensTraditionalField,
  clothingTypeWesternField,
  clothingTypeWomensTraditionalField,
  clothingTypeWinterField,
  fitTypeField,
  sleeveTypeField,
  fabricField,
  fabricWomensField,
  footwearTypeField,
  shoeSizeField,
  watchTypeField,
  strapMaterialField,
  accessoryTypeBagsField,
  materialBagsField,
  eyewearTypeField,
  jewelleryMaterialField,
} from '../fields/fashion';
import {
  ageGroupField,
  minOrderQuantityField,
  quantityField,
  productVolumeField,
  expiryDateField,
} from '../fields/general';

const SHIRTS = ['Shirts & T-Shirts'];
const PANTS = ['Pants'];
const JACKETS = ['Jacket & Coat'];
const MENS_TRADITIONAL = ['Traditional Clothing'];
const WESTERN = ['Western Wear'];
const WOMENS_TRADITIONAL = ['Traditional Wear'];
const WINTER = ['Winter Wear'];
const FOOTWEAR = ['Footwear'];
const WATCHES = ['Watches'];
const JEWELLERY = ['Jewellery & Watches'];
const BAGS = ['Bags & Accessories'];
const OPTICAL = ['Optical & Sunglasses'];
const BABY = ["Baby Boy's Fashion", "Baby Girl's Fashion"];
const WHOLESALE = ['Wholesale - Bulk'];
const GROOMING = ['Grooming & Bodycare'];
const BEAUTY = ['Beauty & Personal Care'];
const LINGERIE = ['Lingerie & Sleepwear'];

const CLOTHING = [...SHIRTS, ...PANTS, ...JACKETS, ...MENS_TRADITIONAL, ...WESTERN, ...WOMENS_TRADITIONAL, ...WINTER];
const LETTER_SIZED = [...SHIRTS, ...JACKETS, ...MENS_TRADITIONAL, ...WESTERN, ...WOMENS_TRADITIONAL, ...WINTER, ...LINGERIE];
const HAS_CONDITION = [
  ...CLOTHING, ...FOOTWEAR, ...WATCHES, ...JEWELLERY, ...BAGS, ...OPTICAL, ...BABY, ...WHOLESALE,
];

export const fashionTemplate: FormTemplate = {
  name: 'Fashion & Apparel',
  icon: '👔👗',
  fields: [
    { ...conditionOptional, appliesTo: HAS_CONDITION },
    { ...brandField, placeholder: 'e.g., Nike, Adidas, Zara, H&M', appliesTo: CLOTHING },
    { ...brandField, placeholder: 'e.g., Nike, Adidas, Bata, Goldstar', appliesTo: FOOTWEAR },
    { ...brandField, placeholder: 'e.g., Casio, Fossil, Titan, Apple', appliesTo: [...WATCHES, ...JEWELLERY] },
    { ...brandField, placeholder: 'e.g., American Tourister, Samsonite, Wildcraft', appliesTo: BAGS },
    { ...brandField, placeholder: 'e.g., Ray-Ban, Oakley, Titan Eye+', appliesTo: OPTICAL },
    { ...brandField, placeholder: "e.g., Carter's, Mothercare, Next", appliesTo: BABY },
    { ...brandField, appliesTo: WHOLESALE },
    { ...brandField, placeholder: 'e.g., Nivea, Gillette, Park Avenue', appliesTo: GROOMING },
    { ...brandField, placeholder: "e.g., L'Oreal, Nivea, Garnier, Himalaya", appliesTo: BEAUTY },
    { ...brandField, placeholder: 'e.g., Jockey, Enamor, Triumph', appliesTo: LINGERIE },
    { ...clothingTypeShirtsField, appliesTo: SHIRTS },
    { ...clothingTypePantsField, appliesTo: PANTS },
    { ...clothingTypeJacketField, appliesTo: JACKETS },
    { ...clothingTypeMensTraditionalField, appliesTo: MENS_TRADITIONAL },
    { ...clothingTypeWesternField, appliesTo: WESTERN },
    { ...clothingTypeWomensTraditionalField, appliesTo: WOMENS_TRADITIONAL },
    { ...clothingTypeWinterField, appliesTo: WINTER },
    { ...footwearTypeField, appliesTo: FOOTWEAR },
    { ...accessoryTypeBagsField, appliesTo: BAGS },
    { ...eyewearTypeField, appliesTo: OPTICAL },
    { ...jewelleryMaterialField, appliesTo: JEWELLERY },
    { ...watchTypeField, appliesTo: [...WATCHES, ...JEWELLERY] },
    { ...strapMaterialField, appliesTo: [...WATCHES, ...JEWELLERY] },
    // Baby clothing is sized by age, not by XS-XXXL.
    { ...ageGroupField, appliesTo: BABY },
    { ...sizeField, appliesTo: LETTER_SIZED },
    { ...waistSizeField, appliesTo: PANTS },
    { ...shoeSizeField, appliesTo: FOOTWEAR },
    { ...fitTypeField, appliesTo: [...SHIRTS, ...PANTS, ...JACKETS, ...WESTERN] },
    { ...sleeveTypeField, appliesTo: SHIRTS },
    { ...fabricField, appliesTo: MENS_TRADITIONAL },
    { ...fabricWomensField, appliesTo: WOMENS_TRADITIONAL },
    { ...materialBagsField, appliesTo: BAGS },
    { ...minOrderQuantityField, appliesTo: WHOLESALE },
    { ...quantityField, appliesTo: WHOLESALE },
    { ...productVolumeField, appliesTo: [...GROOMING, ...BEAUTY] },
    { ...expiryDateField, appliesTo: [...GROOMING, ...BEAUTY] },
    {
      ...colorField,
      appliesTo: [...CLOTHING, ...FOOTWEAR, ...WATCHES, ...JEWELLERY, ...BAGS, ...OPTICAL, ...BABY, ...LINGERIE],
    },
  ],
};
