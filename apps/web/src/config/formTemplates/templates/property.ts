/**
 * Property Template
 *
 * Single source for every Property subcategory — there is no subcategories/property.ts.
 * Per-subcategory option lists are expressed by declaring a field more than once
 * with disjoint appliesTo sets, so exactly one instance survives per subcategory.
 * Field order below is the canonical Property order; each subcategory renders a
 * subsequence of it.
 *
 * Property has no Condition field at all (you do not buy a "Brand New" house) and
 * no monthlyRent — the core Price input is relabelled "Monthly Rent" on rentals.
 */

import type { FormTemplate } from '../types';
import {
  propertyTypeHousesField,
  propertyTypeHouseRentalsField,
  propertyTypeCommercialField,
  roomTypeField,
  landTypeField,
  totalAreaField,
  areaUnitField,
  builtUpAreaField,
  bedroomsField,
  bathroomsField,
  floorNumberField,
  totalFloorsField,
  furnishingField,
  constructionTypeField,
  buildYearField,
  facingField,
  roadAccessField,
  roadSizeField,
  parkingField,
  parkingCommercialField,
  amenitiesApartmentField,
  amenitiesHouseField,
  amenitiesHouseRentalField,
  amenitiesCommercialField,
  amenitiesRoomField,
  preferredTenantField,
  securityDepositField,
  securityDepositCommercialField,
  availableFromField,
  googleMapsLinkField,
} from '../fields/property';

const APARTMENTS_SALE = ['Apartments For Sale'];
const APARTMENT_RENTALS = ['Apartment Rentals'];
const APARTMENTS = [...APARTMENTS_SALE, ...APARTMENT_RENTALS];
const HOUSES_SALE = ['Houses For Sale'];
const HOUSE_RENTALS = ['House Rentals'];
const COMMERCIAL_SALE = ['Commercial Properties For Sale'];
const COMMERCIAL_RENTALS = ['Commercial Property Rentals'];
const COMMERCIAL = [...COMMERCIAL_SALE, ...COMMERCIAL_RENTALS];
const LAND_SALE = ['Land For Sale'];
const LAND_RENTALS = ['Land Rentals'];
const LAND = [...LAND_SALE, ...LAND_RENTALS];
const ROOMS = ['Room Rentals'];
const BUILDING_RENTALS = [...APARTMENT_RENTALS, ...HOUSE_RENTALS];

export const propertyTemplate: FormTemplate = {
  name: 'Property',
  icon: '🏢🏠',
  fields: [
    { ...propertyTypeHousesField, appliesTo: HOUSES_SALE },
    { ...propertyTypeHouseRentalsField, appliesTo: HOUSE_RENTALS },
    { ...propertyTypeCommercialField, appliesTo: COMMERCIAL },
    { ...roomTypeField, appliesTo: ROOMS },
    { ...totalAreaField, label: 'Built-up Area', labelNe: 'बनेको क्षेत्रफल', appliesTo: APARTMENTS },
    { ...totalAreaField, label: 'Land Area', labelNe: 'जग्गा क्षेत्रफल', appliesTo: [...HOUSES_SALE, ...LAND] },
    { ...totalAreaField, appliesTo: [...HOUSE_RENTALS, ...COMMERCIAL] },
    { ...areaUnitField, appliesTo: [...APARTMENTS, ...HOUSES_SALE, ...HOUSE_RENTALS, ...COMMERCIAL, ...LAND] },
    { ...builtUpAreaField, appliesTo: HOUSES_SALE },
    { ...bedroomsField, appliesTo: [...APARTMENTS, ...HOUSES_SALE, ...HOUSE_RENTALS] },
    { ...bathroomsField, appliesTo: [...APARTMENTS, ...HOUSES_SALE, ...HOUSE_RENTALS] },
    { ...floorNumberField, appliesTo: [...APARTMENTS, ...COMMERCIAL] },
    { ...totalFloorsField, appliesTo: [...APARTMENTS, ...HOUSES_SALE] },
    { ...furnishingField, appliesTo: [...APARTMENTS, ...HOUSE_RENTALS, ...ROOMS] },
    { ...furnishingField, label: 'Fit-out Status', labelNe: 'फिट-आउट स्थिति', appliesTo: COMMERCIAL_RENTALS },
    { ...constructionTypeField, appliesTo: HOUSES_SALE },
    { ...buildYearField, appliesTo: [...APARTMENTS_SALE, ...HOUSES_SALE, ...COMMERCIAL_SALE] },
    { ...facingField, appliesTo: [...APARTMENTS, ...HOUSES_SALE, ...HOUSE_RENTALS] },
    { ...landTypeField, appliesTo: LAND },
    { ...roadAccessField, appliesTo: [...HOUSES_SALE, ...COMMERCIAL, ...LAND] },
    { ...roadSizeField, appliesTo: [...HOUSES_SALE, ...COMMERCIAL_SALE, ...LAND] },
    // Land lists facing after the road details; every other subcategory lists it
    // beside the building attributes above.
    { ...facingField, appliesTo: LAND },
    { ...parkingField, appliesTo: [...APARTMENTS, ...HOUSES_SALE, ...HOUSE_RENTALS] },
    { ...parkingCommercialField, appliesTo: COMMERCIAL },
    { ...preferredTenantField, appliesTo: ROOMS },
    { ...amenitiesApartmentField, appliesTo: APARTMENTS },
    { ...amenitiesHouseField, appliesTo: HOUSES_SALE },
    { ...amenitiesHouseRentalField, appliesTo: HOUSE_RENTALS },
    { ...amenitiesCommercialField, appliesTo: COMMERCIAL },
    { ...amenitiesRoomField, appliesTo: ROOMS },
    { ...preferredTenantField, appliesTo: BUILDING_RENTALS },
    { ...securityDepositField, appliesTo: [...BUILDING_RENTALS, ...ROOMS] },
    { ...securityDepositCommercialField, appliesTo: COMMERCIAL_RENTALS },
    { ...availableFromField, appliesTo: [...BUILDING_RENTALS, ...ROOMS, ...COMMERCIAL_RENTALS, ...LAND_RENTALS] },
    { ...googleMapsLinkField, appliesTo: 'all' },
  ],
};
