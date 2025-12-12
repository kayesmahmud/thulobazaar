/**
 * General Template (Home & Living, Hobbies, Business, Essentials, Agriculture)
 */

import type { FormTemplate } from '../types';
import { createConditionField, createBrandField, CONDITION_OPTIONS } from '../sharedFields';

const FURNITURE = [
  'Bedroom Furniture', 'Living Room Furniture', 'Office & Shop Furniture',
  'Kitchen & Dining Furniture', "Children's Furniture",
];
const SEATING_FURNITURE = ['Living Room Furniture', 'Kitchen & Dining Furniture', 'Office & Shop Furniture'];
const STORAGE_FURNITURE = ['Bedroom Furniture', 'Living Room Furniture', 'Office & Shop Furniture', "Children's Furniture"];
const ESSENTIALS = ['Grocery', 'Healthcare', 'Other Essentials', 'Household', 'Baby Products', 'Fruits & Vegetables', 'Meat & Seafood'];
const PERISHABLES = ['Grocery', 'Healthcare', 'Fruits & Vegetables', 'Meat & Seafood'];

export const generalTemplate: FormTemplate = {
  name: 'General',
  icon: '📦',
  fields: [
    createConditionField(CONDITION_OPTIONS.NEW_USED, 'all', false),
    createBrandField('e.g., IKEA, Nike, Canon', 'all', false),
    // For Furniture (Home & Living)
    {
      name: 'furnitureType',
      label: 'Furniture Type',
      type: 'select',
      required: true,
      options: ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
      appliesTo: FURNITURE,
    },
    {
      name: 'material',
      label: 'Material',
      type: 'select',
      required: false,
      options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
      appliesTo: FURNITURE,
    },
    {
      name: 'color',
      label: 'Color/Finish',
      type: 'text',
      required: false,
      placeholder: 'e.g., Brown, White, Black, Walnut',
      appliesTo: FURNITURE,
    },
    {
      name: 'dimensions',
      label: 'Dimensions (L × W × H)',
      type: 'text',
      required: false,
      placeholder: 'e.g., 200cm × 100cm × 80cm',
      appliesTo: FURNITURE,
    },
    {
      name: 'assemblyRequired',
      label: 'Assembly Required',
      type: 'select',
      required: false,
      options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
      appliesTo: FURNITURE,
    },
    {
      name: 'seatingCapacity',
      label: 'Seating Capacity',
      type: 'select',
      required: false,
      options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
      appliesTo: SEATING_FURNITURE,
    },
    {
      name: 'storage',
      label: 'Storage Available',
      type: 'select',
      required: false,
      options: ['Yes', 'No'],
      appliesTo: STORAGE_FURNITURE,
    },
    {
      name: 'style',
      label: 'Style',
      type: 'select',
      required: false,
      options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
      appliesTo: FURNITURE,
    },
    // For Sports/Musical Instruments
    {
      name: 'sportType',
      label: 'Sport/Instrument Type',
      type: 'text',
      required: false,
      placeholder: 'e.g., Cricket, Football, Guitar',
      appliesTo: ['Sports', 'Musical Instruments', 'Fitness & Gym'],
    },
    // For Business/Industry
    {
      name: 'machineryType',
      label: 'Machinery Type',
      type: 'select',
      required: true,
      options: ['Construction', 'Manufacturing', 'Agricultural', 'Office Equipment', 'Medical Equipment'],
      appliesTo: ['Industry Machinery & Tools', 'Medical Equipment & Supplies'],
    },
    {
      name: 'powerSource',
      label: 'Power Source',
      type: 'select',
      required: false,
      options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
      appliesTo: ['Industry Machinery & Tools'],
    },
    // For Essentials/Grocery
    {
      name: 'productType',
      label: 'Product Type',
      type: 'select',
      required: true,
      options: ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
      appliesTo: ESSENTIALS,
    },
    {
      name: 'quantity',
      label: 'Quantity Available',
      type: 'number',
      required: false,
      placeholder: 'Enter quantity',
      appliesTo: ESSENTIALS,
    },
    {
      name: 'expiryDate',
      label: 'Expiry Date',
      type: 'date',
      required: false,
      appliesTo: PERISHABLES,
    },
    // For Agriculture
    {
      name: 'cropType',
      label: 'Crop/Plant Type',
      type: 'text',
      required: true,
      placeholder: 'e.g., Rice, Wheat, Tomato',
      appliesTo: ['Crops, Seeds & Plants'],
    },
    {
      name: 'farmingToolType',
      label: 'Farming Tool Type',
      type: 'select',
      required: false,
      options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
      appliesTo: ['Farming Tools & Machinery'],
    },
  ],
};
