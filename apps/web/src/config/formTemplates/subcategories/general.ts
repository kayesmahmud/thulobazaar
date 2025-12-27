/**
 * General Subcategory Configurations
 * (Home & Living, Hobbies/Sports, Business & Industry, Essentials, Agriculture)
 */

import type { SubcategoryConfig } from '../types';
import {
  conditionNewUsed,
  brandField,
  furnitureTypeField,
  materialField,
  dimensionsField,
  assemblyRequiredField,
  seatingCapacityField,
  storageAvailableField,
  styleField,
  colorField,
  sportTypeField,
  instrumentTypeField,
  machineryTypeField,
  powerSourceField,
  productTypeField,
  quantityField,
  expiryDateField,
  cropTypeField,
  farmingToolTypeField,
} from '../fields';

// ============================================
// HOME & LIVING - Furniture
// ============================================

export const bedroomFurniture: SubcategoryConfig = {
  name: 'Bedroom Furniture',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., IKEA, Ashley, Local Carpenter' } },
    { field: furnitureTypeField, override: { options: ['Bed', 'Wardrobe', 'Dresser', 'Nightstand', 'Mattress'] } },
    { field: materialField },
    { field: colorField, override: { label: 'Color/Finish' } },
    { field: dimensionsField },
    { field: assemblyRequiredField },
    { field: storageAvailableField },
    { field: styleField },
  ],
};

export const livingRoomFurniture: SubcategoryConfig = {
  name: 'Living Room Furniture',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., IKEA, La-Z-Boy, Local Maker' } },
    { field: furnitureTypeField, override: { options: ['Sofa', 'Coffee Table', 'TV Stand', 'Shelf', 'Recliner', 'Ottoman'] } },
    { field: materialField },
    { field: colorField, override: { label: 'Color/Finish' } },
    { field: dimensionsField },
    { field: seatingCapacityField },
    { field: assemblyRequiredField },
    { field: styleField },
  ],
};

export const kitchenDiningFurniture: SubcategoryConfig = {
  name: 'Kitchen & Dining Furniture',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., IKEA, Local Carpenter' } },
    { field: furnitureTypeField, override: { options: ['Dining Table', 'Dining Chair', 'Cabinet', 'Shelf', 'Bar Stool'] } },
    { field: materialField },
    { field: colorField, override: { label: 'Color/Finish' } },
    { field: dimensionsField },
    { field: seatingCapacityField },
    { field: assemblyRequiredField },
  ],
};

export const officeFurniture: SubcategoryConfig = {
  name: 'Office & Shop Furniture',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Herman Miller, Steelcase, IKEA' } },
    { field: furnitureTypeField, override: { options: ['Desk', 'Office Chair', 'Filing Cabinet', 'Bookshelf', 'Conference Table', 'Reception Desk'] } },
    { field: materialField },
    { field: colorField, override: { label: 'Color/Finish' } },
    { field: dimensionsField },
    { field: assemblyRequiredField },
  ],
};

export const childrenFurniture: SubcategoryConfig = {
  name: "Children's Furniture",
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., IKEA, Fisher-Price' } },
    { field: furnitureTypeField, override: { options: ['Crib', 'Kids Bed', 'Study Table', 'Toy Storage', 'High Chair', 'Changing Table'] } },
    { field: materialField },
    { field: colorField },
    { field: dimensionsField },
    { field: assemblyRequiredField },
  ],
};

export const homeDecor: SubcategoryConfig = {
  name: 'Home Decor',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { required: false } },
    { field: materialField },
    { field: colorField },
    { field: styleField },
  ],
};

export const kitchenAppliances: SubcategoryConfig = {
  name: 'Kitchen Appliances',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Philips, Prestige, Bajaj' } },
  ],
};

export const homeAppliances: SubcategoryConfig = {
  name: 'Home Appliances',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., LG, Samsung, Whirlpool' } },
  ],
};

// ============================================
// HOBBIES, SPORTS & KIDS
// ============================================

export const sports: SubcategoryConfig = {
  name: 'Sports',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Nike, Adidas, Yonex, Wilson' } },
    { field: sportTypeField },
  ],
};

export const fitnessGym: SubcategoryConfig = {
  name: 'Fitness & Gym',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Bowflex, NordicTrack, Decathlon' } },
    { field: sportTypeField, override: { label: 'Equipment Type', placeholder: 'e.g., Treadmill, Dumbbells, Yoga Mat' } },
  ],
};

export const musicalInstruments: SubcategoryConfig = {
  name: 'Musical Instruments',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Yamaha, Gibson, Fender, Roland' } },
    { field: instrumentTypeField },
  ],
};

export const kidsItems: SubcategoryConfig = {
  name: 'Kids Items',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Fisher-Price, Lego, Hot Wheels' } },
  ],
};

export const booksStationary: SubcategoryConfig = {
  name: 'Books & Stationery',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Like New', 'Good', 'Fair'] } },
    { field: brandField, override: { required: false, placeholder: 'e.g., Publisher name' } },
  ],
};

