/**
 * Fashion & Apparel Fields
 */

import type { FormField } from '../types';

export const sizeField: FormField = {
  name: 'size',
  label: 'Size',
  type: 'select',
  required: true,
  options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
  appliesTo: 'all',
};

export const clothingTypeField: FormField = {
  name: 'clothingType',
  label: 'Clothing Type',
  type: 'select',
  required: true,
  options: ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Dress', 'Saree', 'Kurta', 'Jacket', 'Coat', 'Sweater', 'Skirt', 'Shorts'],
  appliesTo: 'all',
};

export const fitTypeField: FormField = {
  name: 'fitType',
  label: 'Fit Type',
  type: 'select',
  required: false,
  options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
  appliesTo: 'all',
};

export const sleeveTypeField: FormField = {
  name: 'sleeveType',
  label: 'Sleeve Type',
  type: 'select',
  required: false,
  options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
  appliesTo: 'all',
};

export const footwearTypeField: FormField = {
  name: 'footwearType',
  label: 'Footwear Type',
  type: 'select',
  required: true,
  options: ['Sneakers', 'Formal Shoes', 'Sandals', 'Slippers', 'Boots', 'Heels', 'Flats', 'Sports Shoes'],
  appliesTo: 'all',
};

export const shoeSizeField: FormField = {
  name: 'shoeSize',
  label: 'Shoe Size',
  type: 'number',
  required: true,
  min: 32,
  max: 50,
  placeholder: 'e.g., 38, 40, 42',
  appliesTo: 'all',
};

export const watchTypeField: FormField = {
  name: 'watchType',
  label: 'Watch Type',
  type: 'select',
  required: false,
  options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
  appliesTo: 'all',
};

export const strapMaterialField: FormField = {
  name: 'strapMaterial',
  label: 'Strap Material',
  type: 'select',
  required: false,
  options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
  appliesTo: 'all',
};
