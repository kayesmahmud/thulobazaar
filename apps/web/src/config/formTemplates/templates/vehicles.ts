/**
 * Vehicles Template
 *
 * One canonical field order for the parent; each subcategory renders a subsequence
 * of it. A field whose position or option list differs per subcategory is declared
 * more than once with disjoint appliesTo sets.
 */

import type { FormTemplate } from '../types';
import { conditionNewUsed, brandField, modelField, colorField, warrantyField } from '../fields/common';
import {
  vehicleYearField,
  mileageField,
  fuelTypeField,
  fuelTypeMotorbikeField,
  fuelTypeThreeWheelerField,
  fuelTypeBusField,
  fuelTypeVanField,
  transmissionField,
  engineCapacityField,
  ownersField,
  registrationYearField,
  registrationLocationField,
  plateTypeField,
  seatsField,
  seatsVanField,
  bodyTypeField,
  vehicleTypeField,
  vehicleTypeMotorbikeField,
  vehicleTypeThreeWheelerField,
  vehicleTypeTruckField,
  vehicleTypeBusField,
  vehicleTypeVanField,
  vehicleTypeHeavyDutyField,
  payloadCapacityField,
  passengerCapacityField,
  routePermitField,
  operatingHoursField,
  boatTypeField,
  partTypeField,
  compatibleVehicleField,
  rentalPeriodField,
  withDriverField,
  vehicleTypesServicedField,
  serviceOptionsField,
  bicycleTypeField,
  frameSizeField,
  gearsField,
} from '../fields/vehicles';
import { serviceTypeAutoField } from '../fields/services';

const CARS = ['Cars'];
const MOTORBIKES = ['Motorbikes'];
const BICYCLES = ['Bicycles'];
const THREE_WHEELERS = ['Three Wheelers'];
const TRUCKS = ['Trucks'];
const BUSES = ['Buses'];
const VANS = ['Vans'];
const HEAVY_DUTY = ['Heavy Duty'];
const WATER = ['Water Transport'];
const AUTO_PARTS = ['Auto Parts & Accessories'];
const RENTALS = ['Rentals'];
// Field-identical by design; the two subcategories are a merge candidate.
const WORKSHOPS = ['Auto Services', 'Maintenance and Repair'];

const ROAD_VEHICLES = [
  ...CARS, ...MOTORBIKES, ...THREE_WHEELERS, ...TRUCKS, ...BUSES, ...VANS, ...HEAVY_DUTY,
];
const HAS_MILEAGE = [...CARS, ...MOTORBIKES, ...THREE_WHEELERS, ...TRUCKS, ...BUSES, ...VANS];
const HAS_PLATE = HAS_MILEAGE;
const HAS_REGISTRATION_ZONE = [...CARS, ...MOTORBIKES, ...TRUCKS, ...BUSES, ...VANS];

