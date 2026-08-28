/**
 * General Template (Home & Living, Hobbies Sports & Kids, Business & Industry,
 * Essentials, Agriculture)
 *
 * `brand` is declared at three positions because the clusters genuinely differ:
 * hobbies lead with it, packaged goods put it after the product type, and
 * furniture/machinery close with it.
 */

import type { FormTemplate } from '../types';
import { conditionOptional, brandField, colorField, warrantyField, yearField } from '../fields/common';
import {
  furnitureTypeBedroomField,
  furnitureTypeLivingField,
  furnitureTypeKitchenField,
  furnitureTypeOfficeField,
  furnitureTypeChildrenField,
  materialFurnitureField,
  materialTextileField,
  materialBathroomField,
  materialHouseholdField,
  materialDoorField,
  dimensionsField,
  doorSizeField,
  seatingCapacityField,
  seatingCapacityDiningField,
  productTypeTextilesField,
  productTypeBathroomField,
  productTypeHouseholdDurablesField,
  productTypeDoorsField,
  sportTypeField,
  equipmentTypeField,
  instrumentTypeField,
  itemTypeKidsField,
  ageGroupField,
  mediaTypeField,
  authorPublisherField,
  mediaLanguageField,
  machineryTypeField,
  equipmentTypeMedicalField,
  powerSourceField,
  productTypeOfficeSuppliesField,
  productTypeRawMaterialsField,
  productTypeSafetyField,
  productTypeLicencesField,
  quantityField,
  priceUnitField,
  priceUnitGroceryField,
  priceUnitProduceField,
  priceUnitCropsField,
  productTypeGroceryField,
  productTypeHealthcareField,
  productTypeBabyField,
  productTypeHouseholdConsumablesField,
  productTypeMeatField,
  organicField,
  expiryDateField,
  productWeightField,
  productTypeCropsField,
  productTypeOtherAgricultureField,
  cropTypeField,
  farmingToolTypeField,
} from '../fields/general';

// Home & Living
const BEDROOM = ['Bedroom Furniture'];
const LIVING = ['Living Room Furniture'];
const KITCHEN = ['Kitchen & Dining Furniture'];
const OFFICE_FURNITURE = ['Office & Shop Furniture'];
const CHILDREN_FURNITURE = ["Children's Furniture"];
const TEXTILES = ['Home Textiles & Decoration'];
const BATHROOM = ['Bathroom Products'];
const HOUSEHOLD_ITEMS = ['Household Items'];
const DOORS = ['Doors'];
const FURNITURE = [...BEDROOM, ...LIVING, ...KITCHEN, ...OFFICE_FURNITURE, ...CHILDREN_FURNITURE];

// Hobbies, Sports & Kids
const SPORTS = ['Sports'];
const FITNESS = ['Fitness & Gym'];
const INSTRUMENTS = ['Musical Instruments'];
const KIDS_ITEMS = ["Children's Items"];
const MEDIA = ['Music, Books & Movies'];
const OTHER_HOBBY = ['Other Hobby, Sport & Kids items'];

// Business & Industry
const MACHINERY = ['Industry Machinery & Tools'];
const MEDICAL = ['Medical Equipment & Supplies'];
const OFFICE_SUPPLIES = ['Office Supplies & Stationary'];
const OTHER_BUSINESS = ['Other Business & Industry Items'];
const RAW_MATERIALS = ['Raw Materials & Industrial Supplies'];
const SAFETY = ['Safety & Security'];
const LICENCES = ['Licences, Titles & Tenders'];

// Essentials
const GROCERY = ['Grocery'];
const HEALTHCARE = ['Healthcare'];
const BABY_PRODUCTS = ['Baby Products'];
const HOUSEHOLD_CONSUMABLES = ['Household'];
const PRODUCE = ['Fruits & Vegetables'];
const MEAT = ['Meat & Seafood'];
const OTHER_ESSENTIALS = ['Other Essentials'];

// Agriculture
const CROPS = ['Crops, Seeds & Plants'];
const FARMING_TOOLS = ['Farming Tools & Machinery'];
const OTHER_AGRICULTURE = ['Other Agriculture'];

