/**
 * Electronics Subcategory Configurations
 */

import type { SubcategoryConfig } from '../types';
import {
  conditionNewUsed,
  brandField,
  modelField,
  warrantyField,
  storageField,
  ramField,
  batteryHealthField,
  processorField,
  graphicsField,
  screenResolutionField,
  screenSizeField,
  smartFeaturesField,
  megapixelsField,
} from '../fields';

export const mobilePhones: SubcategoryConfig = {
  name: 'Mobile Phones',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Apple, Samsung, OnePlus, Xiaomi' } },
    { field: modelField, override: { placeholder: 'e.g., iPhone 15 Pro, Galaxy S24' } },
    { field: warrantyField },
    { field: storageField },
    { field: ramField },
    { field: batteryHealthField },
  ],
};

export const tabletsAccessories: SubcategoryConfig = {
  name: 'Tablets & Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Apple, Samsung, Huawei' } },
    { field: modelField, override: { placeholder: 'e.g., iPad Pro, Galaxy Tab' } },
    { field: warrantyField },
    { field: storageField },
    { field: ramField },
    { field: batteryHealthField },
  ],
};

export const laptops: SubcategoryConfig = {
  name: 'Laptops',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Dell, HP, Lenovo, Apple' } },
    { field: modelField, override: { placeholder: 'e.g., MacBook Pro, ThinkPad X1' } },
    { field: warrantyField },
    { field: processorField },
    { field: ramField },
    { field: storageField, override: { options: ['128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD'] } },
    { field: graphicsField },
    { field: screenResolutionField },
    { field: batteryHealthField },
  ],
};

export const desktopComputers: SubcategoryConfig = {
  name: 'Desktop Computers',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Dell, HP, Custom Build' } },
    { field: modelField },
    { field: warrantyField },
    { field: processorField },
    { field: ramField },
    { field: storageField, override: { options: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD', '2TB HDD', '4TB HDD'] } },
    { field: graphicsField },
    { field: screenResolutionField },
  ],
};

export const tvs: SubcategoryConfig = {
  name: 'TVs',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Samsung, LG, Sony, TCL' } },
    { field: modelField },
    { field: warrantyField },
    { field: screenSizeField, override: { placeholder: 'e.g., 32 inches, 55 inches, 65 inches' } },
    { field: screenResolutionField },
    { field: smartFeaturesField },
  ],
};

export const camerasAccessories: SubcategoryConfig = {
  name: 'Cameras, Camcorders & Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Canon, Nikon, Sony, GoPro' } },
    { field: modelField, override: { placeholder: 'e.g., EOS R5, A7 IV' } },
    { field: warrantyField },
    { field: screenSizeField, override: { label: 'Sensor Size', placeholder: 'e.g., Full Frame, APS-C, 1 inch' } },
    { field: megapixelsField },
  ],
};

export const mobileAccessories: SubcategoryConfig = {
  name: 'Mobile & Tablet Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Anker, Spigen, Apple' } },
    { field: warrantyField },
  ],
};

export const computerAccessories: SubcategoryConfig = {
  name: 'Computer Accessories',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Logitech, Razer, Corsair' } },
    { field: warrantyField },
  ],
};

export const audioEquipment: SubcategoryConfig = {
  name: 'Audio Equipment',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Sony, Bose, JBL, Sennheiser' } },
    { field: modelField },
    { field: warrantyField },
  ],
};

export const gamingConsoles: SubcategoryConfig = {
  name: 'Gaming Consoles',
  fields: [
    { field: conditionNewUsed },
    { field: brandField, override: { placeholder: 'e.g., Sony, Microsoft, Nintendo' } },
    { field: modelField, override: { placeholder: 'e.g., PS5, Xbox Series X, Switch' } },
    { field: storageField },
    { field: warrantyField },
  ],
};

export const otherElectronics: SubcategoryConfig = {
  name: 'Other Electronics',
  fields: [
    { field: conditionNewUsed },
    { field: brandField },
    { field: modelField },
    { field: warrantyField },
  ],
};

// Export all electronics subcategories as a map
export const electronicsSubcategories: Record<string, SubcategoryConfig> = {
  'Mobile Phones': mobilePhones,
  'Tablets & Accessories': tabletsAccessories,
  'Laptops': laptops,
  'Desktop Computers': desktopComputers,
  'TVs': tvs,
  'Cameras, Camcorders & Accessories': camerasAccessories,
  'Mobile & Tablet Accessories': mobileAccessories,
  'Computer Accessories': computerAccessories,
  'Audio Equipment': audioEquipment,
  'Gaming Consoles': gamingConsoles,
  'Other Electronics': otherElectronics,
};
