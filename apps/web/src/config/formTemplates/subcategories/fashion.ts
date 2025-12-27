/**
 * Fashion Subcategory Configurations
 */

import type { SubcategoryConfig } from '../types';
import {
  conditionNewUsed,
  brandField,
  sizeField,
  clothingTypeField,
  fitTypeField,
  sleeveTypeField,
  footwearTypeField,
  shoeSizeField,
  watchTypeField,
  strapMaterialField,
  colorField,
} from '../fields';

export const mensClothing: SubcategoryConfig = {
  name: "Men's Clothing",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Nike, Adidas, Zara, H&M' } },
    { field: clothingTypeField },
    { field: sizeField },
    { field: fitTypeField },
    { field: sleeveTypeField },
    { field: colorField },
  ],
};

export const mensFootwear: SubcategoryConfig = {
  name: "Men's Footwear",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Nike, Adidas, Puma, Clarks' } },
    { field: footwearTypeField },
    { field: shoeSizeField },
    { field: colorField },
  ],
};

export const mensWatches: SubcategoryConfig = {
  name: "Men's Watches",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Casio, Fossil, Titan, Apple' } },
    { field: watchTypeField },
    { field: strapMaterialField },
    { field: colorField },
  ],
};

export const mensAccessories: SubcategoryConfig = {
  name: "Men's Accessories",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Ray-Ban, Tommy Hilfiger' } },
    { field: colorField },
  ],
};

export const mensGrooming: SubcategoryConfig = {
  name: "Men's Grooming",
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed', 'Opened/Used'] } },
    { field: brandField, override: { placeholder: 'e.g., Nivea, Gillette, Park Avenue' } },
  ],
};

export const womensClothing: SubcategoryConfig = {
  name: "Women's Clothing",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Zara, H&M, Forever 21, Max' } },
    { field: clothingTypeField, override: { options: ['Dress', 'Top', 'Saree', 'Kurta', 'Jeans', 'Skirt', 'Leggings', 'Jacket', 'Coat', 'Traditional'] } },
    { field: sizeField },
    { field: fitTypeField },
    { field: colorField },
  ],
};

export const womensFootwear: SubcategoryConfig = {
  name: "Women's Footwear",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Steve Madden, Bata, Metro' } },
    { field: footwearTypeField, override: { options: ['Heels', 'Flats', 'Sandals', 'Sneakers', 'Boots', 'Wedges', 'Pumps'] } },
    { field: shoeSizeField },
    { field: colorField },
  ],
};

export const womensWatches: SubcategoryConfig = {
  name: "Women's Watches",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Fossil, Michael Kors, Titan' } },
    { field: watchTypeField },
    { field: strapMaterialField },
    { field: colorField },
  ],
};

export const womensJewelry: SubcategoryConfig = {
  name: 'Jewelry',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { required: false, placeholder: 'e.g., Tanishq, Swarovski' } },
    { field: colorField, override: { label: 'Metal/Color', placeholder: 'e.g., Gold, Silver, Rose Gold' } },
  ],
};

export const womensBeauty: SubcategoryConfig = {
  name: 'Beauty & Skincare',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed', 'Opened/Used'] } },
    { field: brandField, override: { placeholder: "e.g., L'Oreal, MAC, Maybelline" } },
  ],
};

export const womensBags: SubcategoryConfig = {
  name: 'Bags & Luggage',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Michael Kors, Coach, Samsonite' } },
    { field: colorField },
  ],
};

// Export all fashion subcategories as a map
export const fashionSubcategories: Record<string, SubcategoryConfig> = {
  "Men's Clothing": mensClothing,
  "Men's Footwear": mensFootwear,
  "Men's Watches": mensWatches,
  "Men's Accessories": mensAccessories,
  "Men's Grooming": mensGrooming,
  "Women's Clothing": womensClothing,
  "Women's Footwear": womensFootwear,
  "Women's Watches": womensWatches,
  'Jewelry': womensJewelry,
  'Beauty & Skincare': womensBeauty,
  'Bags & Luggage': womensBags,
};
