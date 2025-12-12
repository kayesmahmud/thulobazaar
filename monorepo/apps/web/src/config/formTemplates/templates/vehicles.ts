/**
 * Vehicles Template
 */

import type { FormTemplate } from '../types';
import { createConditionField, createBrandField, createModelField, createColorField, CONDITION_OPTIONS } from '../sharedFields';

const MOTORIZED_VEHICLES = ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses'];
const FUEL_VEHICLES = ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses', 'Three Wheelers'];
const TRANSMISSION_VEHICLES = ['Cars', 'Trucks', 'Vans', 'Buses'];

export const vehiclesTemplate: FormTemplate = {
  name: 'Vehicles',
  icon: '🚗🏍️',
  fields: [
    createConditionField(CONDITION_OPTIONS.NEW_RECONDITIONED_USED),
    createBrandField('e.g., Toyota, Honda, Yamaha'),
    createModelField('e.g., Corolla, City, FZ', 'all', true),
    {
      name: 'year',
      label: 'Year of Manufacture',
      type: 'number',
      required: true,
      min: 1980,
      max: 2025,
      placeholder: 'e.g., 2020',
      appliesTo: 'all',
    },
    {
      name: 'mileage',
      label: 'Mileage/Kilometers Driven',
      type: 'number',
      required: false,
      placeholder: 'in km',
      appliesTo: MOTORIZED_VEHICLES,
    },
    {
      name: 'fuelType',
      label: 'Fuel Type',
      type: 'select',
      required: true,
      options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
      appliesTo: FUEL_VEHICLES,
    },
    {
      name: 'transmission',
      label: 'Transmission',
      type: 'select',
      required: true,
      options: ['Manual', 'Automatic', 'Semi-Automatic'],
      appliesTo: TRANSMISSION_VEHICLES,
    },
    {
      name: 'engineCapacity',
      label: 'Engine Capacity (cc)',
      type: 'number',
      required: false,
      placeholder: 'e.g., 1500',
      appliesTo: MOTORIZED_VEHICLES,
    },
    {
      name: 'owners',
      label: 'Number of Owners',
      type: 'select',
      required: false,
      options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
      appliesTo: MOTORIZED_VEHICLES,
    },
    createColorField('e.g., White, Black, Red'),
    {
      name: 'registrationYear',
      label: 'Registration Year',
      type: 'number',
      required: false,
      min: 1980,
      max: 2025,
      appliesTo: MOTORIZED_VEHICLES,
    },
    {
      name: 'registrationLocation',
      label: 'Registration Location',
      type: 'text',
      required: false,
      placeholder: 'e.g., Bagmati, Kathmandu',
      appliesTo: MOTORIZED_VEHICLES,
    },
    // Cars Only
    {
      name: 'seats',
      label: 'Number of Seats',
      type: 'select',
      required: false,
      options: ['2', '4', '5', '7', '8+'],
      appliesTo: ['Cars', 'Vans'],
    },
    {
      name: 'bodyType',
      label: 'Body Type',
      type: 'select',
      required: false,
      options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
      appliesTo: ['Cars'],
    },
    {
      name: 'parkingSensors',
      label: 'Parking Sensors',
      type: 'checkbox',
      required: false,
      appliesTo: ['Cars'],
    },
    {
      name: 'backupCamera',
      label: 'Backup Camera',
      type: 'checkbox',
      required: false,
      appliesTo: ['Cars'],
    },
    // Bicycles
    {
      name: 'bicycleType',
      label: 'Bicycle Type',
      type: 'select',
      required: false,
      options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
      appliesTo: ['Bicycles'],
    },
    {
      name: 'frameSize',
      label: 'Frame Size',
      type: 'text',
      required: false,
      placeholder: 'e.g., Medium, 27.5"',
      appliesTo: ['Bicycles'],
    },
  ],
};
