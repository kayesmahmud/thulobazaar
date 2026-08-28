/**
 * Electronics & Mobiles Template
 *
 * Order is: condition → type classifier → brand → model → specs → warranty last.
 * Warranty used to sit third, splitting identity from specs on every subcategory.
 */

import type { FormTemplate } from '../types';
import { conditionNewUsed, brandField, modelField, warrantyField } from '../fields/common';
import {
  storageField,
  storageLaptopField,
  storageDesktopField,
  storageConsoleField,
  ramPhoneField,
  ramComputerField,
  batteryHealthField,
  processorField,
  graphicsField,
  screenResolutionField,
  screenSizeTvField,
  screenSizeLaptopField,
  smartFeaturesField,
  megapixelsField,
  sensorSizeField,
  cameraTypeField,
  accessoryTypeMobileField,
  accessoryTypeTvField,
  accessoryTypeComputerField,
  audioTypeField,
  gamingItemTypeField,
  wearableTypeField,
  compatibilityField,
  connectivityField,
  monitorIncludedField,
  boxAndBillField,
  applianceTypeAcField,
  applianceTypeHomeField,
  capacityTonField,
  machineTypeField,
  networkOperatorField,
  numberTypeField,
  simTypeField,
  brandPhoneField,
  brandLaptopField,
  brandTvField,
  brandAcField,
  brandHomeApplianceField,
} from '../fields/electronics';
import { serviceTypeMobileRepairField, serviceLocationField, experienceField } from '../fields/services';

const PHONES = ['Mobile Phones'];
const PHONE_ACCESSORIES = ['Mobile Phone Accessories'];
const PHONE_SERVICES = ['Mobile Phone Services'];
const SIM_CARDS = ['SIM Cards'];
const WEARABLES = ['Wearables'];
const TABLETS = ['Tablets & Accessories'];
const LAPTOPS = ['Laptops'];
const DESKTOPS = ['Desktop Computers'];
const TVS = ['TVs'];
const TV_ACCESSORIES = ['TV & Video Accessories'];
const CAMERAS = ['Cameras, Camcorders & Accessories'];
const COMPUTER_ACCESSORIES = ['Laptop & Computer Accessories'];
const AUDIO = ['Audio & Sound Systems'];
const CONSOLES = ['Video Game Consoles & Accessories'];
const ACS = ['ACs & Home Electronics'];
const HOME_APPLIANCES = ['Home Appliances'];
const PHOTOCOPIERS = ['Photocopiers'];
const OTHER = ['Other Electronics'];

const COMPUTERS = [...LAPTOPS, ...DESKTOPS];
// Every subcategory except the two that describe a service or a phone number.
const PRODUCTS = [
  ...PHONES, ...PHONE_ACCESSORIES, ...WEARABLES, ...TABLETS, ...COMPUTERS, ...TVS,
  ...TV_ACCESSORIES, ...CAMERAS, ...COMPUTER_ACCESSORIES, ...AUDIO, ...CONSOLES,
  ...ACS, ...HOME_APPLIANCES, ...PHOTOCOPIERS, ...OTHER,
];