const HAS_CONDITION = [
  ...FURNITURE, ...TEXTILES, ...BATHROOM, ...HOUSEHOLD_ITEMS, ...DOORS,
  ...SPORTS, ...FITNESS, ...INSTRUMENTS, ...KIDS_ITEMS, ...MEDIA, ...OTHER_HOBBY,
  ...MACHINERY, ...MEDICAL, ...OFFICE_SUPPLIES, ...OTHER_BUSINESS, ...SAFETY,
  ...FARMING_TOOLS,
];

export const generalTemplate: FormTemplate = {
  name: 'General',
  icon: '📦',
  fields: [
    { ...conditionOptional, appliesTo: HAS_CONDITION },
    { ...brandField, placeholder: 'e.g., Nike, Adidas, Yonex, Wilson', appliesTo: SPORTS },
    { ...brandField, placeholder: 'e.g., Decathlon, Kobo, Domyos', appliesTo: FITNESS },
    { ...brandField, placeholder: 'e.g., Yamaha, Gibson, Fender, Roland', appliesTo: INSTRUMENTS },
    { ...brandField, placeholder: 'e.g., Chicco, Fisher-Price, Mothercare', appliesTo: KIDS_ITEMS },
    { ...brandField, appliesTo: OTHER_HOBBY },
    { ...sportTypeField, appliesTo: SPORTS },
    { ...equipmentTypeField, appliesTo: FITNESS },
    { ...instrumentTypeField, appliesTo: INSTRUMENTS },
    { ...itemTypeKidsField, appliesTo: KIDS_ITEMS },
    { ...ageGroupField, appliesTo: KIDS_ITEMS },
    { ...mediaTypeField, appliesTo: MEDIA },
    { ...authorPublisherField, appliesTo: MEDIA },
    { ...mediaLanguageField, appliesTo: MEDIA },
    { ...furnitureTypeBedroomField, appliesTo: BEDROOM },
    { ...furnitureTypeLivingField, appliesTo: LIVING },
    { ...furnitureTypeKitchenField, appliesTo: KITCHEN },
    { ...furnitureTypeOfficeField, appliesTo: OFFICE_FURNITURE },
    { ...furnitureTypeChildrenField, appliesTo: CHILDREN_FURNITURE },
    { ...seatingCapacityField, appliesTo: LIVING },
    { ...seatingCapacityDiningField, appliesTo: KITCHEN },
    { ...productTypeTextilesField, appliesTo: TEXTILES },
    { ...productTypeBathroomField, appliesTo: BATHROOM },
    { ...productTypeHouseholdDurablesField, appliesTo: HOUSEHOLD_ITEMS },
    { ...productTypeDoorsField, appliesTo: DOORS },
    { ...productTypeOfficeSuppliesField, appliesTo: OFFICE_SUPPLIES },
    { ...productTypeRawMaterialsField, appliesTo: RAW_MATERIALS },
    { ...productTypeSafetyField, appliesTo: SAFETY },
    { ...productTypeLicencesField, appliesTo: LICENCES },
    { ...productTypeGroceryField, appliesTo: GROCERY },
    { ...productTypeHealthcareField, appliesTo: HEALTHCARE },
    { ...productTypeBabyField, appliesTo: BABY_PRODUCTS },
    { ...productTypeHouseholdConsumablesField, appliesTo: HOUSEHOLD_CONSUMABLES },
    { ...productTypeMeatField, appliesTo: MEAT },
    { ...productTypeCropsField, appliesTo: CROPS },
    { ...productTypeOtherAgricultureField, appliesTo: OTHER_AGRICULTURE },
    { ...cropTypeField, appliesTo: CROPS },
    // Prams and cots are heavily resold, so Baby Products offers Condition — but
    // after the product type, where the seller has already said what it is.
    { ...ageGroupField, appliesTo: BABY_PRODUCTS },
    { ...conditionOptional, appliesTo: BABY_PRODUCTS },
    { ...machineryTypeField, appliesTo: MACHINERY },
    { ...equipmentTypeMedicalField, appliesTo: MEDICAL },
    { ...farmingToolTypeField, appliesTo: FARMING_TOOLS },
    { ...powerSourceField, appliesTo: [...MACHINERY, ...FARMING_TOOLS] },
    { ...yearField, appliesTo: [...MACHINERY, ...FARMING_TOOLS] },
    { ...materialFurnitureField, appliesTo: FURNITURE },
    { ...materialTextileField, appliesTo: TEXTILES },
    { ...materialBathroomField, appliesTo: BATHROOM },
    { ...materialHouseholdField, appliesTo: HOUSEHOLD_ITEMS },
    { ...materialDoorField, appliesTo: DOORS },
    { ...colorField, label: 'Color/Finish', appliesTo: TEXTILES },
    { ...dimensionsField, appliesTo: FURNITURE },
    { ...doorSizeField, appliesTo: DOORS },
    { ...brandField, appliesTo: [...GROCERY, ...HEALTHCARE, ...HOUSEHOLD_CONSUMABLES] },
    { ...brandField, placeholder: 'e.g., Pampers, Johnson & Johnson, Huggies', appliesTo: BABY_PRODUCTS },
    // Shivam, Hetauda and Panchakanya are real buying decisions on cement and rebar.
    { ...brandField, placeholder: 'e.g., Shivam, Hetauda, Panchakanya', appliesTo: RAW_MATERIALS },
    { ...productWeightField, appliesTo: [...HEALTHCARE, ...HOUSEHOLD_CONSUMABLES] },
    { ...priceUnitGroceryField, appliesTo: [...GROCERY, ...MEAT] },
    { ...priceUnitProduceField, appliesTo: PRODUCE },
    { ...priceUnitCropsField, appliesTo: CROPS },
    { ...priceUnitField, appliesTo: [...RAW_MATERIALS, ...OTHER_ESSENTIALS, ...OTHER_AGRICULTURE] },
    {
      ...quantityField,
      appliesTo: [
        ...OFFICE_FURNITURE, ...DOORS, ...OFFICE_SUPPLIES, ...RAW_MATERIALS,
        ...GROCERY, ...HEALTHCARE, ...BABY_PRODUCTS, ...HOUSEHOLD_CONSUMABLES,
        ...PRODUCE, ...MEAT, ...OTHER_ESSENTIALS, ...CROPS, ...OTHER_AGRICULTURE,
      ],
    },
    { ...organicField, appliesTo: PRODUCE },
    { ...warrantyField, appliesTo: [...MACHINERY, ...MEDICAL, ...SAFETY] },
    { ...expiryDateField, label: 'Valid Until', labelNe: 'मान्य रहने मिति', appliesTo: LICENCES },
    { ...expiryDateField, appliesTo: [...GROCERY, ...HEALTHCARE, ...BABY_PRODUCTS] },
    { ...brandField, placeholder: 'e.g., Local Carpenter, IKEA, Ashley', appliesTo: FURNITURE },
    { ...brandField, placeholder: 'e.g., Bombay Dyeing, Portico, Local', appliesTo: TEXTILES },
    { ...brandField, placeholder: 'e.g., Jaquar, Hindware, Cera', appliesTo: BATHROOM },
    { ...brandField, placeholder: 'e.g., Prestige, Milton, Local', appliesTo: HOUSEHOLD_ITEMS },
    { ...brandField, placeholder: 'e.g., CenturyPly, Greenply, Local', appliesTo: DOORS },
    { ...brandField, placeholder: 'e.g., Caterpillar, John Deere, Bosch, Makita', appliesTo: MACHINERY },
    { ...brandField, placeholder: 'e.g., Philips, GE Healthcare, Siemens', appliesTo: MEDICAL },
    { ...brandField, placeholder: 'e.g., HP, Canon, Camlin, Deli', appliesTo: OFFICE_SUPPLIES },
    { ...brandField, placeholder: 'e.g., Hikvision, CP Plus, Godrej', appliesTo: SAFETY },
    { ...brandField, placeholder: 'e.g., John Deere, Mahindra, Kubota', appliesTo: FARMING_TOOLS },
    { ...brandField, appliesTo: OTHER_BUSINESS },
  ],
};