export const vehiclesTemplate: FormTemplate = {
  name: 'Vehicles',
  icon: '🚗🏍️',
  fields: [
    { ...conditionNewUsed, appliesTo: [...ROAD_VEHICLES, ...BICYCLES, ...WATER, ...AUTO_PARTS] },
    { ...vehicleTypeMotorbikeField, appliesTo: MOTORBIKES },
    { ...vehicleTypeThreeWheelerField, appliesTo: THREE_WHEELERS },
    { ...vehicleTypeTruckField, appliesTo: TRUCKS },
    { ...vehicleTypeBusField, appliesTo: BUSES },
    { ...vehicleTypeVanField, appliesTo: VANS },
    { ...vehicleTypeHeavyDutyField, appliesTo: HEAVY_DUTY },
    { ...vehicleTypeField, appliesTo: RENTALS },
    { ...bicycleTypeField, appliesTo: BICYCLES },
    { ...boatTypeField, appliesTo: WATER },
    { ...passengerCapacityField, appliesTo: WATER },
    { ...partTypeField, appliesTo: AUTO_PARTS },
    { ...serviceTypeAutoField, appliesTo: WORKSHOPS },
    { ...vehicleTypesServicedField, appliesTo: WORKSHOPS },
    { ...serviceOptionsField, appliesTo: WORKSHOPS },
    { ...rentalPeriodField, appliesTo: RENTALS },
    { ...withDriverField, appliesTo: RENTALS },
    { ...seatsField, appliesTo: RENTALS },
    { ...transmissionField, appliesTo: RENTALS },
    { ...brandField, placeholder: 'e.g., Toyota, Honda, Hyundai, Suzuki', appliesTo: CARS },
    { ...brandField, placeholder: 'e.g., Honda, Yamaha, Bajaj, TVS', appliesTo: [...MOTORBIKES, ...THREE_WHEELERS] },
    { ...brandField, placeholder: 'e.g., Tata, Ashok Leyland, Eicher, Mahindra', appliesTo: [...TRUCKS, ...BUSES, ...VANS] },
    { ...brandField, placeholder: 'e.g., JCB, Komatsu, Hyundai, CAT, Tata Hitachi', appliesTo: HEAVY_DUTY },
    { ...brandField, placeholder: 'e.g., Yamaha (engine), locally built', appliesTo: WATER },
    { ...brandField, placeholder: 'e.g., Trek, Giant, Hero, Firefox', appliesTo: BICYCLES },
    { ...brandField, placeholder: 'e.g., Bosch, Denso, 3M', appliesTo: AUTO_PARTS },
    { ...brandField, appliesTo: RENTALS },
    { ...frameSizeField, appliesTo: BICYCLES },
    { ...gearsField, appliesTo: BICYCLES },
    { ...compatibleVehicleField, appliesTo: AUTO_PARTS },
    { ...modelField, placeholder: 'e.g., Corolla, Civic, i20, Swift', appliesTo: CARS },
    { ...modelField, placeholder: 'e.g., Pulsar, FZ, Splendor', appliesTo: MOTORBIKES },
    {
      ...modelField,
      appliesTo: [...THREE_WHEELERS, ...TRUCKS, ...BUSES, ...VANS, ...HEAVY_DUTY, ...WATER, ...RENTALS],
    },
    { ...vehicleYearField, appliesTo: [...ROAD_VEHICLES, ...WATER] },
    { ...bodyTypeField, appliesTo: CARS },
    { ...seatsField, appliesTo: CARS },
    { ...seatsVanField, appliesTo: VANS },
    { ...payloadCapacityField, appliesTo: TRUCKS },
    { ...passengerCapacityField, appliesTo: BUSES },
    { ...operatingHoursField, appliesTo: HEAVY_DUTY },
    { ...engineCapacityField, placeholder: 'e.g., 150cc, 250cc, 400cc', appliesTo: MOTORBIKES },
    { ...fuelTypeField, appliesTo: CARS },
    { ...fuelTypeMotorbikeField, appliesTo: MOTORBIKES },
    { ...fuelTypeThreeWheelerField, appliesTo: THREE_WHEELERS },
    { ...fuelTypeBusField, appliesTo: BUSES },
    { ...fuelTypeVanField, appliesTo: VANS },
    { ...transmissionField, appliesTo: [...CARS, ...VANS] },
    { ...engineCapacityField, appliesTo: CARS },
    { ...mileageField, appliesTo: HAS_MILEAGE },
    { ...ownersField, appliesTo: ROAD_VEHICLES },
    { ...registrationYearField, appliesTo: ROAD_VEHICLES },
    { ...registrationLocationField, appliesTo: HAS_REGISTRATION_ZONE },
    { ...plateTypeField, appliesTo: HAS_PLATE },
    { ...routePermitField, appliesTo: BUSES },
    { ...warrantyField, appliesTo: AUTO_PARTS },
    { ...colorField, appliesTo: [...CARS, ...MOTORBIKES] },
  ],
};
