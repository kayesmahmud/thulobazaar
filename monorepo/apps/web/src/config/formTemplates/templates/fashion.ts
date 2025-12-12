/**
 * Fashion & Apparel Template
 */

import type { FormTemplate } from '../types';
import { createConditionField, createColorField, CONDITION_OPTIONS } from '../sharedFields';

const CLOTHING = [
  'Shirts & T-Shirts', 'Pants', 'Traditional Clothing', 'Jacket & Coat',
  'Traditional Wear', 'Western Wear', 'Winter Wear',
];
const CLOTHING_WITH_JEANS = [...CLOTHING, 'Jeans'];
const CLOTHING_NO_PANTS = CLOTHING.filter(c => c !== 'Pants');

export const fashionTemplate: FormTemplate = {
  name: 'Fashion & Apparel',
  icon: '👔👗',
  fields: [
    createConditionField(CONDITION_OPTIONS.NEW_USED),
    {
      name: 'size',
      label: 'Size',
      type: 'select',
      required: true,
      options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
      appliesTo: CLOTHING,
    },
    createColorField('e.g., Black, White, Red'),
    // Clothing Specific
    {
      name: 'clothingType',
      label: 'Clothing Type',
      type: 'select',
      required: true,
      options: [
        'Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Dress', 'Saree',
        'Kurta', 'Jacket', 'Coat', 'Sweater', 'Skirt', 'Shorts',
      ],
      appliesTo: CLOTHING,
    },
    {
      name: 'fitType',
      label: 'Fit Type',
      type: 'select',
      required: false,
      options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
      appliesTo: CLOTHING_WITH_JEANS,
    },
    {
      name: 'sleeveType',
      label: 'Sleeve Type',
      type: 'select',
      required: false,
      options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
      appliesTo: CLOTHING_NO_PANTS,
    },
    // Footwear Specific
    {
      name: 'footwearType',
      label: 'Footwear Type',
      type: 'select',
      required: true,
      options: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Sports Shoes'],
      appliesTo: ['Footwear'],
    },
    {
      name: 'shoeSize',
      label: 'Shoe Size',
      type: 'number',
      required: true,
      min: 32,
      max: 45,
      placeholder: 'e.g., 38, 40, 42',
      appliesTo: ['Footwear'],
    },
    // Accessories/Watches
    {
      name: 'watchType',
      label: 'Watch Type',
      type: 'select',
      required: false,
      options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
      appliesTo: ['Watches', 'Jewellery & Watches'],
    },
    {
      name: 'strapMaterial',
      label: 'Strap Material',
      type: 'select',
      required: false,
      options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
      appliesTo: ['Watches', 'Jewellery & Watches'],
    },
  ],
};
