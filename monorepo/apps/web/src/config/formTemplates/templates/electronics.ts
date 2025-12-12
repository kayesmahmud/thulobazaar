/**
 * Electronics & Gadgets Template
 */

import type { FormTemplate } from '../types';
import { createConditionField, createBrandField, createModelField, createWarrantyField, CONDITION_OPTIONS } from '../sharedFields';

const MOBILE_TABLETS = ['Mobile Phones', 'Tablets & Accessories'];
const COMPUTERS = ['Laptops', 'Desktop Computers'];
const MOBILE_LAPTOPS_TABLETS = ['Mobile Phones', 'Laptops', 'Desktop Computers', 'Tablets & Accessories'];

export const electronicsTemplate: FormTemplate = {
  name: 'Electronics & Gadgets',
  icon: '📱💻',
  fields: [
    createConditionField(CONDITION_OPTIONS.NEW_USED),
    createBrandField('e.g., Apple, Samsung, Dell, HP'),
    createModelField('e.g., iPhone 15 Pro, Galaxy S23'),
    createWarrantyField(),
    // Mobile Phones Specific
    {
      name: 'storage',
      label: 'Storage Capacity',
      type: 'select',
      required: true,
      options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
      appliesTo: MOBILE_TABLETS,
    },
    {
      name: 'ram',
      label: 'RAM',
      type: 'select',
      required: true,
      options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
      appliesTo: MOBILE_LAPTOPS_TABLETS,
    },
    {
      name: 'batteryHealth',
      label: 'Battery Health',
      type: 'select',
      required: false,
      options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
      appliesTo: ['Mobile Phones', 'Laptops', 'Tablets & Accessories'],
    },
    // Laptops/Computers Specific
    {
      name: 'processor',
      label: 'Processor',
      type: 'text',
      required: true,
      placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
      appliesTo: COMPUTERS,
    },
    {
      name: 'graphics',
      label: 'Graphics Card',
      type: 'text',
      required: false,
      placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
      appliesTo: COMPUTERS,
    },
    {
      name: 'screenResolution',
      label: 'Screen Resolution',
      type: 'select',
      required: false,
      options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
      appliesTo: ['Laptops', 'TVs', 'Desktop Computers'],
    },
    // TVs/Cameras Specific
    {
      name: 'screenSize',
      label: 'Screen/Sensor Size',
      type: 'text',
      required: true,
      placeholder: 'e.g., 55 inches, 24MP',
      appliesTo: ['TVs', 'Cameras, Camcorders & Accessories'],
    },
    {
      name: 'smartFeatures',
      label: 'Smart Features',
      type: 'multiselect',
      required: false,
      options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
      appliesTo: ['TVs'],
    },
    {
      name: 'megapixels',
      label: 'Megapixels',
      type: 'number',
      required: false,
      placeholder: 'e.g., 24, 48, 108',
      appliesTo: ['Cameras, Camcorders & Accessories'],
    },
  ],
};
