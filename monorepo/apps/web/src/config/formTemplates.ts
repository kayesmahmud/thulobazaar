/**
 * Form Template Configurations
 * Defines fields for each of the 7 form templates
 *
 * EXACT PORT from old JavaScript version to TypeScript
 * All field names, labels, options, and placeholders preserved exactly
 */

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  appliesTo: 'all' | string[]; // 'all' or array of subcategory names
}

export interface FormTemplate {
  name: string;
  icon: string;
  fields: FormField[];
}

export const FORM_TEMPLATES: Record<string, FormTemplate> = {
  // 📱💻 ELECTRONICS & GADGETS
  electronics: {
    name: 'Electronics & Gadgets',
    icon: '📱💻',
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Brand New', 'Used'],
        appliesTo: 'all'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        placeholder: 'e.g., Apple, Samsung, Dell, HP',
        appliesTo: 'all'
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: false,
        placeholder: 'e.g., iPhone 15 Pro, Galaxy S23',
        appliesTo: 'all'
      },
      {
        name: 'warranty',
        label: 'Warranty',
        type: 'select',
        required: false,
        options: [
          'No Warranty',
          'Under Warranty (< 6 months)',
          'Under Warranty (6-12 months)',
          'Under Warranty (1+ years)'
        ],
        appliesTo: 'all'
      },
      // Mobile Phones Specific
      {
        name: 'storage',
        label: 'Storage Capacity',
        type: 'select',
        required: true,
        options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'],
        appliesTo: ['Mobile Phones', 'Tablets & Accessories']
      },
      {
        name: 'ram',
        label: 'RAM',
        type: 'select',
        required: true,
        options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'],
        appliesTo: ['Mobile Phones', 'Laptops', 'Desktop Computers', 'Tablets & Accessories']
      },
      {
        name: 'batteryHealth',
        label: 'Battery Health',
        type: 'select',
        required: false,
        options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
        appliesTo: ['Mobile Phones', 'Laptops', 'Tablets & Accessories']
      },
      // Laptops/Computers Specific
      {
        name: 'processor',
        label: 'Processor',
        type: 'text',
        required: true,
        placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
        appliesTo: ['Laptops', 'Desktop Computers']
      },
      {
        name: 'graphics',
        label: 'Graphics Card',
        type: 'text',
        required: false,
        placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
        appliesTo: ['Laptops', 'Desktop Computers']
      },
      {
        name: 'screenResolution',
        label: 'Screen Resolution',
        type: 'select',
        required: false,
        options: ['HD (1366x768)', 'Full HD (1920x1080)', '2K', '4K', 'Retina'],
        appliesTo: ['Laptops', 'TVs', 'Desktop Computers']
      },
      // TVs/Cameras Specific
      {
        name: 'screenSize',
        label: 'Screen/Sensor Size',
        type: 'text',
        required: true,
        placeholder: 'e.g., 55 inches, 24MP',
        appliesTo: ['TVs', 'Cameras, Camcorders & Accessories']
      },
      {
        name: 'smartFeatures',
        label: 'Smart Features',
        type: 'multiselect',
        required: false,
        options: ['Smart TV', '4K', 'HDR', 'Android TV', 'WebOS', 'Voice Control'],
        appliesTo: ['TVs']
      },
      {
        name: 'megapixels',
        label: 'Megapixels',
        type: 'number',
        required: false,
        placeholder: 'e.g., 24, 48, 108',
        appliesTo: ['Cameras, Camcorders & Accessories']
      }
    ]
  },

  // 🚗🏍️ VEHICLES
  vehicles: {
    name: 'Vehicles',
    icon: '🚗🏍️',
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Brand New', 'Reconditioned', 'Used'],
        appliesTo: 'all'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: true,
        placeholder: 'e.g., Toyota, Honda, Yamaha',
        appliesTo: 'all'
      },
      {
        name: 'model',
        label: 'Model',
        type: 'text',
        required: true,
        placeholder: 'e.g., Corolla, City, FZ',
        appliesTo: 'all'
      },
      {
        name: 'year',
        label: 'Year of Manufacture',
        type: 'number',
        required: true,
        min: 1980,
        max: 2025,
        placeholder: 'e.g., 2020',
        appliesTo: 'all'
      },
      {
        name: 'mileage',
        label: 'Mileage/Kilometers Driven',
        type: 'number',
        required: false,
        placeholder: 'in km',
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses']
      },
      {
        name: 'fuelType',
        label: 'Fuel Type',
        type: 'select',
        required: true,
        options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'],
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses', 'Three Wheelers']
      },
      {
        name: 'transmission',
        label: 'Transmission',
        type: 'select',
        required: true,
        options: ['Manual', 'Automatic', 'Semi-Automatic'],
        appliesTo: ['Cars', 'Trucks', 'Vans', 'Buses']
      },
      {
        name: 'engineCapacity',
        label: 'Engine Capacity (cc)',
        type: 'number',
        required: false,
        placeholder: 'e.g., 1500',
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses']
      },
      {
        name: 'owners',
        label: 'Number of Owners',
        type: 'select',
        required: false,
        options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses']
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., White, Black, Red',
        appliesTo: 'all'
      },
      {
        name: 'registrationYear',
        label: 'Registration Year',
        type: 'number',
        required: false,
        min: 1980,
        max: 2025,
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses']
      },
      {
        name: 'registrationLocation',
        label: 'Registration Location',
        type: 'text',
        required: false,
        placeholder: 'e.g., Bagmati, Kathmandu',
        appliesTo: ['Cars', 'Motorbikes', 'Trucks', 'Vans', 'Buses']
      },
      // Cars Only
      {
        name: 'seats',
        label: 'Number of Seats',
        type: 'select',
        required: false,
        options: ['2', '4', '5', '7', '8+'],
        appliesTo: ['Cars', 'Vans']
      },
      {
        name: 'bodyType',
        label: 'Body Type',
        type: 'select',
        required: false,
        options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup', 'Van'],
        appliesTo: ['Cars']
      },
      {
        name: 'parkingSensors',
        label: 'Parking Sensors',
        type: 'checkbox',
        required: false,
        appliesTo: ['Cars']
      },
      {
        name: 'backupCamera',
        label: 'Backup Camera',
        type: 'checkbox',
        required: false,
        appliesTo: ['Cars']
      },
      // Bicycles
      {
        name: 'bicycleType',
        label: 'Bicycle Type',
        type: 'select',
        required: false,
        options: ['Mountain Bike', 'Road Bike', 'Hybrid', 'Electric', 'Kids Bike'],
        appliesTo: ['Bicycles']
      },
      {
        name: 'frameSize',
        label: 'Frame Size',
        type: 'text',
        required: false,
        placeholder: 'e.g., Medium, 27.5"',
        appliesTo: ['Bicycles']
      }
    ]
  },

  // 🏢🏠 PROPERTY
  property: {
    name: 'Property',
    icon: '🏢🏠',
    fields: [
      {
        name: 'totalArea',
        label: 'Total Area',
        type: 'number',
        required: true,
        placeholder: 'Enter area',
        appliesTo: 'all'
      },
      {
        name: 'areaUnit',
        label: 'Area Unit',
        type: 'select',
        required: true,
        options: ['sq ft', 'aana', 'ropani', 'sq meter'],
        appliesTo: 'all'
      },
      // For Apartments/Houses
      {
        name: 'bedrooms',
        label: 'Bedrooms',
        type: 'select',
        required: true,
        options: ['Studio', '1', '2', '3', '4', '5', '6+'],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals',
          'Room Rentals'
        ]
      },
      {
        name: 'bathrooms',
        label: 'Bathrooms',
        type: 'select',
        required: true,
        options: ['1', '2', '3', '4', '5+'],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals'
        ]
      },
      {
        name: 'furnishing',
        label: 'Furnishing Status',
        type: 'select',
        required: false,
        options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals',
          'Room Rentals'
        ]
      },
      {
        name: 'floorNumber',
        label: 'Floor Number',
        type: 'number',
        required: false,
        placeholder: 'e.g., 5',
        appliesTo: ['Apartments For Sale', 'Apartment Rentals']
      },
      {
        name: 'totalFloors',
        label: 'Total Floors in Building',
        type: 'number',
        required: false,
        placeholder: 'e.g., 12',
        appliesTo: ['Apartments For Sale', 'Apartment Rentals']
      },
      {
        name: 'parking',
        label: 'Number of Parking Spaces',
        type: 'select',
        required: false,
        options: ['None', '1', '2', '3', '4+'],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals',
          'Commercial Properties For Sale',
          'Commercial Property Rentals'
        ]
      },
      {
        name: 'facing',
        label: 'Facing Direction',
        type: 'select',
        required: false,
        options: [
          'North',
          'South',
          'East',
          'West',
          'North-East',
          'North-West',
          'South-East',
          'South-West'
        ],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals'
        ]
      },
      {
        name: 'propertyAge',
        label: 'Property Age',
        type: 'select',
        required: false,
        options: [
          'Under Construction',
          '0-1 years',
          '1-5 years',
          '5-10 years',
          '10-20 years',
          '20+ years'
        ],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals'
        ]
      },
      {
        name: 'amenities',
        label: 'Amenities',
        type: 'multiselect',
        required: false,
        options: [
          'Lift/Elevator',
          'Power Backup',
          'Water Supply',
          'Security/Gated',
          'Gym',
          'Swimming Pool',
          'Garden',
          'Playground',
          'Club House',
          'Visitor Parking'
        ],
        appliesTo: [
          'Apartments For Sale',
          'Apartment Rentals',
          'Houses For Sale',
          'House Rentals'
        ]
      },
      // Land Only
      {
        name: 'landType',
        label: 'Land Type',
        type: 'select',
        required: false,
        options: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'],
        appliesTo: ['Land For Sale', 'Land Rentals']
      },
      {
        name: 'roadAccess',
        label: 'Road Access',
        type: 'select',
        required: false,
        options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
        appliesTo: ['Land For Sale', 'Land Rentals']
      },
      {
        name: 'roadWidth',
        label: 'Road Width',
        type: 'number',
        required: false,
        placeholder: 'in feet',
        appliesTo: ['Land For Sale', 'Land Rentals']
      },
      // For Rent Only
      {
        name: 'monthlyRent',
        label: 'Monthly Rent',
        type: 'number',
        required: true,
        placeholder: 'in NPR',
        appliesTo: [
          'Apartment Rentals',
          'House Rentals',
          'Room Rentals',
          'Commercial Property Rentals',
          'Land Rentals'
        ]
      },
      {
        name: 'securityDeposit',
        label: 'Security Deposit',
        type: 'number',
        required: false,
        placeholder: 'in NPR',
        appliesTo: [
          'Apartment Rentals',
          'House Rentals',
          'Room Rentals',
          'Commercial Property Rentals'
        ]
      },
      {
        name: 'availableFrom',
        label: 'Available From',
        type: 'select',
        required: false,
        options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
        appliesTo: [
          'Apartment Rentals',
          'House Rentals',
          'Room Rentals',
          'Commercial Property Rentals'
        ]
      }
    ]
  },

  // 👔👗 FASHION & APPAREL
  fashion: {
    name: 'Fashion & Apparel',
    icon: '👔👗',
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: true,
        options: ['Brand New', 'Used'],
        appliesTo: 'all'
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
        appliesTo: [
          'Shirts & T-Shirts',
          'Pants',
          'Traditional Clothing',
          'Jacket & Coat',
          'Traditional Wear',
          'Western Wear',
          'Winter Wear'
        ]
      },
      {
        name: 'color',
        label: 'Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Black, White, Red',
        appliesTo: 'all'
      },
      // Clothing Specific
      {
        name: 'clothingType',
        label: 'Clothing Type',
        type: 'select',
        required: true,
        options: [
          'Shirt',
          'T-Shirt',
          'Pants',
          'Jeans',
          'Dress',
          'Saree',
          'Kurta',
          'Jacket',
          'Coat',
          'Sweater',
          'Skirt',
          'Shorts'
        ],
        appliesTo: [
          'Shirts & T-Shirts',
          'Pants',
          'Traditional Clothing',
          'Jacket & Coat',
          'Traditional Wear',
          'Western Wear',
          'Winter Wear'
        ]
      },
      {
        name: 'fitType',
        label: 'Fit Type',
        type: 'select',
        required: false,
        options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
        appliesTo: [
          'Shirts & T-Shirts',
          'Pants',
          'Jeans',
          'Traditional Clothing',
          'Jacket & Coat',
          'Western Wear'
        ]
      },
      {
        name: 'sleeveType',
        label: 'Sleeve Type',
        type: 'select',
        required: false,
        options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
        appliesTo: ['Shirts & T-Shirts', 'Traditional Clothing', 'Traditional Wear', 'Western Wear']
      },
      // Footwear Specific
      {
        name: 'footwearType',
        label: 'Footwear Type',
        type: 'select',
        required: true,
        options: [
          'Sneakers',
          'Formal Shoes',
          'Sandals',
          'Slippers',
          'Boots',
          'Heels',
          'Flats',
          'Sports Shoes'
        ],
        appliesTo: ['Footwear']
      },
      {
        name: 'shoeSize',
        label: 'Shoe Size',
        type: 'number',
        required: true,
        min: 32,
        max: 45,
        placeholder: 'e.g., 38, 40, 42',
        appliesTo: ['Footwear']
      },
      // Accessories/Watches
      {
        name: 'watchType',
        label: 'Watch Type',
        type: 'select',
        required: false,
        options: ['Analog', 'Digital', 'Smart Watch', 'Chronograph'],
        appliesTo: ['Watches', 'Jewellery & Watches']
      },
      {
        name: 'strapMaterial',
        label: 'Strap Material',
        type: 'select',
        required: false,
        options: ['Leather', 'Metal', 'Rubber', 'Fabric'],
        appliesTo: ['Watches', 'Jewellery & Watches']
      }
    ]
  },

  // 🐾 PETS & ANIMALS
  pets: {
    name: 'Pets & Animals',
    icon: '🐾',
    fields: [
      {
        name: 'animalType',
        label: 'Animal Type',
        type: 'select',
        required: true,
        options: [
          'Dog',
          'Cat',
          'Bird',
          'Fish',
          'Rabbit',
          'Hamster',
          'Guinea Pig',
          'Cow',
          'Buffalo',
          'Goat',
          'Chicken',
          'Duck',
          'Other'
        ],
        appliesTo: ['Pets', 'Farm Animals', 'Other Pets & Animals']
      },
      {
        name: 'breed',
        label: 'Breed',
        type: 'text',
        required: false,
        placeholder: 'e.g., Golden Retriever, Persian Cat',
        appliesTo: ['Pets', 'Farm Animals', 'Other Pets & Animals']
      },
      {
        name: 'age',
        label: 'Age',
        type: 'select',
        required: true,
        options: ['0-3 months', '3-6 months', '6-12 months', '1-2 years', '2-5 years', '5+ years'],
        appliesTo: ['Pets', 'Farm Animals', 'Other Pets & Animals']
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: false,
        options: ['Male', 'Female', 'Unknown'],
        appliesTo: ['Pets', 'Farm Animals', 'Other Pets & Animals']
      },
      {
        name: 'vaccination',
        label: 'Vaccination Status',
        type: 'select',
        required: true,
        options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
        appliesTo: ['Pets', 'Farm Animals']
      },
      {
        name: 'papers',
        label: 'Pet Papers/Documents',
        type: 'select',
        required: false,
        options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
        appliesTo: ['Pets']
      },
      {
        name: 'color',
        label: 'Color/Coat Color',
        type: 'text',
        required: false,
        placeholder: 'e.g., Brown, Black, White',
        appliesTo: ['Pets', 'Farm Animals']
      },
      {
        name: 'weight',
        label: 'Weight',
        type: 'number',
        required: false,
        placeholder: 'in kg',
        appliesTo: ['Pets', 'Farm Animals']
      },
      {
        name: 'trained',
        label: 'Trained',
        type: 'select',
        required: false,
        options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
        appliesTo: ['Pets']
      },
      {
        name: 'friendlyWith',
        label: 'Friendly With',
        type: 'multiselect',
        required: false,
        options: ['Children', 'Other Dogs', 'Cats', 'Strangers'],
        appliesTo: ['Pets']
      },
      // For Pet Accessories
      {
        name: 'productType',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Food', 'Toy', 'Cage', 'Leash', 'Collar', 'Grooming', 'Medicine', 'Bedding'],
        appliesTo: ['Pet & Animal Accessories']
      },
      {
        name: 'suitableFor',
        label: 'Suitable For',
        type: 'select',
        required: false,
        options: ['Dogs', 'Cats', 'Birds', 'Fish', 'All Pets'],
        appliesTo: ['Pet & Animal Accessories', 'Pet & Animal food']
      }
    ]
  },

  // 🔧💼 SERVICES & JOBS
  services: {
    name: 'Services & Jobs',
    icon: '🔧💼',
    fields: [
      // For Services
      {
        name: 'experience',
        label: 'Experience',
        type: 'select',
        required: false,
        options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
        appliesTo: [
          'Servicing & Repair',
          'IT Services',
          'Professional Services',
          'Gym & Fitness',
          'Beauty Services'
        ]
      },
      {
        name: 'availability',
        label: 'Availability',
        type: 'multiselect',
        required: false,
        options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'On-Call'],
        appliesTo: [
          'Servicing & Repair',
          'IT Services',
          'Professional Services',
          'Domestic & Daycare Services'
        ]
      },
      {
        name: 'serviceLocation',
        label: 'Service Location',
        type: 'select',
        required: false,
        options: ['At Customer Location', 'At Provider Location', 'Remote/Online'],
        appliesTo: [
          'Servicing & Repair',
          'IT Services',
          'Professional Services'
        ]
      },
      {
        name: 'physicalServiceLocation',
        label: 'Service Location',
        type: 'select',
        required: false,
        options: ['At Customer Location', 'At Provider Location'],
        appliesTo: ['Gym & Fitness', 'Beauty Services']
      },
      {
        name: 'massageLocation',
        label: 'Service Location',
        type: 'select',
        required: true,
        options: ['At Home', 'At Massage Parlour'],
        appliesTo: ['Body Massage']
      },
      {
        name: 'languages',
        label: 'Languages Known',
        type: 'multiselect',
        required: false,
        options: ['English', 'Nepali', 'Hindi', 'Newari', 'Other'],
        appliesTo: ['Tuition', 'Professional Services']
      },
      // For Jobs
      {
        name: 'experienceRequired',
        label: 'Experience Required',
        type: 'select',
        required: false,
        options: ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
        appliesTo: [
          'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
          'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
          'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
          'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
          'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
          'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
          'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
          'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
          'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
          'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
          'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
          'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
          'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other'
        ]
      },
      {
        name: 'salaryRange',
        label: 'Salary Range',
        type: 'select',
        required: false,
        options: [
          'Below 20,000',
          '20,000-30,000',
          '30,000-50,000',
          '50,000-1,00,000',
          'Above 1,00,000',
          'Negotiable'
        ],
        appliesTo: [
          'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
          'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
          'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
          'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
          'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
          'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
          'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
          'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
          'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
          'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
          'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
          'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
          'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other'
        ]
      },
      {
        name: 'educationRequired',
        label: 'Education Required',
        type: 'select',
        required: false,
        options: ['No Formal Education', 'SLC/SEE', '+2', "Bachelor's", "Master's", 'PhD'],
        appliesTo: [
          'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
          'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
          'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
          'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
          'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
          'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
          'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
          'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
          'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
          'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
          'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
          'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
          'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other'
        ]
      },
      {
        name: 'companyName',
        label: 'Company Name',
        type: 'text',
        required: false,
        placeholder: 'Enter company name',
        appliesTo: [
          'Accountant', 'Beautician', 'Business Analyst', 'Chef', 'Collection & Recovery Agents',
          'Construction Worker', 'Content Writer', 'Counsellor', 'Customer Service Executive',
          'Customer Support Manager', 'Delivery Rider', 'Designer', 'Digital Marketing Executive',
          'Digital Marketing Manager', 'Doctor', 'Driver', 'Electrician', 'Engineer', 'Event Planner',
          'Fire Fighter', 'Flight Attendant', 'Florist', 'Gardener', 'Garments Worker',
          'Government Jobs', 'Hospitality Executive', 'House Keeper', 'HR Executive', 'HR Manager',
          'Interior Designer', 'Journalist', 'Lab Assistant', 'Maid', 'Management Trainee',
          'Market Research Analyst', 'Marketing Executive', 'Marketing Manager', 'Mechanic',
          'Medical Representative', 'Merchandiser', 'Nurse', 'Office Admin', 'Operator',
          'Pharmacist', 'Photographer', 'Product Sourcing Executive', 'Production Executive',
          'Public Relations Officer', 'Purchase Officer', 'Quality Checker', 'Quality Controller',
          'Sales Executive', 'Sales Manager Field', 'Security Guard', 'SEO Specialist',
          'Social Media Presenter', 'Software Engineer', 'Supervisor', 'Teacher', 'Videographer', 'Other'
        ]
      },
      // For Education (Tuition)
      {
        name: 'subjects',
        label: 'Subject',
        type: 'multiselect',
        required: true,
        options: [
          'Math',
          'Science',
          'English',
          'Nepali',
          'Social Studies',
          'Computer',
          'Accounts',
          'All Subjects'
        ],
        appliesTo: ['Tuition']
      },
      {
        name: 'gradeLevel',
        label: 'Grade/Level',
        type: 'multiselect',
        required: true,
        options: ['Primary (1-5)', 'Secondary (6-10)', '+2/Intermediate', 'Bachelor', 'Master'],
        appliesTo: ['Tuition']
      },
      {
        name: 'modeOfTeaching',
        label: 'Mode of Teaching',
        type: 'select',
        required: false,
        options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
        appliesTo: ['Tuition']
      },
      // For Overseas Jobs
      {
        name: 'country',
        label: 'Country',
        type: 'select',
        required: true,
        options: [
          'Bulgaria',
          'Croatia',
          'Serbia',
          'Saudi Arabia',
          'UAE',
          'Qatar',
          'Malaysia',
          'Singapore',
          'Japan',
          'South Korea'
        ],
        appliesTo: [
          'Bulgaria',
          'Croatia',
          'Serbia',
          'Saudi Arabia',
          'UAE',
          'Qatar',
          'Malaysia',
          'Singapore'
        ]
      },
      {
        name: 'jobPosition',
        label: 'Job Position',
        type: 'text',
        required: true,
        placeholder: 'e.g., Construction Worker, Chef, Driver',
        appliesTo: [
          'Bulgaria',
          'Croatia',
          'Serbia',
          'Saudi Arabia',
          'UAE',
          'Qatar',
          'Malaysia',
          'Singapore'
        ]
      },
      {
        name: 'visaType',
        label: 'Visa Type',
        type: 'select',
        required: false,
        options: ['Work Visa', 'Employment Visa', 'Sponsored'],
        appliesTo: [
          'Bulgaria',
          'Croatia',
          'Serbia',
          'Saudi Arabia',
          'UAE',
          'Qatar',
          'Malaysia',
          'Singapore'
        ]
      }
    ]
  },

  // 📦 GENERAL (Home & Living, Hobbies, Business, Essentials, Agriculture)
  general: {
    name: 'General',
    icon: '📦',
    fields: [
      {
        name: 'condition',
        label: 'Condition',
        type: 'select',
        required: false,
        options: ['Brand New', 'Used'],
        appliesTo: 'all'
      },
      {
        name: 'brand',
        label: 'Brand',
        type: 'text',
        required: false,
        placeholder: 'e.g., IKEA, Nike, Canon',
        appliesTo: 'all'
      },
      // For Furniture (Home & Living)
      {
        name: 'furnitureType',
        label: 'Furniture Type',
        type: 'select',
        required: true,
        options: ['Bed', 'Sofa', 'Table', 'Chair', 'Wardrobe', 'Shelf', 'Desk', 'Cabinet', 'Dining Set', 'Other'],
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'material',
        label: 'Material',
        type: 'select',
        required: false,
        options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Leather', 'Fabric', 'Mixed Materials'],
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'color',
        label: 'Color/Finish',
        type: 'text',
        required: false,
        placeholder: 'e.g., Brown, White, Black, Walnut',
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'dimensions',
        label: 'Dimensions (L × W × H)',
        type: 'text',
        required: false,
        placeholder: 'e.g., 200cm × 100cm × 80cm',
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'assemblyRequired',
        label: 'Assembly Required',
        type: 'select',
        required: false,
        options: ['Yes - Assembly Required', 'No - Ready to Use', 'Partial Assembly'],
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'seatingCapacity',
        label: 'Seating Capacity',
        type: 'select',
        required: false,
        options: ['1 Person', '2-3 People', '4-6 People', '6-8 People', '8+ People'],
        appliesTo: [
          'Living Room Furniture',
          'Kitchen & Dining Furniture',
          'Office & Shop Furniture'
        ]
      },
      {
        name: 'storage',
        label: 'Storage Available',
        type: 'select',
        required: false,
        options: ['Yes', 'No'],
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          "Children's Furniture"
        ]
      },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        required: false,
        options: ['Modern', 'Traditional', 'Vintage', 'Minimalist', 'Contemporary', 'Rustic', 'Industrial'],
        appliesTo: [
          'Bedroom Furniture',
          'Living Room Furniture',
          'Office & Shop Furniture',
          'Kitchen & Dining Furniture',
          "Children's Furniture"
        ]
      },
      // For Sports/Musical Instruments
      {
        name: 'sportType',
        label: 'Sport/Instrument Type',
        type: 'text',
        required: false,
        placeholder: 'e.g., Cricket, Football, Guitar',
        appliesTo: ['Sports', 'Musical Instruments', 'Fitness & Gym']
      },
      // For Business/Industry
      {
        name: 'machineryType',
        label: 'Machinery Type',
        type: 'select',
        required: true,
        options: [
          'Construction',
          'Manufacturing',
          'Agricultural',
          'Office Equipment',
          'Medical Equipment'
        ],
        appliesTo: ['Industry Machinery & Tools', 'Medical Equipment & Supplies']
      },
      {
        name: 'powerSource',
        label: 'Power Source',
        type: 'select',
        required: false,
        options: ['Electric', 'Manual', 'Diesel', 'Petrol', 'Battery'],
        appliesTo: ['Industry Machinery & Tools']
      },
      // For Essentials/Grocery
      {
        name: 'productType',
        label: 'Product Type',
        type: 'select',
        required: true,
        options: ['Food Item', 'Household Item', 'Baby Product', 'Healthcare'],
        appliesTo: [
          'Grocery',
          'Healthcare',
          'Other Essentials',
          'Household',
          'Baby Products',
          'Fruits & Vegetables',
          'Meat & Seafood'
        ]
      },
      {
        name: 'quantity',
        label: 'Quantity Available',
        type: 'number',
        required: false,
        placeholder: 'Enter quantity',
        appliesTo: [
          'Grocery',
          'Healthcare',
          'Other Essentials',
          'Household',
          'Baby Products',
          'Fruits & Vegetables',
          'Meat & Seafood'
        ]
      },
      {
        name: 'expiryDate',
        label: 'Expiry Date',
        type: 'date',
        required: false,
        appliesTo: ['Grocery', 'Healthcare', 'Fruits & Vegetables', 'Meat & Seafood']
      },
      // For Agriculture
      {
        name: 'cropType',
        label: 'Crop/Plant Type',
        type: 'text',
        required: true,
        placeholder: 'e.g., Rice, Wheat, Tomato',
        appliesTo: ['Crops, Seeds & Plants']
      },
      {
        name: 'farmingToolType',
        label: 'Farming Tool Type',
        type: 'select',
        required: false,
        options: ['Tractor', 'Plough', 'Harvester', 'Sprayer', 'Hand Tool'],
        appliesTo: ['Farming Tools & Machinery']
      }
    ]
  }
};

/**
 * Helper function to get template for a category
 */
export function getTemplateForCategory(categoryName: string, parentCategoryName: string): string {
  const templateMap: Record<string, string> = {
    'Mobiles': 'electronics',
    'Electronics': 'electronics',
    'Vehicles': 'vehicles',
    'Property': 'property',
    "Men's Fashion & Grooming": 'fashion',
    "Women's Fashion & Beauty": 'fashion',
    'Pets & Animals': 'pets',
    'Services': 'services',
    'Jobs': 'services',
    'Education': 'services',
    'Overseas Jobs': 'services',
    'Home & Living': 'general',
    'Hobbies, Sports & Kids': 'general',
    'Business & Industry': 'general',
    'Essentials': 'general',
    'Agriculture': 'general'
  };

  return templateMap[parentCategoryName] || 'general';
}

/**
 * Helper function to get applicable fields for a subcategory
 */
export function getApplicableFields(templateName: string, subcategoryName: string): FormField[] {
  const template = FORM_TEMPLATES[templateName];
  if (!template) return [];

  return template.fields.filter(field => {
    if (field.appliesTo === 'all') return true;
    if (Array.isArray(field.appliesTo)) {
      return field.appliesTo.includes(subcategoryName);
    }
    return false;
  });
}