export const electronicsTemplate: FormTemplate = {
  name: 'Electronics & Gadgets',
  icon: '📱💻',
  fields: [
    { ...conditionNewUsed, appliesTo: PRODUCTS },
    { ...accessoryTypeMobileField, appliesTo: PHONE_ACCESSORIES },
    { ...accessoryTypeTvField, appliesTo: TV_ACCESSORIES },
    { ...accessoryTypeComputerField, appliesTo: COMPUTER_ACCESSORIES },
    { ...wearableTypeField, appliesTo: WEARABLES },
    { ...cameraTypeField, appliesTo: CAMERAS },
    { ...audioTypeField, appliesTo: AUDIO },
    { ...gamingItemTypeField, appliesTo: CONSOLES },
    { ...applianceTypeAcField, appliesTo: ACS },
    { ...applianceTypeHomeField, appliesTo: HOME_APPLIANCES },
    { ...machineTypeField, appliesTo: PHOTOCOPIERS },
    // A phone number has no condition, brand, model or warranty.
    { ...networkOperatorField, appliesTo: SIM_CARDS },
    { ...numberTypeField, appliesTo: SIM_CARDS },
    { ...simTypeField, appliesTo: SIM_CARDS },
    // A repair shop is not a brand either.
    { ...serviceTypeMobileRepairField, appliesTo: PHONE_SERVICES },
    { ...serviceLocationField, appliesTo: PHONE_SERVICES },
    { ...experienceField, appliesTo: PHONE_SERVICES },
    { ...brandPhoneField, appliesTo: PHONES },
    { ...brandLaptopField, appliesTo: COMPUTERS },
    { ...brandTvField, appliesTo: TVS },
    { ...brandAcField, appliesTo: ACS },
    { ...brandHomeApplianceField, appliesTo: HOME_APPLIANCES },
    { ...brandField, placeholder: 'e.g., Spigen, Anker, Samsung, Apple', appliesTo: PHONE_ACCESSORIES },
    { ...brandField, placeholder: 'e.g., Apple, Samsung, Fitbit, Garmin, Boat', appliesTo: WEARABLES },
    { ...brandField, placeholder: 'e.g., Apple, Samsung, Huawei, Lenovo', appliesTo: TABLETS },
    { ...brandField, placeholder: 'e.g., Dish Home, WorldLink, Xiaomi, JBL', appliesTo: TV_ACCESSORIES },
    { ...brandField, placeholder: 'e.g., Canon, Nikon, Sony, GoPro', appliesTo: CAMERAS },
    { ...brandField, placeholder: 'e.g., Logitech, HP, Asus, TP-Link', appliesTo: COMPUTER_ACCESSORIES },
    { ...brandField, placeholder: 'e.g., Sony, Bose, JBL, Sennheiser', appliesTo: AUDIO },
    { ...brandField, placeholder: 'e.g., Sony, Microsoft, Nintendo', appliesTo: CONSOLES },
    { ...brandField, placeholder: 'e.g., Canon, Epson, Brother, Xerox, HP', appliesTo: PHOTOCOPIERS },
    { ...brandField, appliesTo: OTHER },
    { ...modelField, placeholder: 'e.g., iPhone 15 Pro, Galaxy S24', appliesTo: PHONES },
    { ...modelField, placeholder: 'e.g., MacBook Pro, ThinkPad X1', appliesTo: COMPUTERS },
    { ...modelField, placeholder: 'e.g., iPad Pro, Galaxy Tab', appliesTo: TABLETS },
    { ...modelField, placeholder: 'e.g., Apple Watch Series 9, Galaxy Watch 6', appliesTo: WEARABLES },
    { ...modelField, placeholder: 'e.g., EOS R5, A7 IV', appliesTo: CAMERAS },
    {
      ...modelField,
      appliesTo: [...TVS, ...TV_ACCESSORIES, ...COMPUTER_ACCESSORIES, ...AUDIO, ...CONSOLES, ...ACS, ...HOME_APPLIANCES, ...PHOTOCOPIERS, ...OTHER],
    },
    { ...storageField, appliesTo: [...PHONES, ...TABLETS] },
    { ...processorField, appliesTo: COMPUTERS },
    { ...ramPhoneField, appliesTo: PHONES },
    { ...ramComputerField, appliesTo: COMPUTERS },
    { ...storageLaptopField, appliesTo: LAPTOPS },
    { ...storageDesktopField, appliesTo: DESKTOPS },
    { ...storageConsoleField, appliesTo: CONSOLES },
    { ...graphicsField, appliesTo: COMPUTERS },
    { ...screenSizeLaptopField, appliesTo: LAPTOPS },
    { ...screenSizeTvField, appliesTo: TVS },
    { ...screenResolutionField, appliesTo: TVS },
    { ...smartFeaturesField, appliesTo: TVS },
    { ...connectivityField, appliesTo: TABLETS },
    { ...compatibilityField, appliesTo: WEARABLES },
    { ...sensorSizeField, appliesTo: CAMERAS },
    { ...megapixelsField, appliesTo: CAMERAS },
    { ...capacityTonField, appliesTo: ACS },
    { ...monitorIncludedField, appliesTo: DESKTOPS },
    { ...batteryHealthField, appliesTo: [...PHONES, ...LAPTOPS, ...TABLETS] },
    { ...boxAndBillField, appliesTo: PHONES },
    { ...warrantyField, appliesTo: PRODUCTS },
  ],
};