// ============================================
// BUSINESS & INDUSTRY
// (IMPORTANT: Different brand placeholders than consumer products!)
// ============================================

export const industryMachinery: SubcategoryConfig = {
  name: 'Industry Machinery & Tools',
  fields: [
    { field: conditionNewUsed },
    // FIXED: Industry-specific brand placeholder (not IKEA, Nike, Canon)
    { field: brandField, override: { placeholder: 'e.g., Caterpillar, John Deere, Bosch, Makita' } },
    { field: machineryTypeField },
    { field: powerSourceField },
  ],
};

export const medicalEquipment: SubcategoryConfig = {
  name: 'Medical Equipment & Supplies',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Philips, GE Healthcare, Siemens' } },
    { field: machineryTypeField, override: { options: ['Diagnostic', 'Surgical', 'Monitoring', 'Laboratory', 'Therapy'] } },
  ],
};

export const officeEquipment: SubcategoryConfig = {
  name: 'Office Equipment',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., HP, Canon, Xerox, Brother' } },
  ],
};

export const rawMaterials: SubcategoryConfig = {
  name: 'Raw Materials',
  fields: [
    { field: conditionNewUsed, override: { options: ['New'] } },
    { field: quantityField },
  ],
};

// ============================================
// ESSENTIALS
// ============================================

export const grocery: SubcategoryConfig = {
  name: 'Grocery',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed'] } },
    { field: brandField, override: { required: false } },
    { field: productTypeField, override: { options: ['Food Item', 'Beverage', 'Snacks', 'Dairy', 'Grains'] } },
    { field: quantityField },
    { field: expiryDateField },
  ],
};

export const healthcare: SubcategoryConfig = {
  name: 'Healthcare',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed'] } },
    { field: brandField, override: { required: false } },
    { field: productTypeField, override: { options: ['Medicine', 'First Aid', 'Medical Device', 'Supplements'] } },
    { field: quantityField },
    { field: expiryDateField },
  ],
};

export const babyProducts: SubcategoryConfig = {
  name: 'Baby Products',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Pampers, Johnson & Johnson, Huggies' } },
    { field: productTypeField, override: { options: ['Diapers', 'Baby Food', 'Baby Care', 'Feeding', 'Baby Clothes'] } },
    { field: quantityField },
  ],
};

export const household: SubcategoryConfig = {
  name: 'Household',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed'] } },
    { field: brandField, override: { required: false } },
    { field: productTypeField, override: { options: ['Cleaning', 'Laundry', 'Storage', 'Kitchen Items'] } },
    { field: quantityField },
  ],
};

// ============================================
// AGRICULTURE
// ============================================

export const cropsSeedsPlants: SubcategoryConfig = {
  name: 'Crops, Seeds & Plants',
  fields: [
    { field: cropTypeField },
    { field: quantityField },
  ],
};

export const farmingTools: SubcategoryConfig = {
  name: 'Farming Tools & Machinery',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., John Deere, Mahindra, Kubota' } },
    { field: farmingToolTypeField },
    { field: powerSourceField },
  ],
};

export const fertilizers: SubcategoryConfig = {
  name: 'Fertilizers & Pesticides',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed'] } },
    { field: brandField, override: { required: false } },
    { field: quantityField },
    { field: expiryDateField },
  ],
};

export const livestockFeed: SubcategoryConfig = {
  name: 'Livestock Feed',
  fields: [
    { field: conditionNewUsed, override: { options: ['Brand New', 'Sealed'] } },
    { field: brandField, override: { required: false } },
    { field: quantityField },
    { field: expiryDateField },
  ],
};

// Export all general subcategories as a map
export const generalSubcategories: Record<string, SubcategoryConfig> = {
  // Home & Living
  'Bedroom Furniture': bedroomFurniture,
  'Living Room Furniture': livingRoomFurniture,
  'Kitchen & Dining Furniture': kitchenDiningFurniture,
  'Office & Shop Furniture': officeFurniture,
  "Children's Furniture": childrenFurniture,
  'Home Decor': homeDecor,
  'Kitchen Appliances': kitchenAppliances,
  'Home Appliances': homeAppliances,
  // Hobbies & Sports
  'Sports': sports,
  'Fitness & Gym': fitnessGym,
  'Musical Instruments': musicalInstruments,
  'Kids Items': kidsItems,
  'Books & Stationery': booksStationary,
  // Business & Industry (with correct brand placeholders)
  'Industry Machinery & Tools': industryMachinery,
  'Medical Equipment & Supplies': medicalEquipment,
  'Office Equipment': officeEquipment,
  'Raw Materials': rawMaterials,
  // Essentials
  'Grocery': grocery,
  'Healthcare': healthcare,
  'Baby Products': babyProducts,
  'Household': household,
  // Agriculture
  'Crops, Seeds & Plants': cropsSeedsPlants,
  'Farming Tools & Machinery': farmingTools,
  'Fertilizers & Pesticides': fertilizers,
  'Livestock Feed': livestockFeed,
};
