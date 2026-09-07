// Form Template Service
//
// Provides subcategory-specific form field configurations for the post ad flow.
// Mirrors web: apps/web/src/config/formTemplates/
//
// Condition is NOT declared here as a rule of its own — it is governed by
// [getCategoryPolicy] (category_policy.dart). See [getApplicableFields].

import 'package:mobile/features/post_ad/services/category_policy.dart';

enum FieldType { text, number, select, multiselect, checkbox, date }

class FormFieldModel {
  final String name;
  final String label;
  final String? labelNe;
  final FieldType type;
  final bool required;
  final String? placeholder;
  final String? placeholderNe;
  final List<String>? options;
  final List<String>? optionsNe;
  final double? min;
  final double? max;

  const FormFieldModel({
    required this.name,
    required this.label,
    this.labelNe,
    required this.type,
    this.required = false,
    this.placeholder,
    this.placeholderNe,
    this.options,
    this.optionsNe,
    this.min,
    this.max,
  });

  FormFieldModel copyWith({bool? required}) {
    return FormFieldModel(
      name: name,
      label: label,
      labelNe: labelNe,
      type: type,
      required: required ?? this.required,
      placeholder: placeholder,
      placeholderNe: placeholderNe,
      options: options,
      optionsNe: optionsNe,
      min: min,
      max: max,
    );
  }
}

class FormTemplateService {
  /// Option lists made of brand names, capacities, currency codes or model
  /// numbers read the same in both languages. Naming the fallback keeps a null
  /// optionsNe from looking like a forgotten translation (B-11/B-12).
  static const List<String>? _sameInNepali = null;

  // ============================================
  // COMMON FIELDS
  // ============================================

  // Only two values survive a save: the server collapses anything that is not
  // "Brand New" to "Used" (normalizeCondition, B-08). Extra options such as
  // "Like New" or "Reconditioned" must not be offered until that is fixed.
  static const _conditionOptions = ['Brand New', 'Used'];
  static const _conditionOptionsNe = ['नयाँ', 'पुरानो'];

  static const _conditionRequired = FormFieldModel(
    name: 'condition',
    label: 'Condition',
    labelNe: 'अवस्था',
    type: FieldType.select,
    required: true,
    options: _conditionOptions,
    optionsNe: _conditionOptionsNe,
  );

  static const _conditionOptional = FormFieldModel(
    name: 'condition',
    label: 'Condition',
    labelNe: 'अवस्था',
    type: FieldType.select,
    options: _conditionOptions,
    optionsNe: _conditionOptionsNe,
  );

  static const _warrantyOptions = [
    'No Warranty',
    'Under Warranty (< 6 months)',
    'Under Warranty (6-12 months)',
    'Under Warranty (1+ years)',
  ];
  static const _warrantyOptionsNe = [
    'वारेन्टी छैन',
    'वारेन्टी अन्तर्गत (< ६ महिना)',
    'वारेन्टी अन्तर्गत (६-१२ महिना)',
    'वारेन्टी अन्तर्गत (१+ वर्ष)',
  ];

  static const _warranty = FormFieldModel(
    name: 'warranty',
    label: 'Warranty',
    labelNe: 'वारेन्टी',
    type: FieldType.select,
    options: _warrantyOptions,
    optionsNe: _warrantyOptionsNe,
  );

  static FormFieldModel _brand(String placeholder) => FormFieldModel(
    name: 'brand',
    label: 'Brand',
    labelNe: 'ब्रान्ड',
    type: FieldType.text,
    placeholder: placeholder,
    placeholderNe: 'ब्रान्ड लेख्नुहोस्',
  );

  static FormFieldModel _brandSelect(List<String> options) => FormFieldModel(
    name: 'brand',
    label: 'Brand',
    labelNe: 'ब्रान्ड',
    type: FieldType.select,
    options: options,
    optionsNe: _sameInNepali,
  );

  static FormFieldModel _model(String placeholder) => FormFieldModel(
    name: 'model',
    label: 'Model',
    labelNe: 'मोडेल',
    type: FieldType.text,
    placeholder: placeholder,
    placeholderNe: 'मोडेल लेख्नुहोस्',
  );

  static const _color = FormFieldModel(
    name: 'color',
    label: 'Color',
    labelNe: 'रङ',
    type: FieldType.text,
    placeholder: 'e.g., Black, White, Red',
    placeholderNe: 'जस्तै, कालो, सेतो, रातो',
  );

  static const _quantity = FormFieldModel(
    name: 'quantity',
    label: 'Quantity Available',
    labelNe: 'उपलब्ध मात्रा',
    type: FieldType.number,
    placeholder: 'Enter quantity',
    placeholderNe: 'मात्रा लेख्नुहोस्',
  );

  static FormFieldModel _expiryDate({
    String label = 'Expiry Date',
    String labelNe = 'म्याद सकिने मिति',
  }) => FormFieldModel(
    name: 'expiryDate',
    label: label,
    labelNe: labelNe,
    type: FieldType.date,
  );

  static FormFieldModel _productWeight({
    String label = 'Weight / Volume',
    String labelNe = 'तौल / आयतन',
  }) => FormFieldModel(
    name: 'productWeight',
    label: label,
    labelNe: labelNe,
    type: FieldType.text,
    placeholder: 'e.g., 250ml, 100gm, 1kg',
    placeholderNe: 'जस्तै, २५० मिली, १०० ग्राम, १ के.जी.',
  );

  static FormFieldModel _productType(
    List<String> options,
    List<String> optionsNe, {
    String label = 'Product Type',
    String labelNe = 'उत्पादन प्रकार',
  }) => FormFieldModel(
    name: 'productType',
    label: label,
    labelNe: labelNe,
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static FormFieldModel _priceUnit(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'priceUnit',
    label: 'Price Unit',
    labelNe: 'मूल्य एकाइ',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static FormFieldModel _pricePeriod(
    List<String> options,
    List<String> optionsNe, {
    String label = 'Price Period',
    String labelNe = 'मूल्य अवधि',
  }) => FormFieldModel(
    name: 'pricePeriod',
    label: label,
    labelNe: labelNe,
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static FormFieldModel _serviceType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'serviceType',
    label: 'Service Type',
    labelNe: 'सेवा प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _ageGroupOptions = [
    '0-3 months',
    '3-6 months',
    '6-12 months',
    '1-2 years',
    '2-4 years',
    '4-6 years',
    '6-10 years',
  ];
  static const _ageGroupOptionsNe = [
    '०-३ महिना',
    '३-६ महिना',
    '६-१२ महिना',
    '१-२ वर्ष',
    '२-४ वर्ष',
    '४-६ वर्ष',
    '६-१० वर्ष',
  ];

  static const _ageGroup = FormFieldModel(
    name: 'ageGroup',
    label: 'Age Group',
    labelNe: 'उमेर समूह',
    type: FieldType.select,
    options: _ageGroupOptions,
    optionsNe: _ageGroupOptionsNe,
  );

  // ============================================
  // ELECTRONICS FIELDS
  // ============================================

  static FormFieldModel _storage(List<String> options) => FormFieldModel(
    name: 'storage',
    label: 'Storage Capacity',
    labelNe: 'भण्डारण क्षमता',
    type: FieldType.select,
    options: options,
    optionsNe: _sameInNepali,
  );

  static FormFieldModel _ram(List<String> options) => FormFieldModel(
    name: 'ram',
    label: 'RAM',
    labelNe: 'र्‍याम',
    type: FieldType.select,
    options: options,
    optionsNe: _sameInNepali,
  );

  static const _batteryHealth = FormFieldModel(
    name: 'batteryHealth',
    label: 'Battery Health',
    labelNe: 'ब्याट्री स्वास्थ्य',
    type: FieldType.select,
    options: ['100%', '95-99%', '90-94%', '85-89%', '80-84%', 'Below 80%'],
    optionsNe: ['१००%', '९५-९९%', '९०-९४%', '८५-८९%', '८०-८४%', '८०% भन्दा कम'],
  );

  static const _processor = FormFieldModel(
    name: 'processor',
    label: 'Processor',
    labelNe: 'प्रोसेसर',
    type: FieldType.text,
    placeholder: 'e.g., Intel Core i5 12th Gen, AMD Ryzen 7',
    placeholderNe: 'जस्तै, Intel Core i5 12th Gen, AMD Ryzen 7',
  );

  static const _graphics = FormFieldModel(
    name: 'graphics',
    label: 'Graphics Card',
    labelNe: 'ग्राफिक्स कार्ड',
    type: FieldType.text,
    placeholder: 'e.g., NVIDIA RTX 3060, Integrated',
    placeholderNe: 'जस्तै, NVIDIA RTX 3060, Integrated',
  );

  static FormFieldModel _screenSize(List<String> options) => FormFieldModel(
    name: 'screenSize',
    label: 'Screen Size',
    labelNe: 'स्क्रिन साइज',
    type: FieldType.select,
    options: options,
    optionsNe: _sameInNepali,
  );

  static const _screenResolution = FormFieldModel(
    name: 'screenResolution',
    label: 'Screen Resolution',
    labelNe: 'स्क्रिन रिजोलुसन',
    type: FieldType.select,
    options: ['HD Ready', 'Full HD', '4K UHD', '8K'],
    optionsNe: _sameInNepali,
  );

  static const _smartFeatures = FormFieldModel(
    name: 'smartFeatures',
    label: 'Smart Features',
    labelNe: 'स्मार्ट सुविधाहरू',
    type: FieldType.multiselect,
    options: [
      'Smart TV',
      'HDR',
      'Android TV',
      'WebOS',
      'Tizen',
      'Built-in WiFi',
      'Voice Control',
    ],
    optionsNe: [
      'स्मार्ट टिभी',
      'HDR',
      'एन्ड्रोइड टिभी',
      'WebOS',
      'Tizen',
      'बिल्ट-इन वाइफाइ',
      'भ्वाइस कन्ट्रोल',
    ],
  );

  static const _sensorSize = FormFieldModel(
    name: 'sensorSize',
    label: 'Sensor Size',
    labelNe: 'सेन्सर साइज',
    type: FieldType.select,
    options: [
      'Full Frame',
      'APS-C',
      'Micro 4/3',
      '1 inch',
      'Medium Format',
      'Action/Compact',
      'N/A',
    ],
    optionsNe: _sameInNepali,
  );

  static const _megapixels = FormFieldModel(
    name: 'megapixels',
    label: 'Megapixels',
    labelNe: 'मेगापिक्सेल',
    type: FieldType.number,
    placeholder: 'leave blank for lenses & accessories',
    placeholderNe: 'लेन्स र सामानका लागि खाली छोड्नुहोस्',
  );

  static FormFieldModel _accessoryType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'accessoryType',
    label: 'Accessory Type',
    labelNe: 'सामान प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static FormFieldModel _applianceType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'applianceType',
    label: 'Appliance Type',
    labelNe: 'उपकरण प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  // ============================================
  // VEHICLE FIELDS
  // ============================================

  /// A model-year ahead of the calendar year is a normal listing, so the
  /// ceiling tracks the clock instead of a hardcoded 2025 (B-07).
  static double get _maxYear => (DateTime.now().year + 1).toDouble();

  static FormFieldModel get _vehicleYear => FormFieldModel(
    name: 'year',
    label: 'Year of Manufacture',
    labelNe: 'निर्माण वर्ष',
    type: FieldType.number,
    placeholder: 'e.g., 2020',
    placeholderNe: 'जस्तै, २०२०',
    min: 1980,
    max: _maxYear,
  );

  static FormFieldModel get _registrationYear => FormFieldModel(
    name: 'registrationYear',
    label: 'Registration Year',
    labelNe: 'दर्ता वर्ष',
    type: FieldType.number,
    min: 1980,
    max: _maxYear,
  );

  static const _mileage = FormFieldModel(
    name: 'mileage',
    label: 'Kilometers Driven',
    labelNe: 'चलेको किलोमिटर',
    type: FieldType.number,
    placeholder: 'in km',
    placeholderNe: 'कि.मी. मा',
  );

  static FormFieldModel _fuelType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'fuelType',
    label: 'Fuel Type',
    labelNe: 'इन्धन प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _transmission = FormFieldModel(
    name: 'transmission',
    label: 'Transmission',
    labelNe: 'ट्रान्समिसन',
    type: FieldType.select,
    options: ['Manual', 'Automatic', 'Semi-Automatic'],
    optionsNe: ['म्यानुअल', 'अटोम्याटिक', 'सेमी-अटोम्याटिक'],
  );

  static FormFieldModel _engineCapacity(String placeholder) => FormFieldModel(
    name: 'engineCapacity',
    label: 'Engine Capacity (cc)',
    labelNe: 'इन्जिन क्षमता (cc)',
    type: FieldType.number,
    placeholder: placeholder,
    placeholderNe: 'जस्तै, १५००',
  );

  static const _owners = FormFieldModel(
    name: 'owners',
    label: 'Number of Owners',
    labelNe: 'मालिक संख्या',
    type: FieldType.select,
    options: ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or More'],
    optionsNe: [
      'पहिलो मालिक',
      'दोस्रो मालिक',
      'तेस्रो मालिक',
      'चौथो मालिक वा बढी',
    ],
  );

  static const _registrationLocation = FormFieldModel(
    name: 'registrationLocation',
    label: 'Registration Zone',
    labelNe: 'दर्ता क्षेत्र',
    type: FieldType.select,
    options: [
      'Koshi',
      'Madhesh',
      'Bagmati',
      'Gandaki',
      'Lumbini',
      'Karnali',
      'Sudurpashchim',
    ],
    optionsNe: [
      'कोशी',
      'मधेश',
      'बागमती',
      'गण्डकी',
      'लुम्बिनी',
      'कर्णाली',
      'सुदूरपश्चिम',
    ],
  );

  static const _plateType = FormFieldModel(
    name: 'plateType',
    label: 'Plate Type',
    labelNe: 'नम्बर प्लेट प्रकार',
    type: FieldType.select,
    options: [
      'Private',
      'Public/Commercial',
      'Government',
      'Corporation',
      'Tourist',
    ],
    optionsNe: ['निजी', 'सार्वजनिक/व्यावसायिक', 'सरकारी', 'संस्थान', 'पर्यटक'],
  );

  static FormFieldModel _vehicleType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'vehicleType',
    label: 'Vehicle Type',
    labelNe: 'सवारी प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _bodyType = FormFieldModel(
    name: 'bodyType',
    label: 'Body Type',
    labelNe: 'बडी प्रकार',
    type: FieldType.select,
    options: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Pickup'],
    optionsNe: ['सेडान', 'एसयूभी', 'ह्याचब्याक', 'कूपे', 'कन्भर्टिबल', 'पिकअप'],
  );

  static FormFieldModel _seats(List<String> options, List<String> optionsNe) =>
      FormFieldModel(
        name: 'seats',
        label: 'Number of Seats',
        labelNe: 'सिट संख्या',
        type: FieldType.select,
        options: options,
        optionsNe: optionsNe,
      );

  static const _passengerCapacity = FormFieldModel(
    name: 'passengerCapacity',
    label: 'Passenger Capacity',
    labelNe: 'यात्रु क्षमता',
    type: FieldType.number,
    placeholder: 'e.g., 32',
    placeholderNe: 'जस्तै, ३२',
  );

  static const _payloadCapacity = FormFieldModel(
    name: 'payloadCapacity',
    label: 'Load Capacity (tons)',
    labelNe: 'भार क्षमता (टन)',
    type: FieldType.number,
    placeholder: 'e.g., 10',
    placeholderNe: 'जस्तै, १०',
  );

  static const _operatingHours = FormFieldModel(
    name: 'operatingHours',
    label: 'Operating Hours',
    labelNe: 'सञ्चालन घण्टा',
    type: FieldType.number,
    placeholder: 'e.g., 4500',
    placeholderNe: 'जस्तै, ४५००',
  );

  static const _routePermit = FormFieldModel(
    name: 'routePermit',
    label: 'Route Permit',
    labelNe: 'रुट परमिट',
    type: FieldType.text,
    placeholder: 'e.g., Kathmandu-Pokhara, none',
    placeholderNe: 'जस्तै, काठमाडौं-पोखरा, छैन',
  );

  static const _bicycleType = FormFieldModel(
    name: 'bicycleType',
    label: 'Bicycle Type',
    labelNe: 'साइकल प्रकार',
    type: FieldType.select,
    options: [
      'Mountain Bike',
      'Road Bike',
      'Hybrid',
      'Gravel/Touring',
      'BMX',
      'Folding',
      'Electric',
      'Kids Bike',
    ],
    optionsNe: [
      'माउन्टेन बाइक',
      'रोड बाइक',
      'हाइब्रिड',
      'ग्राभेल/टुरिङ',
      'बीएमएक्स',
      'फोल्डिङ',
      'इलेक्ट्रिक',
      'बच्चाको बाइक',
    ],
  );

  static const _frameSize = FormFieldModel(
    name: 'frameSize',
    label: 'Frame Size',
    labelNe: 'फ्रेम साइज',
    type: FieldType.select,
    options: [
      'Kids',
      'XS (13-14 in)',
      'S (15-16 in)',
      'M (17-18 in)',
      'L (19-20 in)',
      'XL (21 in+)',
    ],
    optionsNe: [
      'बच्चा',
      'XS (13-14 in)',
      'S (15-16 in)',
      'M (17-18 in)',
      'L (19-20 in)',
      'XL (21 in+)',
    ],
  );

  static const _gears = FormFieldModel(
    name: 'gears',
    label: 'Number of Gears',
    labelNe: 'गियर संख्या',
    type: FieldType.number,
    placeholder: 'e.g., 21 (leave blank for single speed)',
    placeholderNe: 'जस्तै, २१ (सिंगल स्पिडका लागि खाली छोड्नुहोस्)',
  );

  static const _boatType = FormFieldModel(
    name: 'boatType',
    label: 'Boat Type',
    labelNe: 'डुङ्गा प्रकार',
    type: FieldType.select,
    options: [
      'Wooden',
      'Fiber',
      'Motor Boat',
      'Pedal Boat',
      'Raft',
      'Kayak',
      'Ferry',
      'Other',
    ],
    optionsNe: [
      'काठको',
      'फाइबर',
      'मोटर बोट',
      'प्याडल बोट',
      'र्‍याफ्ट',
      'कायाक',
      'फेरी',
      'अन्य',
    ],
  );

  static const _partType = FormFieldModel(
    name: 'partType',
    label: 'Part Type',
    labelNe: 'पार्ट्स प्रकार',
    type: FieldType.select,
    options: [
      'Engine/Transmission',
      'Brakes/Suspension',
      'Tyres/Wheels',
      'Battery',
      'Lights/Electricals',
      'Body Parts',
      'Interior',
      'Mirrors/Glass',
      'Audio',
      'Filters/Fluids',
      'Helmets',
      'Car Care',
      'Other',
    ],
    optionsNe: [
      'इन्जिन/ट्रान्समिसन',
      'ब्रेक/सस्पेन्सन',
      'टायर/पाङ्ग्रा',
      'ब्याट्री',
      'लाइट/इलेक्ट्रिकल',
      'बडी पार्ट्स',
      'भित्री सजावट',
      'ऐना/सिसा',
      'अडियो',
      'फिल्टर/तेल',
      'हेल्मेट',
      'कार केयर',
      'अन्य',
    ],
  );

  static const _compatibleVehicle = FormFieldModel(
    name: 'compatibleVehicle',
    label: 'Compatible Vehicle',
    labelNe: 'मिल्ने सवारी साधन',
    type: FieldType.text,
    placeholder: 'e.g., Suzuki Swift 2015-2020, Pulsar 150',
    placeholderNe: 'जस्तै, Suzuki Swift 2015-2020, Pulsar 150',
  );

  static const _rentalPeriod = FormFieldModel(
    name: 'rentalPeriod',
    label: 'Rental Period',
    labelNe: 'भाडा अवधि',
    type: FieldType.select,
    options: ['Per Hour', 'Per Day', 'Per Week', 'Per Month', 'Per Trip'],
    optionsNe: [
      'प्रति घण्टा',
      'प्रति दिन',
      'प्रति हप्ता',
      'प्रति महिना',
      'प्रति यात्रा',
    ],
  );

  static const _withDriver = FormFieldModel(
    name: 'withDriver',
    label: 'Driver',
    labelNe: 'चालक',
    type: FieldType.select,
    options: ['With Driver', 'Self-Drive', 'Both'],
    optionsNe: ['चालक सहित', 'आफैं चलाउने', 'दुवै'],
  );

  static const _vehicleTypesServiced = FormFieldModel(
    name: 'vehicleTypesServiced',
    label: 'Vehicles Serviced',
    labelNe: 'सेवा दिइने सवारी',
    type: FieldType.multiselect,
    options: [
      'Car',
      'Motorbike',
      'Scooter',
      'Truck',
      'Bus',
      'Three Wheeler',
      'Heavy Equipment',
    ],
    optionsNe: [
      'कार',
      'मोटरसाइकल',
      'स्कुटर',
      'ट्रक',
      'बस',
      'तीन पाङ्ग्रे',
      'भारी उपकरण',
    ],
  );

  static const _serviceOptions = FormFieldModel(
    name: 'serviceOptions',
    label: 'Service Options',
    labelNe: 'सेवा सुविधा',
    type: FieldType.multiselect,
    options: [
      'Pickup/Drop',
      'On-site Service',
      '24hr Service',
      'Warranty',
      'Genuine Parts',
    ],
    optionsNe: [
      'पिकअप/ड्रप',
      'घरमै सेवा',
      '२४ घण्टा सेवा',
      'वारेन्टी',
      'जेनुइन पार्ट्स',
    ],
  );

  static const _autoServiceTypes = [
    'Servicing/Oil Change',
    'Denting/Painting',
    'Mechanical',
    'Electrical',
    'AC Service',
    'Tyre/Alignment',
    'Battery',
    'Car Wash',
    'Insurance',
    'Bluebook/Renewal',
    'Towing',
    'Other',
  ];
  static const _autoServiceTypesNe = [
    'सर्भिसिङ/मोबिल',
    'डेन्टिङ/पेन्टिङ',
    'मेकानिकल',
    'इलेक्ट्रिकल',
    'एसी सर्भिस',
    'टायर/अलाइनमेन्ट',
    'ब्याट्री',
    'कार वास',
    'बीमा',
    'ब्लुबुक/नवीकरण',
    'टोइङ',
    'अन्य',
  ];

  // ============================================
  // PROPERTY FIELDS
  // ============================================

  static FormFieldModel _propertyType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'propertyType',
    label: 'Property Type',
    labelNe: 'सम्पत्ति प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _roomType = FormFieldModel(
    name: 'roomType',
    label: 'Room Type',
    labelNe: 'कोठा प्रकार',
    type: FieldType.select,
    options: [
      'Single Room',
      '1 Room + Kitchen',
      '2 Rooms + Kitchen',
      'Shared Room',
      'Master Bedroom',
      'Hostel Bed',
      'Flat',
    ],
    optionsNe: [
      'एकल कोठा',
      '१ कोठा + भान्सा',
      '२ कोठा + भान्सा',
      'साझा कोठा',
      'मास्टर बेडरूम',
      'होस्टेल बेड',
      'फ्ल्याट',
    ],
  );

  static FormFieldModel _totalArea({
    String label = 'Total Area',
    String labelNe = 'कुल क्षेत्रफल',
  }) => FormFieldModel(
    name: 'totalArea',
    label: label,
    labelNe: labelNe,
    type: FieldType.number,
    placeholder: 'Enter area',
    placeholderNe: 'क्षेत्रफल लेख्नुहोस्',
  );

  // Terai land is sold in dhur/kattha/bigha; without them those ads cannot be
  // listed correctly at all.
  static const _areaUnit = FormFieldModel(
    name: 'areaUnit',
    label: 'Area Unit',
    labelNe: 'क्षेत्रफल एकाइ',
    type: FieldType.select,
    options: ['aana', 'ropani', 'dhur', 'kattha', 'bigha', 'sq ft', 'sq meter'],
    optionsNe: [
      'आना',
      'रोपनी',
      'धुर',
      'कट्ठा',
      'बिघा',
      'वर्ग फिट',
      'वर्ग मिटर',
    ],
  );

  static const _builtUpArea = FormFieldModel(
    name: 'builtUpArea',
    label: 'Built-up Area (sq ft)',
    labelNe: 'निर्मित क्षेत्रफल (वर्ग फिट)',
    type: FieldType.number,
    placeholder: 'e.g., 1800',
    placeholderNe: 'जस्तै, १८००',
  );

  static const _bedrooms = FormFieldModel(
    name: 'bedrooms',
    label: 'Bedrooms',
    labelNe: 'शयनकोठा',
    type: FieldType.select,
    options: ['Studio', '1', '2', '3', '4', '5', '6+'],
    optionsNe: ['स्टुडियो', '१', '२', '३', '४', '५', '६+'],
  );

  static const _bathrooms = FormFieldModel(
    name: 'bathrooms',
    label: 'Bathrooms',
    labelNe: 'स्नानकोठा',
    type: FieldType.select,
    options: ['1', '2', '3', '4', '5+'],
    optionsNe: ['१', '२', '३', '४', '५+'],
  );

  static FormFieldModel _furnishing({
    String label = 'Furnishing',
    String labelNe = 'फर्निचर',
  }) => FormFieldModel(
    name: 'furnishing',
    label: label,
    labelNe: labelNe,
    type: FieldType.select,
    options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'],
    optionsNe: ['पूर्ण सुसज्जित', 'आंशिक सुसज्जित', 'सुसज्जित नभएको'],
  );

  static const _constructionType = FormFieldModel(
    name: 'constructionType',
    label: 'Construction Type',
    labelNe: 'निर्माण प्रकार',
    type: FieldType.select,
    options: ['RCC Pillar', 'Semi-Pillar', 'Load Bearing', 'Wooden'],
    optionsNe: ['आरसीसी पिलर', 'सेमी-पिलर', 'लोड बेयरिङ', 'काठको'],
  );

  static FormFieldModel _parking(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'parking',
    label: 'Parking',
    labelNe: 'पार्किङ',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _parkingOptions = [
    'None',
    'Bike',
    'Car',
    'Bike + Car',
    '2+ Vehicles',
  ];
  static const _parkingOptionsNe = [
    'छैन',
    'मोटरसाइकल',
    'कार',
    'मोटरसाइकल + कार',
    '२+ सवारी',
  ];
  static const _commercialParkingOptions = [
    'None',
    'Bike',
    'Car',
    'Bike + Car',
    'Truck / Loading Bay',
  ];
  static const _commercialParkingOptionsNe = [
    'छैन',
    'मोटरसाइकल',
    'कार',
    'मोटरसाइकल + कार',
    'ट्रक / लोडिङ बे',
  ];

  static const _floorNumber = FormFieldModel(
    name: 'floorNumber',
    label: 'Floor Number',
    labelNe: 'तल्ला नम्बर',
    type: FieldType.number,
    placeholder: 'e.g., 5',
    placeholderNe: 'जस्तै, ५',
  );

  static const _totalFloors = FormFieldModel(
    name: 'totalFloors',
    label: 'Total Floors in Building',
    labelNe: 'भवनमा कुल तल्ला',
    type: FieldType.number,
    placeholder: 'e.g., 12',
    placeholderNe: 'जस्तै, १२',
  );

  static const _facing = FormFieldModel(
    name: 'facing',
    label: 'Facing',
    labelNe: 'मुख दिशा',
    type: FieldType.select,
    options: [
      'North',
      'South',
      'East',
      'West',
      'North-East',
      'North-West',
      'South-East',
      'South-West',
    ],
    optionsNe: [
      'उत्तर',
      'दक्षिण',
      'पूर्व',
      'पश्चिम',
      'उत्तर-पूर्व',
      'उत्तर-पश्चिम',
      'दक्षिण-पूर्व',
      'दक्षिण-पश्चिम',
    ],
  );

  /// Replaces the old `propertyAge` range picker. A new key, not a relabel: ads
  /// posted before this store '0-1 years', which cannot become a year — they
  /// keep rendering under the legacy label instead.
  /// Years are AD. The cap runs a few years ahead so an under-construction
  /// building can quote its expected completion year.
  static FormFieldModel get _buildYear => FormFieldModel(
    name: 'buildYear',
    label: 'Build Year',
    labelNe: 'निर्माण वर्ष',
    type: FieldType.number,
    placeholder: 'e.g. 2019',
    placeholderNe: 'जस्तै २०१९',
    min: 1950,
    max: (DateTime.now().year + 5).toDouble(),
  );

  static FormFieldModel _amenities(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'amenities',
    label: 'Amenities',
    labelNe: 'सुविधाहरू',
    type: FieldType.multiselect,
    options: options,
    optionsNe: optionsNe,
  );

  static const _apartmentAmenities = [
    'Lift/Elevator',
    'Power Backup',
    '24hr Water',
    'Security/Gated',
    'Balcony',
    'Modular Kitchen',
    'Gym',
    'Swimming Pool',
    'Kids Play Area',
    'Club House',
    'Visitor Parking',
  ];
  static const _apartmentAmenitiesNe = [
    'लिफ्ट',
    'पावर ब्याकअप',
    '२४ घण्टा पानी',
    'सुरक्षा/गेटेड',
    'बाल्कनी',
    'मोड्युलर भान्सा',
    'जिम',
    'स्विमिङ पुल',
    'बालबालिका खेल्ने ठाउँ',
    'क्लब हाउस',
    'आगन्तुक पार्किङ',
  ];

  static const _houseAmenities = [
    'Boring/Well',
    'Overhead Tank',
    'Solar Heater',
    'Inverter',
    'Compound Wall',
    'Garden',
    'Garage',
    'CCTV',
    'Modular Kitchen',
    'Terrace',
  ];
  static const _houseAmenitiesNe = [
    'बोरिङ/इनार',
    'ओभरहेड ट्यांकी',
    'सोलार हिटर',
    'इन्भर्टर',
    'कम्पाउन्ड पर्खाल',
    'बगैंचा',
    'ग्यारेज',
    'सीसीटीभी',
    'मोड्युलर भान्सा',
    'कौसी',
  ];

  static const _houseRentalAmenities = [
    '24hr Water',
    'Overhead Tank',
    'Solar Heater',
    'Inverter',
    'Separate Electricity Meter',
    'Compound Wall',
    'Garden',
    'Garage',
    'CCTV',
    'Terrace',
  ];
  static const _houseRentalAmenitiesNe = [
    '२४ घण्टा पानी',
    'ओभरहेड ट्यांकी',
    'सोलार हिटर',
    'इन्भर्टर',
    'छुट्टै बिजुली मिटर',
    'कम्पाउन्ड पर्खाल',
    'बगैंचा',
    'ग्यारेज',
    'सीसीटीभी',
    'कौसी',
  ];

  static const _commercialAmenities = [
    'Lift/Elevator',
    'Power Backup',
    'Water Supply',
    'Parking',
    'CCTV',
    'Air Conditioning',
    'Attached Toilet',
    'Loading Access',
    'Separate Entrance',
    'Fire Safety',
  ];
  static const _commercialAmenitiesNe = [
    'लिफ्ट',
    'पावर ब्याकअप',
    'पानी आपूर्ति',
    'पार्किङ',
    'सीसीटीभी',
    'एयर कन्डिसनिङ',
    'संलग्न शौचालय',
    'लोडिङ पहुँच',
    'छुट्टै प्रवेशद्वार',
    'अग्नि सुरक्षा',
  ];

  static const _roomAmenities = [
    'Attached Bathroom',
    'Shared Bathroom',
    'Kitchen Access',
    '24hr Water',
    'Hot Water',
    'WiFi',
    'Separate Meter',
    'Parking',
    'Laundry',
    'Terrace',
    'Furnished Bed',
  ];
  static const _roomAmenitiesNe = [
    'संलग्न बाथरूम',
    'साझा बाथरूम',
    'भान्सा प्रयोग',
    '२४ घण्टा पानी',
    'तातो पानी',
    'वाइफाइ',
    'छुट्टै मिटर',
    'पार्किङ',
    'लुगा धुने',
    'कौसी',
    'ओछ्यान सहित',
  ];

  static const _landType = FormFieldModel(
    name: 'landType',
    label: 'Land Type',
    labelNe: 'जमिन प्रकार',
    type: FieldType.select,
    options: [
      'Residential',
      'Commercial',
      'Agricultural',
      'Industrial',
      'Mixed Use',
    ],
    optionsNe: ['आवासीय', 'व्यापारिक', 'कृषि', 'औद्योगिक', 'मिश्रित प्रयोग'],
  );

  static const _roadAccess = FormFieldModel(
    name: 'roadAccess',
    label: 'Road Type',
    labelNe: 'सडक प्रकार',
    type: FieldType.select,
    options: ['Paved Road', 'Graveled Road', 'Dirt Road', 'No Direct Access'],
    optionsNe: ['पक्की सडक', 'ग्राभेल सडक', 'कच्ची सडक', 'प्रत्यक्ष पहुँच छैन'],
  );

  /// Replaces the free-number `roadWidth`. A new key, not a relabel: older ads
  /// store a raw number, which has no matching option — they keep rendering
  /// under the legacy label instead. Bands follow how Nepali listings quote it.
  static const _roadSize = FormFieldModel(
    name: 'roadSize',
    label: 'Road Size',
    labelNe: 'सडक आकार',
    type: FieldType.select,
    options: [
      'Under 8 feet',
      '8-13 feet',
      '13-16 feet',
      '16-20 feet',
      '20+ feet',
    ],
    optionsNe: [
      '८ फिटभन्दा कम',
      '८-१३ फिट',
      '१३-१६ फिट',
      '१६-२० फिट',
      '२०+ फिट',
    ],
  );

  static const _preferredTenant = FormFieldModel(
    name: 'preferredTenant',
    label: 'Preferred Tenant',
    labelNe: 'रुचाइएको भाडावाल',
    type: FieldType.select,
    options: [
      'Family',
      'Bachelors',
      'Students',
      'Working Professionals',
      'Girls Only',
      'Boys Only',
      'Anyone',
    ],
    optionsNe: [
      'परिवार',
      'ब्याचलर',
      'विद्यार्थी',
      'जागिरे',
      'केटी मात्र',
      'केटा मात्र',
      'जो कोही',
    ],
  );

  static FormFieldModel _securityDeposit(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'securityDeposit',
    label: 'Security Deposit',
    labelNe: 'धरौटी',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _depositOptions = [
    'None',
    '1 month',
    '2 months',
    '3 months',
    'Negotiable',
  ];
  static const _depositOptionsNe = [
    'छैन',
    '१ महिना',
    '२ महिना',
    '३ महिना',
    'मिलाउन सकिने',
  ];
  static const _commercialDepositOptions = [
    'None',
    '1 month',
    '2 months',
    '3 months',
    '6 months',
    'Negotiable',
  ];
  static const _commercialDepositOptionsNe = [
    'छैन',
    '१ महिना',
    '२ महिना',
    '३ महिना',
    '६ महिना',
    'मिलाउन सकिने',
  ];

  static const _availableFrom = FormFieldModel(
    name: 'availableFrom',
    label: 'Available From',
    labelNe: 'उपलब्ध मिति',
    type: FieldType.select,
    options: ['Immediately', '15 days', '1 month', '2 months', '3 months'],
    optionsNe: ['तुरुन्तै', '१५ दिन', '१ महिना', '२ महिना', '३ महिना'],
  );

  static const _googleMapsLink = FormFieldModel(
    name: 'googleMapsLink',
    label: 'Google Maps',
    labelNe: 'गुगल म्यापको लिङ्क',
    type: FieldType.text,
    placeholder: 'Paste Google Maps link',
    placeholderNe: 'गुगल म्यापको लिङ्क पेस्ट गर्नुहोस्',
  );

  // ============================================
  // FASHION FIELDS
  // ============================================

  static FormFieldModel _clothingType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'clothingType',
    label: 'Clothing Type',
    labelNe: 'लुगा प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _size = FormFieldModel(
    name: 'size',
    label: 'Size',
    labelNe: 'साइज',
    type: FieldType.select,
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'],
    optionsNe: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'फ्री साइज'],
  );

  static const _waistSize = FormFieldModel(
    name: 'size',
    label: 'Waist Size (inches)',
    labelNe: 'कम्मर साइज (इन्च)',
    type: FieldType.select,
    options: [
      '28',
      '30',
      '32',
      '34',
      '36',
      '38',
      '40',
      '42',
      '44',
      'Free Size',
    ],
    optionsNe: [
      '२८',
      '३०',
      '३२',
      '३४',
      '३६',
      '३८',
      '४०',
      '४२',
      '४४',
      'फ्री साइज',
    ],
  );

  static const _fitType = FormFieldModel(
    name: 'fitType',
    label: 'Fit Type',
    labelNe: 'फिट प्रकार',
    type: FieldType.select,
    options: ['Regular Fit', 'Slim Fit', 'Loose Fit', 'Skinny Fit'],
    optionsNe: ['रेगुलर फिट', 'स्लिम फिट', 'लुज फिट', 'स्किनी फिट'],
  );

  static const _sleeveType = FormFieldModel(
    name: 'sleeveType',
    label: 'Sleeve Type',
    labelNe: 'बाहुला प्रकार',
    type: FieldType.select,
    options: ['Full Sleeve', 'Half Sleeve', 'Sleeveless', '3/4 Sleeve'],
    optionsNe: ['पूरा बाहुला', 'आधा बाहुला', 'बाहुला नभएको', '३/४ बाहुला'],
  );

  static FormFieldModel _fabric(List<String> options, List<String> optionsNe) =>
      FormFieldModel(
        name: 'fabric',
        label: 'Fabric',
        labelNe: 'कपडा',
        type: FieldType.select,
        options: options,
        optionsNe: optionsNe,
      );

  static const _footwearType = FormFieldModel(
    name: 'footwearType',
    label: 'Footwear Type',
    labelNe: 'जुत्ता प्रकार',
    type: FieldType.select,
    options: [
      'Sneakers',
      'Formal Shoes',
      'Sandals',
      'Slippers',
      'Boots',
      'Heels',
      'Wedges',
      'Pumps',
      'Flats',
      'Sports Shoes',
    ],
    optionsNe: [
      'स्निकर्स',
      'फर्मल जुत्ता',
      'स्यान्डल',
      'चप्पल',
      'बुट',
      'हिल्स',
      'वेजेज',
      'पम्प्स',
      'फ्ल्याट्स',
      'खेलकुद जुत्ता',
    ],
  );

  static const _shoeSize = FormFieldModel(
    name: 'shoeSize',
    label: 'Shoe Size (EU)',
    labelNe: 'जुत्ता साइज (EU)',
    type: FieldType.number,
    placeholder: 'e.g., 38, 40, 42',
    placeholderNe: 'जस्तै, ३८, ४०, ४२',
    min: 30,
    max: 50,
  );

  static const _watchType = FormFieldModel(
    name: 'watchType',
    label: 'Watch Type',
    labelNe: 'घडी प्रकार',
    type: FieldType.select,
    options: [
      'Analog',
      'Digital',
      'Smart Watch',
      'Chronograph',
      'Automatic',
      'Mechanical',
    ],
    optionsNe: [
      'एनालग',
      'डिजिटल',
      'स्मार्ट वाच',
      'क्रोनोग्राफ',
      'अटोमेटिक',
      'मेकानिकल',
    ],
  );

  static const _strapMaterial = FormFieldModel(
    name: 'strapMaterial',
    label: 'Strap Material',
    labelNe: 'स्ट्र्याप सामग्री',
    type: FieldType.select,
    options: ['Leather', 'Metal', 'Rubber', 'Silicone', 'Fabric'],
    optionsNe: ['छाला', 'धातु', 'रबर', 'सिलिकन', 'कपडा'],
  );

  static const _jewelleryMaterial = FormFieldModel(
    name: 'jewelleryMaterial',
    label: 'Jewellery Material',
    labelNe: 'गहना सामग्री',
    type: FieldType.select,
    options: [
      'Gold',
      'Silver',
      'Platinum',
      'Diamond',
      'Gemstone',
      'Pearl',
      'Imitation',
      'Other',
    ],
    optionsNe: [
      'सुन',
      'चाँदी',
      'प्लेटिनम',
      'हीरा',
      'रत्न',
      'मोती',
      'इमिटेसन',
      'अन्य',
    ],
  );

  static const _eyewearType = FormFieldModel(
    name: 'eyewearType',
    label: 'Eyewear Type',
    labelNe: 'चस्मा प्रकार',
    type: FieldType.select,
    options: [
      'Sunglasses',
      'Frames',
      'Prescription Glasses',
      'Reading Glasses',
      'Contact Lenses',
      'Other',
    ],
    optionsNe: [
      'सनग्लास',
      'फ्रेम',
      'प्रिस्क्रिप्सन चस्मा',
      'पढ्ने चस्मा',
      'कन्ट्याक्ट लेन्स',
      'अन्य',
    ],
  );

  static const _bagAccessoryType = FormFieldModel(
    name: 'accessoryType',
    label: 'Accessory Type',
    labelNe: 'सामान प्रकार',
    type: FieldType.select,
    options: [
      'Backpack',
      'Handbag',
      'Sling Bag',
      'Wallet',
      'Belt',
      'Luggage',
      'Laptop Bag',
      'Cap',
      'Scarf',
      'Other',
    ],
    optionsNe: [
      'ब्याकप्याक',
      'ह्यान्डब्याग',
      'स्लिङ ब्याग',
      'वालेट',
      'बेल्ट',
      'लगेज',
      'ल्यापटप ब्याग',
      'क्याप',
      'स्कार्फ',
      'अन्य',
    ],
  );

  static const _minOrderQuantity = FormFieldModel(
    name: 'minOrderQuantity',
    label: 'Minimum Order Quantity',
    labelNe: 'न्यूनतम अर्डर मात्रा',
    type: FieldType.number,
    placeholder: 'e.g., 50 pieces',
    placeholderNe: 'जस्तै, ५० गोटा',
  );

  static FormFieldModel _material(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'material',
    label: 'Material',
    labelNe: 'सामग्री',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  // ============================================
  // PETS FIELDS
  // ============================================

  static FormFieldModel _animalType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'animalType',
    label: 'Animal Type',
    labelNe: 'जनावर प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _petAnimalTypes = [
    'Dog',
    'Cat',
    'Bird',
    'Fish',
    'Rabbit',
    'Hamster',
    'Guinea Pig',
    'Turtle',
    'Other',
  ];
  static const _petAnimalTypesNe = [
    'कुकुर',
    'बिरालो',
    'चरा',
    'माछा',
    'खरायो',
    'ह्याम्स्टर',
    'गिनी पिग',
    'कछुवा',
    'अन्य',
  ];

  static const _farmAnimalTypes = [
    'Cow',
    'Buffalo',
    'Goat',
    'Sheep',
    'Pig',
    'Yak/Chauri',
    'Horse',
    'Chicken',
    'Duck',
    'Turkey',
    'Pigeon',
    'Rabbit',
    'Other',
  ];
  static const _farmAnimalTypesNe = [
    'गाई',
    'भैंसी',
    'बाख्रा',
    'भेडा',
    'बंगुर',
    'याक/चौंरी',
    'घोडा',
    'कुखुरा',
    'हाँस',
    'टर्की',
    'परेवा',
    'खरायो',
    'अन्य',
  ];

  static FormFieldModel _breed({
    String label = 'Breed',
    String labelNe = 'जात',
    String placeholder = 'e.g., Golden Retriever, Persian Cat',
  }) => FormFieldModel(
    name: 'breed',
    label: label,
    labelNe: labelNe,
    type: FieldType.text,
    placeholder: placeholder,
    placeholderNe: 'जस्तै, गोल्डेन रिट्रिभर, पर्सियन बिरालो',
  );

  static const _petAge = FormFieldModel(
    name: 'age',
    label: 'Age',
    labelNe: 'उमेर',
    type: FieldType.select,
    options: [
      '0-3 months',
      '3-6 months',
      '6-12 months',
      '1-2 years',
      '2-5 years',
      '5+ years',
    ],
    optionsNe: [
      '०-३ महिना',
      '३-६ महिना',
      '६-१२ महिना',
      '१-२ वर्ष',
      '२-५ वर्ष',
      '५+ वर्ष',
    ],
  );

  static const _petGender = FormFieldModel(
    name: 'gender',
    label: 'Gender',
    labelNe: 'लिङ्ग',
    type: FieldType.select,
    options: ['Male', 'Female', 'Unknown'],
    optionsNe: ['भाले', 'पोथी', 'थाहा छैन'],
  );

  static const _vaccination = FormFieldModel(
    name: 'vaccination',
    label: 'Vaccination Status',
    labelNe: 'खोप अवस्था',
    type: FieldType.select,
    options: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
    optionsNe: ['पूर्ण खोप लगाइएको', 'आंशिक खोप लगाइएको', 'खोप नलगाइएको'],
  );

  static const _petPapers = FormFieldModel(
    name: 'papers',
    label: 'Pedigree / Papers',
    labelNe: 'वंशावली / कागजात',
    type: FieldType.select,
    options: ['Yes - All Papers', 'Some Papers', 'No Papers'],
    optionsNe: ['छ - सबै कागजात', 'केही कागजात', 'कागजात छैन'],
  );

  static const _petColor = FormFieldModel(
    name: 'color',
    label: 'Color / Coat',
    labelNe: 'रङ / छाला',
    type: FieldType.text,
    placeholder: 'e.g., Brown, Black, White',
    placeholderNe: 'जस्तै, खैरो, कालो, सेतो',
  );

  static const _animalWeight = FormFieldModel(
    name: 'weight',
    label: 'Weight (kg)',
    labelNe: 'तौल (के.जी.)',
    type: FieldType.number,
    placeholder: 'in kg',
    placeholderNe: 'के.जी. मा',
  );

  static const _milkYield = FormFieldModel(
    name: 'milkYield',
    label: 'Milk Yield (litres/day)',
    labelNe: 'दूध उत्पादन (लिटर/दिन)',
    type: FieldType.number,
    placeholder: 'e.g., 12',
    placeholderNe: 'जस्तै, १२',
  );

  static const _trained = FormFieldModel(
    name: 'trained',
    label: 'Trained',
    labelNe: 'प्रशिक्षित',
    type: FieldType.select,
    options: ['Fully Trained', 'Partially Trained', 'Not Trained'],
    optionsNe: ['पूर्ण प्रशिक्षित', 'आंशिक प्रशिक्षित', 'प्रशिक्षित नभएको'],
  );

  static const _friendlyWith = FormFieldModel(
    name: 'friendlyWith',
    label: 'Friendly With',
    labelNe: 'मैत्रीपूर्ण',
    type: FieldType.multiselect,
    options: ['Children', 'Other Pets', 'Strangers'],
    optionsNe: ['बच्चाहरू', 'अन्य पाल्तु जनावर', 'अपरिचित'],
  );

  // "Pet & Animal food" and its accessories cover livestock too, so the list
  // is not pets-only.
  static const _suitableFor = FormFieldModel(
    name: 'suitableFor',
    label: 'Suitable For',
    labelNe: 'उपयुक्त',
    type: FieldType.select,
    options: [
      'Dogs',
      'Cats',
      'Birds',
      'Fish',
      'Rabbits',
      'Cattle',
      'Goats',
      'Poultry',
      'All Pets',
    ],
    optionsNe: [
      'कुकुर',
      'बिरालो',
      'चरा',
      'माछा',
      'खरायो',
      'गाईवस्तु',
      'बाख्रा',
      'कुखुरा',
      'सबै पाल्तु जनावर',
    ],
  );

  // ============================================
  // SERVICES & EDUCATION FIELDS
  // ============================================

  static const _experience = FormFieldModel(
    name: 'experience',
    label: 'Experience',
    labelNe: 'अनुभव',
    type: FieldType.select,
    options: [
      'Less than 1 year',
      '1-3 years',
      '3-5 years',
      '5-10 years',
      '10+ years',
    ],
    optionsNe: [
      '१ वर्ष भन्दा कम',
      '१-३ वर्ष',
      '३-५ वर्ष',
      '५-१० वर्ष',
      '१०+ वर्ष',
    ],
  );

  static FormFieldModel _availability(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'availability',
    label: 'Availability',
    labelNe: 'उपलब्धता',
    type: FieldType.multiselect,
    options: options,
    optionsNe: optionsNe,
  );

  static const _availabilityOptions = [
    'Weekdays',
    'Weekends',
    'Evenings',
    '24/7',
    'On-Call',
  ];
  static const _availabilityOptionsNe = [
    'हप्ताका दिन',
    'शनिबार/आइतबार',
    'साँझ',
    '२४/७',
    'अन-कल',
  ];

  static FormFieldModel _serviceLocation(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'serviceLocation',
    label: 'Service Location',
    labelNe: 'सेवा स्थान',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _serviceLocationOptions = [
    'At Customer Location',
    'At Provider Location',
    'Remote/Online',
  ];
  static const _serviceLocationOptionsNe = [
    'ग्राहकको स्थानमा',
    'सेवा प्रदायकको स्थानमा',
    'रिमोट/अनलाइन',
  ];

  static FormFieldModel _languages(
    List<String> options,
    List<String> optionsNe, {
    String label = 'Languages Known',
    String labelNe = 'भाषा ज्ञान',
  }) => FormFieldModel(
    name: 'languages',
    label: label,
    labelNe: labelNe,
    type: FieldType.multiselect,
    options: options,
    optionsNe: optionsNe,
  );

  static const _languageOptions = [
    'Nepali',
    'English',
    'Hindi',
    'Newari',
    'Other',
  ];
  static const _languageOptionsNe = [
    'नेपाली',
    'अंग्रेजी',
    'हिन्दी',
    'नेवारी',
    'अन्य',
  ];

  static const _genderServed = FormFieldModel(
    name: 'genderServed',
    label: 'Gender Served',
    labelNe: 'सेवा दिइने लिङ्ग',
    type: FieldType.select,
    options: ['Male', 'Female', 'Unisex'],
    optionsNe: ['पुरुष', 'महिला', 'सबै'],
  );

  static const _tripDuration = FormFieldModel(
    name: 'tripDuration',
    label: 'Trip Duration',
    labelNe: 'यात्रा अवधि',
    type: FieldType.select,
    options: ['1 Day', '2-3 Days', '4-7 Days', '1-2 Weeks', '2+ Weeks'],
    optionsNe: ['१ दिन', '२-३ दिन', '४-७ दिन', '१-२ हप्ता', '२+ हप्ता'],
  );

  static const _lookingFor = FormFieldModel(
    name: 'lookingFor',
    label: 'Looking For',
    labelNe: 'खोजिएको',
    type: FieldType.select,
    options: ['Bride', 'Groom'],
    optionsNe: ['दुलही', 'दुलहा'],
  );

  static const _ageRange = FormFieldModel(
    name: 'ageRange',
    label: 'Age Range',
    labelNe: 'उमेर दायरा',
    type: FieldType.select,
    options: ['18-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50+'],
    optionsNe: ['१८-२४', '२५-२९', '३०-३४', '३५-३९', '४०-४४', '४५-४९', '५०+'],
  );

  static const _maritalStatus = FormFieldModel(
    name: 'maritalStatus',
    label: 'Marital Status',
    labelNe: 'वैवाहिक स्थिति',
    type: FieldType.select,
    options: ['Never Married', 'Divorced', 'Widowed'],
    optionsNe: ['अविवाहित', 'सम्बन्धविच्छेद', 'विधुर/विधवा'],
  );

  static const _subjects = FormFieldModel(
    name: 'subjects',
    label: 'Subject',
    labelNe: 'विषय',
    type: FieldType.multiselect,
    options: [
      'Math',
      'Science',
      'English',
      'Nepali',
      'Social Studies',
      'Computer',
      'Accounts',
      'All Subjects',
    ],
    optionsNe: [
      'गणित',
      'विज्ञान',
      'अंग्रेजी',
      'नेपाली',
      'सामाजिक अध्ययन',
      'कम्प्युटर',
      'लेखा',
      'सबै विषय',
    ],
  );

  static const _gradeLevel = FormFieldModel(
    name: 'gradeLevel',
    label: 'Grade/Level',
    labelNe: 'कक्षा/तह',
    type: FieldType.multiselect,
    options: [
      'Primary (1-5)',
      'Secondary (6-10)',
      '+2/Intermediate',
      'Bachelor',
      'Master',
    ],
    optionsNe: [
      'प्राथमिक (१-५)',
      'माध्यमिक (६-१०)',
      '+२/उच्च माध्यमिक',
      'स्नातक',
      'स्नातकोत्तर',
    ],
  );

  static const _modeOfTeaching = FormFieldModel(
    name: 'modeOfTeaching',
    label: 'Class Mode',
    labelNe: 'कक्षा तरिका',
    type: FieldType.select,
    options: ['Home Tuition', 'Online', 'At Institute', 'Group Class'],
    optionsNe: ['घरमा ट्युसन', 'अनलाइन', 'संस्थामा', 'समूह कक्षा'],
  );

  static const _courseType = FormFieldModel(
    name: 'courseType',
    label: 'Course Type',
    labelNe: 'कोर्स प्रकार',
    type: FieldType.select,
    options: [
      'IELTS/TOEFL/PTE',
      'Language',
      'Computer/IT',
      'Accounting/Tally',
      'Driving',
      'Cooking',
      'Beauty/Tailoring',
      'Music/Dance/Art',
      'Bridge/Entrance',
      'Professional Certification',
      'Other',
    ],
    optionsNe: [
      'IELTS/TOEFL/PTE',
      'भाषा',
      'कम्प्युटर/आईटी',
      'लेखा/ट्याली',
      'ड्राइभिङ',
      'खाना पकाउने',
      'ब्युटी/सिलाई',
      'संगीत/नृत्य/कला',
      'ब्रिज/प्रवेश परीक्षा',
      'व्यावसायिक प्रमाणपत्र',
      'अन्य',
    ],
  );

  static const _courseDuration = FormFieldModel(
    name: 'courseDuration',
    label: 'Course Duration',
    labelNe: 'कोर्स अवधि',
    type: FieldType.select,
    options: [
      '1 Week',
      '2-4 Weeks',
      '1-3 Months',
      '3-6 Months',
      '6-12 Months',
      '1+ Year',
    ],
    optionsNe: [
      '१ हप्ता',
      '२-४ हप्ता',
      '१-३ महिना',
      '३-६ महिना',
      '६-१२ महिना',
      '१+ वर्ष',
    ],
  );

  static const _bookLevel = FormFieldModel(
    name: 'bookLevel',
    label: 'Level',
    labelNe: 'तह',
    type: FieldType.select,
    options: [
      'School (1-10)',
      '+2',
      'Bachelor',
      'Master',
      'Entrance',
      'Loksewa',
      'Other',
    ],
    optionsNe: [
      'विद्यालय (१-१०)',
      '+२',
      'स्नातक',
      'स्नातकोत्तर',
      'प्रवेश परीक्षा',
      'लोकसेवा',
      'अन्य',
    ],
  );

  static const _publisher = FormFieldModel(
    name: 'publisher',
    label: 'Publisher',
    labelNe: 'प्रकाशक',
    type: FieldType.text,
    placeholder: 'e.g., Vidyarthi Pustak Bhandar',
    placeholderNe: 'जस्तै, विद्यार्थी पुस्तक भण्डार',
  );

  static const _destinationCountry = FormFieldModel(
    name: 'destinationCountry',
    label: 'Destination Country',
    labelNe: 'गन्तव्य देश',
    type: FieldType.multiselect,
    options: [
      'Australia',
      'USA',
      'UK',
      'Canada',
      'Japan',
      'Korea',
      'Germany',
      'New Zealand',
      'Ireland',
      'China',
      'India',
      'UAE',
      'Poland',
      'Other',
    ],
    optionsNe: [
      'अस्ट्रेलिया',
      'अमेरिका',
      'बेलायत',
      'क्यानडा',
      'जापान',
      'कोरिया',
      'जर्मनी',
      'न्युजिल्यान्ड',
      'आयरल्यान्ड',
      'चीन',
      'भारत',
      'यूएई',
      'पोल्यान्ड',
      'अन्य',
    ],
  );

  static const _studyLevel = FormFieldModel(
    name: 'studyLevel',
    label: 'Study Level',
    labelNe: 'अध्ययन तह',
    type: FieldType.select,
    options: [
      'Foundation',
      'Bachelor',
      'Master',
      'PhD',
      'Diploma/Vocational',
      'Language Course',
    ],
    optionsNe: [
      'फाउन्डेसन',
      'स्नातक',
      'स्नातकोत्तर',
      'पीएचडी',
      'डिप्लोमा/व्यावसायिक',
      'भाषा कोर्स',
    ],
  );

  // ============================================
  // JOBS FIELDS
  // ============================================

  static const _jobPostType = FormFieldModel(
    name: 'jobPostType',
    label: 'Post Type',
    labelNe: 'पोस्ट प्रकार',
    type: FieldType.select,
    options: ['Hiring', 'Looking for a Job'],
    optionsNe: ['भर्ना गर्दै', 'जागिर खोज्दै'],
  );

  static const _jobType = FormFieldModel(
    name: 'jobType',
    label: 'Job Type',
    labelNe: 'जागिर प्रकार',
    type: FieldType.select,
    options: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
    optionsNe: ['पूर्णकालीन', 'अंशकालीन', 'करार', 'इन्टर्नशिप', 'फ्रिल्यान्स'],
  );

  static const _workLocationType = FormFieldModel(
    name: 'workLocationType',
    label: 'Work Location',
    labelNe: 'कार्यस्थल',
    type: FieldType.select,
    options: ['On-site', 'Hybrid', 'Remote', 'Field Work'],
    optionsNe: ['कार्यस्थलमा', 'हाइब्रिड', 'रिमोट', 'फिल्ड कार्य'],
  );

  static FormFieldModel _companyName({
    String label = 'Company / Employer Name',
    String labelNe = 'कम्पनी / रोजगारदाताको नाम',
  }) => FormFieldModel(
    name: 'companyName',
    label: label,
    labelNe: labelNe,
    type: FieldType.text,
    placeholder: 'Enter name',
    placeholderNe: 'नाम लेख्नुहोस्',
  );

  static const _educationRequired = FormFieldModel(
    name: 'educationRequired',
    label: 'Education Required',
    labelNe: 'आवश्यक शिक्षा',
    type: FieldType.select,
    options: [
      'No Formal Education',
      'SLC/SEE',
      '+2',
      "Bachelor's",
      "Master's",
      'PhD',
    ],
    optionsNe: [
      'औपचारिक शिक्षा नभएको',
      'एसएलसी/एसईई',
      '+२',
      'स्नातक',
      'स्नातकोत्तर',
      'पीएचडी',
    ],
  );

  static const _tradeSkill = FormFieldModel(
    name: 'tradeSkill',
    label: 'Trade / Skill',
    labelNe: 'सीप',
    type: FieldType.select,
    options: [
      'Mason',
      'Carpenter',
      'Electrician',
      'Plumber',
      'Painter',
      'Welder',
      'Steel Fixer',
      'Helper',
      'Site Supervisor',
      'Other',
    ],
    optionsNe: [
      'डकर्मी',
      'सिकर्मी',
      'इलेक्ट्रिसियन',
      'प्लम्बर',
      'रङ्गरोगन',
      'वेल्डर',
      'डन्डी बाँध्ने',
      'सहयोगी',
      'साइट सुपरभाइजर',
      'अन्य',
    ],
  );

  static const _licenseCategory = FormFieldModel(
    name: 'licenseCategory',
    label: 'Licence Category',
    labelNe: 'लाइसेन्स वर्ग',
    type: FieldType.multiselect,
    options: [
      'A - Motorcycle',
      'B - Car/Jeep',
      'C - Truck',
      'D - Bus',
      'K - Scooter',
      'Heavy Equipment',
      'Not Required',
    ],
    optionsNe: [
      'A - मोटरसाइकल',
      'B - कार/जिप',
      'C - ट्रक',
      'D - बस',
      'K - स्कुटर',
      'भारी उपकरण',
      'आवश्यक छैन',
    ],
  );

  static const _jobPricePeriodOptions = [
    'Per Month',
    'Per Day',
    'Per Hour',
    'Per Project',
  ];
  static const _jobPricePeriodOptionsNe = [
    'प्रति महिना',
    'प्रति दिन',
    'प्रति घण्टा',
    'प्रति परियोजना',
  ];

  // ============================================
  // OVERSEAS JOBS FIELDS
  // ============================================

  static const _recruiterLicense = FormFieldModel(
    name: 'recruiterLicense',
    label: 'Recruitment Licence No. (DoFE)',
    labelNe: 'भर्ना इजाजतपत्र नं. (वैदेशिक रोजगार विभाग)',
    type: FieldType.text,
    placeholder: 'Enter licence number',
    placeholderNe: 'इजाजतपत्र नम्बर लेख्नुहोस्',
  );

  static const _contractDuration = FormFieldModel(
    name: 'contractDuration',
    label: 'Contract Duration',
    labelNe: 'करार अवधि',
    type: FieldType.select,
    options: ['1 year', '2 years', '3 years', '3+ years'],
    optionsNe: ['१ वर्ष', '२ वर्ष', '३ वर्ष', '३+ वर्ष'],
  );

  static const _genderRequirement = FormFieldModel(
    name: 'genderRequirement',
    label: 'Gender Requirement',
    labelNe: 'लिङ्ग आवश्यकता',
    type: FieldType.select,
    options: ['Male', 'Female', 'Both'],
    optionsNe: ['पुरुष', 'महिला', 'दुवै'],
  );

  static const _benefits = FormFieldModel(
    name: 'benefits',
    label: 'Benefits',
    labelNe: 'सुविधाहरू',
    type: FieldType.multiselect,
    options: [
      'Food',
      'Accommodation',
      'Transport',
      'Medical Insurance',
      'Overtime',
    ],
    optionsNe: ['खाना', 'बसोबास', 'यातायात', 'चिकित्सा बीमा', 'ओभरटाइम'],
  );

  static FormFieldModel _salaryCurrency(List<String> options) => FormFieldModel(
    name: 'salaryCurrency',
    label: 'Salary Currency',
    labelNe: 'तलब मुद्रा',
    type: FieldType.select,
    options: options,
    optionsNe: _sameInNepali,
  );

  static const _serviceCharge = FormFieldModel(
    name: 'serviceCharge',
    label: 'Service Charge',
    labelNe: 'सेवा शुल्क',
    type: FieldType.select,
    options: [
      'Free Visa Free Ticket',
      'As per Government Rule',
      'Contact for Details',
    ],
    optionsNe: [
      'निःशुल्क भिसा निःशुल्क टिकट',
      'सरकारी नियम अनुसार',
      'विवरणका लागि सम्पर्क गर्नुहोस्',
    ],
  );

  /// The eight Overseas Jobs subcategories differ only by currency.
  static List<FormFieldModel> _overseasJobFields(List<String> currencies) => [
    _companyName(
      label: 'Recruiting Agency / Employer',
      labelNe: 'भर्ना एजेन्सी / रोजगारदाता',
    ),
    _recruiterLicense,
    _contractDuration,
    _genderRequirement,
    _experience,
    _benefits,
    _salaryCurrency(currencies),
    _serviceCharge,
  ];

  // ============================================
  // HOME & LIVING FIELDS
  // ============================================

  static FormFieldModel _furnitureType(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'furnitureType',
    label: 'Furniture Type',
    labelNe: 'फर्निचर प्रकार',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _furnitureMaterials = [
    'Wood (Sal/Teak/Sisau)',
    'Plywood',
    'MDF',
    'Metal',
    'Plastic',
    'Glass',
    'Cane/Bamboo',
    'Rexine',
    'Mixed',
  ];
  static const _furnitureMaterialsNe = [
    'काठ (साल/टिक/सिसौ)',
    'प्लाइउड',
    'एमडीएफ',
    'धातु',
    'प्लास्टिक',
    'सिसा',
    'बेत/बाँस',
    'रेक्जिन',
    'मिश्रित',
  ];

  static FormFieldModel _dimensions({
    String label = 'Dimensions (L x W x H)',
    String labelNe = 'आयाम (ल x चौ x उ)',
    String placeholder = 'e.g., 6ft x 4ft x 2.5ft',
    String placeholderNe = 'जस्तै, ६ फिट x ४ फिट x २.५ फिट',
  }) => FormFieldModel(
    name: 'dimensions',
    label: label,
    labelNe: labelNe,
    type: FieldType.text,
    placeholder: placeholder,
    placeholderNe: placeholderNe,
  );

  static FormFieldModel _seatingCapacity(
    List<String> options,
    List<String> optionsNe,
  ) => FormFieldModel(
    name: 'seatingCapacity',
    label: 'Seater',
    labelNe: 'सिटर',
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  // ============================================
  // BUSINESS, AGRICULTURE & HOBBY FIELDS
  // ============================================

  static FormFieldModel _machineryType(
    List<String> options,
    List<String> optionsNe, {
    String label = 'Machinery Type',
    String labelNe = 'मेसिनरी प्रकार',
  }) => FormFieldModel(
    name: 'machineryType',
    label: label,
    labelNe: labelNe,
    type: FieldType.select,
    options: options,
    optionsNe: optionsNe,
  );

  static const _powerSource = FormFieldModel(
    name: 'powerSource',
    label: 'Power Source',
    labelNe: 'शक्ति स्रोत',
    type: FieldType.select,
    options: [
      'Electric',
      'Electric (3 Phase)',
      'Manual',
      'Diesel',
      'Petrol',
      'Battery',
      'Solar',
    ],
    optionsNe: [
      'बिजुली',
      'बिजुली (३ फेज)',
      'म्यानुअल',
      'डिजेल',
      'पेट्रोल',
      'ब्याट्री',
      'सोलार',
    ],
  );

  static const _cropType = FormFieldModel(
    name: 'cropType',
    label: 'Crop / Plant Name',
    labelNe: 'बाली / बिरुवाको नाम',
    type: FieldType.text,
    placeholder: 'e.g., Rice, Wheat, Tomato',
    placeholderNe: 'जस्तै, धान, गहुँ, गोलभेडा',
  );

  static const _farmingToolType = FormFieldModel(
    name: 'farmingToolType',
    label: 'Farming Tool Type',
    labelNe: 'कृषि औजार प्रकार',
    type: FieldType.select,
    options: [
      'Tractor',
      'Power Tiller',
      'Water Pump',
      'Thresher',
      'Chaff Cutter',
      'Grass Cutter',
      'Milking Machine',
      'Rotavator',
      'Plough',
      'Harvester',
      'Sprayer',
      'Pipes/Irrigation',
      'Hand Tool',
      'Other',
    ],
    optionsNe: [
      'ट्र्याक्टर',
      'पावर टिलर',
      'पानी पम्प',
      'थ्रेसर',
      'चाफ कटर',
      'घाँस काट्ने',
      'दूध दुहुने मेसिन',
      'रोटाभेटर',
      'हलो',
      'हार्भेस्टर',
      'स्प्रेयर',
      'पाइप/सिँचाइ',
      'हात औजार',
      'अन्य',
    ],
  );

  static const _sportType = FormFieldModel(
    name: 'sportType',
    label: 'Sport Type',
    labelNe: 'खेलकुद प्रकार',
    type: FieldType.select,
    options: [
      'Cricket',
      'Football',
      'Futsal',
      'Badminton',
      'Basketball',
      'Volleyball',
      'Table Tennis',
      'Cycling',
      'Swimming',
      'Trekking',
      'Martial Arts',
      'Other',
    ],
    optionsNe: [
      'क्रिकेट',
      'फुटबल',
      'फुटसल',
      'ब्याडमिन्टन',
      'बास्केटबल',
      'भलिबल',
      'टेबल टेनिस',
      'साइक्लिङ',
      'पौडी',
      'ट्रेकिङ',
      'मार्सल आर्ट',
      'अन्य',
    ],
  );

  static const _equipmentType = FormFieldModel(
    name: 'equipmentType',
    label: 'Equipment Type',
    labelNe: 'उपकरण प्रकार',
    type: FieldType.select,
    options: [
      'Treadmill',
      'Exercise Bike',
      'Elliptical',
      'Dumbbells',
      'Home Gym',
      'Bench',
      'Yoga/Mats',
      'Supplements',
      'Other',
    ],
    optionsNe: [
      'ट्रेडमिल',
      'एक्सरसाइज बाइक',
      'एलिप्टिकल',
      'डम्बेल',
      'होम जिम',
      'बेन्च',
      'योगा/म्याट',
      'सप्लिमेन्ट',
      'अन्य',
    ],
  );

  static const _instrumentType = FormFieldModel(
    name: 'instrumentType',
    label: 'Instrument Type',
    labelNe: 'बाजा प्रकार',
    type: FieldType.select,
    options: [
      'Guitar',
      'Keyboard/Piano',
      'Drums',
      'Violin',
      'Flute/Bansuri',
      'Madal',
      'Tabla',
      'Sarangi',
      'Harmonium',
      'Ukulele',
      'Other',
    ],
    optionsNe: [
      'गिटार',
      'किबोर्ड/पियानो',
      'ड्रम्स',
      'भायोलिन',
      'बाँसुरी',
      'मादल',
      'तबला',
      'सारंगी',
      'हार्मोनियम',
      'युकुलेले',
      'अन्य',
    ],
  );

  static const _kidsItemType = FormFieldModel(
    name: 'itemType',
    label: 'Item Type',
    labelNe: 'सामान प्रकार',
    type: FieldType.select,
    options: [
      'Toys',
      'Stroller',
      'Car Seat',
      'Carrier',
      'Crib',
      'High Chair',
      'Walker',
      'School Bag',
      'Ride-on',
      'Books',
      'Other',
    ],
    optionsNe: [
      'खेलौना',
      'स्ट्रोलर',
      'कार सिट',
      'क्यारियर',
      'क्रिब',
      'हाई चेयर',
      'वाकर',
      'स्कुल ब्याग',
      'राइड-अन',
      'किताब',
      'अन्य',
    ],
  );

  static const _mediaType = FormFieldModel(
    name: 'mediaType',
    label: 'Media Type',
    labelNe: 'मिडिया प्रकार',
    type: FieldType.select,
    options: [
      'Book',
      'Textbook',
      'Magazine',
      'Comics',
      'Music CD/Vinyl',
      'Movie DVD',
      'Other',
    ],
    optionsNe: [
      'किताब',
      'पाठ्यपुस्तक',
      'म्यागजिन',
      'कमिक्स',
      'म्युजिक सीडी/भाइनल',
      'मुभी डीभीडी',
      'अन्य',
    ],
  );

  static const _authorPublisher = FormFieldModel(
    name: 'authorPublisher',
    label: 'Author / Publisher',
    labelNe: 'लेखक / प्रकाशक',
    type: FieldType.text,
    placeholder: 'e.g., Ratna Pustak Bhandar',
    placeholderNe: 'जस्तै, रत्न पुस्तक भण्डार',
  );

  static const _mediaLanguage = FormFieldModel(
    name: 'language',
    label: 'Language',
    labelNe: 'भाषा',
    type: FieldType.select,
    options: ['Nepali', 'English', 'Hindi', 'Other'],
    optionsNe: ['नेपाली', 'अंग्रेजी', 'हिन्दी', 'अन्य'],
  );

  static const _organic = FormFieldModel(
    name: 'organic',
    label: 'Farming Method',
    labelNe: 'खेती विधि',
    type: FieldType.select,
    options: ['Organic', 'Conventional'],
    optionsNe: ['अर्गानिक', 'सामान्य'],
  );

  // ============================================
  // SUBCATEGORY CONFIGS - keyed by EXACT database subcategory name
  // ============================================

  static final Map<String, List<FormFieldModel>> _subcategoryConfigs = {
    // -- MOBILES ------------------------------
    'Mobile Phones': [
      _conditionRequired,
      _brandSelect([
        'Apple',
        'Samsung',
        'Xiaomi',
        'Redmi',
        'Realme',
        'Oppo',
        'Vivo',
        'OnePlus',
        'Tecno',
        'Infinix',
        'Nokia',
        'Motorola',
        'Huawei',
        'Honor',
        'Other',
      ]),
      _model('e.g., iPhone 15 Pro, Galaxy S24'),
      _storage(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']),
      _ram(['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB']),
      _batteryHealth,
      const FormFieldModel(
        name: 'boxAndBill',
        label: 'Box & Bill',
        labelNe: 'बक्स र बिल',
        type: FieldType.select,
        options: ['Both Box & Bill', 'Box Only', 'Bill Only', 'Neither'],
        optionsNe: ['बक्स र बिल दुवै', 'बक्स मात्र', 'बिल मात्र', 'दुवै छैन'],
      ),
      _warranty,
    ],
    'Mobile Phone Accessories': [
      _conditionRequired,
      _accessoryType(
        [
          'Case/Cover',
          'Screen Protector',
          'Charger/Cable',
          'Power Bank',
          'Earphones',
          'Speaker',
          'Selfie Stick',
          'Memory Card',
          'Mount/Holder',
          'Other',
        ],
        [
          'कभर',
          'स्क्रिन प्रोटेक्टर',
          'चार्जर/केबल',
          'पावर ब्यांक',
          'इयरफोन',
          'स्पिकर',
          'सेल्फी स्टिक',
          'मेमोरी कार्ड',
          'होल्डर',
          'अन्य',
        ],
      ),
      _brand('e.g., Spigen, Anker, Samsung, Apple'),
      _warranty,
    ],
    'Mobile Phone Services': [
      _serviceType(
        [
          'Screen Repair',
          'Battery Replacement',
          'Software/Flashing',
          'Water Damage',
          'Unlocking/IMEI',
          'Data Recovery',
          'Buy-Back',
          'Other',
        ],
        [
          'स्क्रिन मर्मत',
          'ब्याट्री परिवर्तन',
          'सफ्टवेयर/फ्ल्यासिङ',
          'पानी क्षति',
          'अनलक/आईएमईआई',
          'डाटा रिकभरी',
          'बाइ-ब्याक',
          'अन्य',
        ],
      ),
      _serviceLocation(_serviceLocationOptions, _serviceLocationOptionsNe),
      _experience,
    ],
    'SIM Cards': [
      const FormFieldModel(
        name: 'networkOperator',
        label: 'Network Operator',
        labelNe: 'नेटवर्क सेवा प्रदायक',
        type: FieldType.select,
        options: ['NTC', 'Ncell', 'Smart Cell', 'Hello Nepal', 'Other'],
        optionsNe: ['एनटीसी', 'एनसेल', 'स्मार्ट सेल', 'हेलो नेपाल', 'अन्य'],
      ),
      const FormFieldModel(
        name: 'numberType',
        label: 'Number Type',
        labelNe: 'नम्बर प्रकार',
        type: FieldType.select,
        options: ['Normal', 'VIP / Golden Number'],
        optionsNe: ['सामान्य', 'भीआईपी / गोल्डेन नम्बर'],
      ),
      const FormFieldModel(
        name: 'simType',
        label: 'SIM Type',
        labelNe: 'सिम प्रकार',
        type: FieldType.select,
        options: ['Prepaid', 'Postpaid', 'Data Only'],
        optionsNe: ['प्रिपेड', 'पोस्टपेड', 'डाटा मात्र'],
      ),
    ],
    'Wearables': [
      _conditionRequired,
      const FormFieldModel(
        name: 'wearableType',
        label: 'Wearable Type',
        labelNe: 'वेयरेबल प्रकार',
        type: FieldType.select,
        options: [
          'Smartwatch',
          'Fitness Band',
          'Smart Ring',
          'Kids GPS Watch',
          'Earbuds/Wearable',
          'Other',
        ],
        optionsNe: [
          'स्मार्टवाच',
          'फिटनेस ब्यान्ड',
          'स्मार्ट रिङ',
          'बच्चाको जीपीएस घडी',
          'इयरबड्स',
          'अन्य',
        ],
      ),
      _brand('e.g., Apple, Samsung, Fitbit, Garmin, Boat'),
      _model('e.g., Apple Watch Series 9, Galaxy Watch 6'),
      const FormFieldModel(
        name: 'compatibility',
        label: 'Compatibility',
        labelNe: 'मिल्ने प्रणाली',
        type: FieldType.select,
        options: ['Android', 'iOS', 'Both'],
        optionsNe: ['एन्ड्रोइड', 'आईओएस', 'दुवै'],
      ),
      _warranty,
    ],

    // -- ELECTRONICS --------------------------
    'Tablets & Accessories': [
      _conditionRequired,
      _brand('e.g., Apple, Samsung, Huawei'),
      _model('e.g., iPad Pro, Galaxy Tab'),
      _storage(['32GB', '64GB', '128GB', '256GB', '512GB', '1TB']),
      const FormFieldModel(
        name: 'connectivity',
        label: 'Connectivity',
        labelNe: 'कनेक्टिभिटी',
        type: FieldType.select,
        options: ['WiFi only', 'WiFi + Cellular'],
        optionsNe: ['वाइफाइ मात्र', 'वाइफाइ + सेलुलर'],
      ),
      _batteryHealth,
      _warranty,
    ],
    'Laptops': [
      _conditionRequired,
      _brandSelect([
        'Dell',
        'HP',
        'Lenovo',
        'Apple',
        'Asus',
        'Acer',
        'MSI',
        'Microsoft',
        'Samsung',
        'Other',
      ]),
      _model('e.g., MacBook Pro, ThinkPad X1'),
      _processor,
      _ram(['4GB', '8GB', '16GB', '32GB', '64GB']),
      _storage([
        '128GB SSD',
        '256GB SSD',
        '512GB SSD',
        '1TB SSD',
        '1TB HDD',
        '2TB HDD',
        'SSD + HDD (Dual)',
      ]),
      _graphics,
      _screenSize([
        '11.6 in',
        '13.3 in',
        '14 in',
        '15.6 in',
        '16 in',
        '17.3 in',
      ]),
      _batteryHealth,
      _warranty,
    ],
    'Desktop Computers': [
      _conditionRequired,
      _brand('e.g., Dell, HP, Custom Build'),
      _model('Enter model name'),
      _processor,
      _ram(['4GB', '8GB', '16GB', '32GB', '64GB']),
      _storage([
        '256GB SSD',
        '512GB SSD',
        '1TB SSD',
        '1TB HDD',
        '2TB HDD',
        '4TB HDD',
        'SSD + HDD (Dual)',
      ]),
      _graphics,
      const FormFieldModel(
        name: 'monitorIncluded',
        label: 'Monitor Included',
        labelNe: 'मोनिटर सहित',
        type: FieldType.select,
        options: ['Yes - Full Setup', 'No - CPU Only'],
        optionsNe: ['छ - पूरा सेटअप', 'छैन - सीपीयू मात्र'],
      ),
      _warranty,
    ],
    'TVs': [
      _conditionRequired,
      _brandSelect([
        'Samsung',
        'LG',
        'Sony',
        'TCL',
        'Hisense',
        'CG',
        'Yasuda',
        'Himstar',
        'Colors',
        'Panasonic',
        'Other',
      ]),
      _model('Enter model name'),
      _screenSize([
        '24 in',
        '32 in',
        '40 in',
        '43 in',
        '50 in',
        '55 in',
        '65 in',
        '75 in',
        '85 in+',
      ]),
      _screenResolution,
      _smartFeatures,
      _warranty,
    ],
    'TV & Video Accessories': [
      _conditionRequired,
      _accessoryType(
        [
          'Set-Top Box',
          'Streaming Device',
          'Soundbar',
          'Wall Mount',
          'Remote',
          'Projector',
          'DVD/Blu-ray Player',
          'Cables',
          'Other',
        ],
        [
          'सेट-टप बक्स',
          'स्ट्रिमिङ डिभाइस',
          'साउन्डबार',
          'वाल माउन्ट',
          'रिमोट',
          'प्रोजेक्टर',
          'डीभीडी प्लेयर',
          'केबल',
          'अन्य',
        ],
      ),
      _brand('e.g., Dish Home, WorldLink, Xiaomi, JBL'),
      _model('Enter model name'),
      _warranty,
    ],
    'Cameras, Camcorders & Accessories': [
      _conditionRequired,
      const FormFieldModel(
        name: 'cameraType',
        label: 'Camera Type',
        labelNe: 'क्यामेरा प्रकार',
        type: FieldType.select,
        options: [
          'DSLR',
          'Mirrorless',
          'Point & Shoot',
          'Action Camera',
          'Camcorder',
          'Drone',
          'Lens',
          'Tripod/Gimbal',
          'Lighting',
          'Other',
        ],
        optionsNe: [
          'डीएसएलआर',
          'मिररलेस',
          'पोइन्ट एन्ड सुट',
          'एक्सन क्यामेरा',
          'क्यामकोर्डर',
          'ड्रोन',
          'लेन्स',
          'ट्राइपड/जिम्बल',
          'लाइटिङ',
          'अन्य',
        ],
      ),
      _brand('e.g., Canon, Nikon, Sony, GoPro'),
      _model('e.g., EOS R5, A7 IV'),
      _sensorSize,
      _megapixels,
      _warranty,
    ],
    'Laptop & Computer Accessories': [
      _conditionRequired,
      _accessoryType(
        [
          'Monitor',
          'Keyboard/Mouse',
          'Printer/Scanner',
          'Storage Drive',
          'RAM/Components',
          'Graphics Card',
          'Router',
          'UPS',
          'Laptop Bag',
          'Cooling Pad',
          'Webcam',
          'Other',
        ],
        [
          'मोनिटर',
          'किबोर्ड/माउस',
          'प्रिन्टर/स्क्यानर',
          'स्टोरेज ड्राइभ',
          'र्‍याम/पार्ट्स',
          'ग्राफिक्स कार्ड',
          'राउटर',
          'यूपीएस',
          'ल्यापटप ब्याग',
          'कुलिङ प्याड',
          'वेबक्याम',
          'अन्य',
        ],
      ),
      _brand('e.g., Logitech, Razer, Corsair'),
      _model('Enter model name'),
      _warranty,
    ],
    'Audio & Sound Systems': [
      _conditionRequired,
      const FormFieldModel(
        name: 'audioType',
        label: 'Audio Type',
        labelNe: 'अडियो प्रकार',
        type: FieldType.select,
        options: [
          'Headphones',
          'Earbuds (TWS)',
          'Bluetooth Speaker',
          'Home Theatre',
          'Soundbar',
          'Amplifier',
          'DJ/PA System',
          'Microphone',
          'Studio Monitor',
          'Other',
        ],
        optionsNe: [
          'हेडफोन',
          'इयरबड्स',
          'ब्लुटुथ स्पिकर',
          'होम थिएटर',
          'साउन्डबार',
          'एम्प्लिफायर',
          'डीजे/पीए सिस्टम',
          'माइक्रोफोन',
          'स्टुडियो मोनिटर',
          'अन्य',
        ],
      ),
      _brand('e.g., Sony, Bose, JBL, Sennheiser'),
      _model('Enter model name'),
      _warranty,
    ],
    'Video Game Consoles & Accessories': [
      _conditionRequired,
      const FormFieldModel(
        name: 'gamingItemType',
        label: 'Item Type',
        labelNe: 'सामान प्रकार',
        type: FieldType.select,
        options: [
          'Console',
          'Game',
          'Controller',
          'VR Headset',
          'Accessory',
          'Other',
        ],
        optionsNe: [
          'कन्सोल',
          'गेम',
          'कन्ट्रोलर',
          'भीआर हेडसेट',
          'सामान',
          'अन्य',
        ],
      ),
      _brand('e.g., Sony, Microsoft, Nintendo'),
      _model('e.g., PS5, Xbox Series X, Switch'),
      _storage(['256GB', '500GB', '512GB', '825GB', '1TB', '2TB']),
      _warranty,
    ],
    'ACs & Home Electronics': [
      _conditionRequired,
      _applianceType(
        [
          'Split AC',
          'Window AC',
          'Portable AC',
          'Cassette/Ducted AC',
          'Air Cooler',
          'Air Purifier',
          'Geyser',
          'Heater',
          'Fan',
          'Other',
        ],
        [
          'स्प्लिट एसी',
          'विन्डो एसी',
          'पोर्टेबल एसी',
          'क्यासेट/डक्टेड एसी',
          'एयर कुलर',
          'एयर प्युरिफायर',
          'गिजर',
          'हिटर',
          'पंखा',
          'अन्य',
        ],
      ),
      _brandSelect([
        'CG',
        'Yasuda',
        'Himstar',
        'Gree',
        'Midea',
        'Hisense',
        'LG',
        'Samsung',
        'Voltas',
        'Daikin',
        'Panasonic',
        'Other',
      ]),
      _model('Enter model name'),
      const FormFieldModel(
        name: 'capacity',
        label: 'Capacity (Ton)',
        labelNe: 'क्षमता (टन)',
        type: FieldType.select,
        options: [
          '0.75 Ton',
          '1 Ton',
          '1.5 Ton',
          '2 Ton',
          '2.5 Ton',
          '3 Ton+',
          'N/A',
        ],
        optionsNe: [
          '०.७५ टन',
          '१ टन',
          '१.५ टन',
          '२ टन',
          '२.५ टन',
          '३ टन+',
          'लागू हुँदैन',
        ],
      ),
      _warranty,
    ],
    'Home Appliances': [
      _conditionRequired,
      _applianceType(
        [
          'Refrigerator',
          'Washing Machine',
          'Microwave',
          'Rice Cooker',
          'Induction Cooker',
          'Gas Stove',
          'Water Purifier',
          'Geyser',
          'Blender/Mixer',
          'Vacuum Cleaner',
          'Iron',
          'Fan',
          'Heater',
          'Other',
        ],
        [
          'रेफ्रिजरेटर',
          'वासिङ मेसिन',
          'माइक्रोवेभ',
          'राइस कुकर',
          'इन्डक्सन',
          'ग्यास चुल्हो',
          'वाटर प्युरिफायर',
          'गिजर',
          'ब्लेन्डर/मिक्सर',
          'भ्याकुम क्लिनर',
          'आइरन',
          'पंखा',
          'हिटर',
          'अन्य',
        ],
      ),
      _brand('e.g., CG, Baltra, Yasuda, Himstar, LG, Samsung'),
      _model('Enter model name'),
      _warranty,
    ],
    'Other Electronics': [
      _conditionRequired,
      _brand('Enter brand name'),
      _model('Enter model name'),
      _warranty,
    ],
    // Both keys are registered so the config survives the approved rename of
    // this subcategory in either direction.
    'Photocopiers': _printerConfig,
    'Printers & Photocopiers': _printerConfig,

    // -- VEHICLES -----------------------------
    'Cars': [
      _conditionRequired,
      _brand('e.g., Toyota, Honda, Hyundai, Suzuki'),
      _model('e.g., Corolla, Civic, i20, Swift'),
      _vehicleYear,
      _bodyType,
      _seats(['2', '4', '5', '7', '8+'], ['२', '४', '५', '७', '८+']),
      _fuelType(
        ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
        ['पेट्रोल', 'डिजेल', 'इलेक्ट्रिक', 'हाइब्रिड', 'सीएनजी'],
      ),
      _transmission,
      _engineCapacity('e.g., 1500'),
      _mileage,
      _owners,
      _registrationYear,
      _registrationLocation,
      _plateType,
      _color,
    ],
    'Motorbikes': [
      _conditionRequired,
      _vehicleType(
        [
          'Scooter',
          'Commuter',
          'Sports',
          'Cruiser',
          'Off-road',
          'Moped',
          'Electric',
        ],
        [
          'स्कुटर',
          'कम्युटर',
          'स्पोर्ट्स',
          'क्रुजर',
          'अफ-रोड',
          'मोपेड',
          'इलेक्ट्रिक',
        ],
      ),
      _brand('e.g., Honda, Yamaha, Bajaj, TVS'),
      _model('e.g., CBR, FZ, Pulsar'),
      _vehicleYear,
      _engineCapacity('e.g., 150cc, 250cc, 400cc'),
      _fuelType(['Petrol', 'Electric'], ['पेट्रोल', 'इलेक्ट्रिक']),
      _mileage,
      _owners,
      _registrationYear,
      _registrationLocation,
      _plateType,
      _color,
    ],
    'Bicycles': [
      _conditionRequired,
      _bicycleType,
      _brand('e.g., Trek, Giant, Hero, Firefox'),
      _frameSize,
      _gears,
    ],
    'Three Wheelers': [
      _conditionRequired,
      _vehicleType(
        [
          'Auto Rickshaw',
          'E-Rickshaw',
          'Safa Tempo',
          'Passenger Tempo',
          'Loader/Cargo',
        ],
        [
          'अटो रिक्सा',
          'ई-रिक्सा',
          'सफा टेम्पो',
          'यात्रु टेम्पो',
          'लोडर/कार्गो',
        ],
      ),
      _brand('e.g., Bajaj, Piaggio, Ape'),
      _model('Enter model name'),
      _vehicleYear,
      _fuelType(
        ['Electric', 'Petrol', 'Diesel', 'CNG'],
        ['इलेक्ट्रिक', 'पेट्रोल', 'डिजेल', 'सीएनजी'],
      ),
      _mileage,
      _owners,
      _registrationYear,
      _plateType,
    ],
    'Trucks': [
      _conditionRequired,
      _vehicleType(
        [
          'Mini Truck/Pickup',
          'Tipper',
          'Tanker',
          'Container',
          'Flatbed',
          'Trailer',
          'Mixer',
          'Crane',
          'Other',
        ],
        [
          'मिनी ट्रक/पिकअप',
          'टिपर',
          'ट्यांकर',
          'कन्टेनर',
          'फ्ल्याटबेड',
          'ट्रेलर',
          'मिक्सर',
          'क्रेन',
          'अन्य',
        ],
      ),
      _brand('e.g., Tata, Ashok Leyland, BharatBenz'),
      _model('Enter model name'),
      _vehicleYear,
      _payloadCapacity,
      _mileage,
      _owners,
      _registrationYear,
      _registrationLocation,
      _plateType,
    ],
    'Buses': [
      _conditionRequired,
      _vehicleType(
        ['Micro', 'Mini', 'Deluxe/Tourist', 'Local', 'School', 'Sleeper'],
        ['माइक्रो', 'मिनी', 'डिलक्स/पर्यटक', 'लोकल', 'स्कुल', 'स्लिपर'],
      ),
      _brand('e.g., Tata, Ashok Leyland, BharatBenz'),
      _model('Enter model name'),
      _vehicleYear,
      _passengerCapacity,
      _fuelType(
        ['Diesel', 'Electric', 'CNG'],
        ['डिजेल', 'इलेक्ट्रिक', 'सीएनजी'],
      ),
      _mileage,
      _owners,
      _registrationYear,
      _registrationLocation,
      _plateType,
      _routePermit,
    ],
    'Vans': [
      _conditionRequired,
      _vehicleType(
        ['Passenger', 'Cargo/Delivery', 'School', 'Micro/Hiace', 'Ambulance'],
        ['यात्रु', 'कार्गो/डेलिभरी', 'स्कुल', 'माइक्रो/हाइस', 'एम्बुलेन्स'],
      ),
      _brand('e.g., Maruti, Tata, Mahindra'),
      _model('Enter model name'),
      _vehicleYear,
      _seats(
        ['2', '4', '5', '7', '9', '11', '14+'],
        ['२', '४', '५', '७', '९', '११', '१४+'],
      ),
      _fuelType(
        ['Diesel', 'Petrol', 'Electric', 'CNG'],
        ['डिजेल', 'पेट्रोल', 'इलेक्ट्रिक', 'सीएनजी'],
      ),
      _transmission,
      _mileage,
      _owners,
      _registrationYear,
      _registrationLocation,
      _plateType,
    ],
    'Heavy Duty': [
      _conditionRequired,
      _vehicleType(
        [
          'Excavator',
          'Backhoe',
          'Wheel Loader',
          'Bulldozer',
          'Crane',
          'Roller',
          'Grader',
          'Tractor',
          'Forklift',
          'Mixer',
          'Drilling Rig',
          'Other',
        ],
        [
          'एक्साभेटर',
          'ब्याकहो',
          'व्हिल लोडर',
          'बुलडोजर',
          'क्रेन',
          'रोलर',
          'ग्रेडर',
          'ट्र्याक्टर',
          'फर्कलिफ्ट',
          'मिक्सर',
          'ड्रिलिङ रिग',
          'अन्य',
        ],
      ),
      _brand('e.g., JCB, Komatsu, Hyundai, CAT, Tata Hitachi'),
      _model('Enter model name'),
      _vehicleYear,
      _operatingHours,
      _owners,
      _registrationYear,
    ],
    'Water Transport': [
      _conditionRequired,
      _boatType,
      _passengerCapacity,
      _brand('e.g., Yamaha (engine), locally built'),
      _model('Enter model name'),
      _vehicleYear,
    ],
    'Auto Parts & Accessories': [
      _conditionRequired,
      _partType,
      _brand('e.g., Bosch, Denso, 3M'),
      _compatibleVehicle,
      _warranty,
    ],
    'Rentals': [
      _vehicleType(
        ['Car', 'Motorcycle', 'Scooter', 'Van', 'Bus', 'Jeep/SUV', 'Truck'],
        ['कार', 'मोटरसाइकल', 'स्कुटर', 'भ्यान', 'बस', 'जिप/एसयूभी', 'ट्रक'],
      ),
      _rentalPeriod,
      _withDriver,
      _seats(
        ['2', '4', '5', '7', '9', '11', '14+'],
        ['२', '४', '५', '७', '९', '११', '१४+'],
      ),
      _transmission,
      _brand('Enter brand name'),
      _model('Enter model name'),
    ],
    'Auto Services': _autoServiceConfig,
    'Maintenance and Repair': _autoServiceConfig,

    // -- PROPERTY -----------------------------
    'Apartments For Sale': [
      _totalArea(label: 'Built-up Area', labelNe: 'निर्मित क्षेत्रफल'),
      _areaUnit,
      _bedrooms,
      _bathrooms,
      _floorNumber,
      _totalFloors,
      _furnishing(),
      _buildYear,
      _facing,
      _parking(_parkingOptions, _parkingOptionsNe),
      _amenities(_apartmentAmenities, _apartmentAmenitiesNe),
      _googleMapsLink,
    ],
    'Apartment Rentals': [
      _totalArea(label: 'Built-up Area', labelNe: 'निर्मित क्षेत्रफल'),
      _areaUnit,
      _bedrooms,
      _bathrooms,
      _floorNumber,
      _totalFloors,
      _furnishing(),
      _facing,
      _parking(_parkingOptions, _parkingOptionsNe),
      _amenities(_apartmentAmenities, _apartmentAmenitiesNe),
      _preferredTenant,
      _securityDeposit(_depositOptions, _depositOptionsNe),
      _availableFrom,
      _googleMapsLink,
    ],
    'Houses For Sale': [
      _propertyType(
        [
          'Bungalow',
          'Duplex',
          'Semi-detached',
          'Row House',
          'Villa',
          'Traditional',
        ],
        [
          'बंगला',
          'डुप्लेक्स',
          'सेमी-डिटेच्ड',
          'रो हाउस',
          'भिल्ला',
          'परम्परागत',
        ],
      ),
      _totalArea(label: 'Land Area', labelNe: 'जमिन क्षेत्रफल'),
      _areaUnit,
      _builtUpArea,
      _bedrooms,
      _bathrooms,
      _totalFloors,
      _constructionType,
      _buildYear,
      _facing,
      _roadAccess,
      _roadSize,
      _parking(_parkingOptions, _parkingOptionsNe),
      _amenities(_houseAmenities, _houseAmenitiesNe),
      _googleMapsLink,
    ],
    'House Rentals': [
      _propertyType(
        [
          'Full House',
          'Flat in House',
          'Half House',
          'Ground Floor',
          'Top Floor',
        ],
        [
          'पूरा घर',
          'घरभित्रको फ्ल्याट',
          'आधा घर',
          'भुइँ तल्ला',
          'माथिल्लो तल्ला',
        ],
      ),
      _totalArea(),
      _areaUnit,
      _bedrooms,
      _bathrooms,
      _furnishing(),
      _facing,
      _parking(_parkingOptions, _parkingOptionsNe),
      _amenities(_houseRentalAmenities, _houseRentalAmenitiesNe),
      _preferredTenant,
      _securityDeposit(_depositOptions, _depositOptionsNe),
      _availableFrom,
      _googleMapsLink,
    ],
    'Land For Sale': [
      _totalArea(label: 'Land Area', labelNe: 'जमिन क्षेत्रफल'),
      _areaUnit,
      _landType,
      _roadAccess,
      _roadSize,
      _facing,
      _googleMapsLink,
    ],
    'Land Rentals': [
      _totalArea(label: 'Land Area', labelNe: 'जमिन क्षेत्रफल'),
      _areaUnit,
      _landType,
      _roadAccess,
      _roadSize,
      _facing,
      _availableFrom,
      _googleMapsLink,
    ],
    'Commercial Properties For Sale': [
      _propertyType(
        [
          'Office',
          'Shop',
          'Showroom',
          'Warehouse',
          'Factory',
          'Restaurant',
          'Hotel',
          'Complex',
        ],
        [
          'कार्यालय',
          'पसल',
          'शोरूम',
          'गोदाम',
          'कारखाना',
          'रेस्टुरेन्ट',
          'होटल',
          'कम्प्लेक्स',
        ],
      ),
      _totalArea(),
      _areaUnit,
      _floorNumber,
      _buildYear,
      _roadAccess,
      _roadSize,
      _parking(_commercialParkingOptions, _commercialParkingOptionsNe),
      _amenities(_commercialAmenities, _commercialAmenitiesNe),
      _googleMapsLink,
    ],
    'Commercial Property Rentals': [
      _propertyType(
        [
          'Office',
          'Shop',
          'Showroom',
          'Warehouse',
          'Factory',
          'Restaurant',
          'Hotel',
          'Complex',
        ],
        [
          'कार्यालय',
          'पसल',
          'शोरूम',
          'गोदाम',
          'कारखाना',
          'रेस्टुरेन्ट',
          'होटल',
          'कम्प्लेक्स',
        ],
      ),
      _totalArea(),
      _areaUnit,
      _floorNumber,
      _furnishing(label: 'Fit-out Status', labelNe: 'सजावट अवस्था'),
      _roadAccess,
      _parking(_commercialParkingOptions, _commercialParkingOptionsNe),
      _amenities(_commercialAmenities, _commercialAmenitiesNe),
      _securityDeposit(_commercialDepositOptions, _commercialDepositOptionsNe),
      _availableFrom,
      _googleMapsLink,
    ],
    'Room Rentals': [
      _roomType,
      _furnishing(),
      _preferredTenant,
      _amenities(_roomAmenities, _roomAmenitiesNe),
      _securityDeposit(_depositOptions, _depositOptionsNe),
      _availableFrom,
      _googleMapsLink,
    ],

    // -- MEN'S FASHION & GROOMING -------------
    'Shirts & T-Shirts': [
      _conditionOptional,
      _brand('e.g., Nike, Adidas, Zara, H&M'),
      _clothingType(
        ['Shirt', 'T-Shirt', 'Polo', 'Tank Top'],
        ['सर्ट', 'टी-सर्ट', 'पोलो', 'ट्यांक टप'],
      ),
      _size,
      _fitType,
      _sleeveType,
      _color,
    ],
    'Pants': [
      _conditionOptional,
      _brand("e.g., Levi's, Zara, H&M"),
      _clothingType(
        ['Jeans', 'Chinos', 'Formal Pants', 'Track Pants', 'Shorts'],
        ['जिन्स', 'चिनोज', 'फर्मल प्यान्ट', 'ट्र्याक प्यान्ट', 'हाफ प्यान्ट'],
      ),
      _waistSize,
      _fitType,
      _color,
    ],
    'Jacket & Coat': [
      _conditionOptional,
      _brand('e.g., Nike, Zara, North Face'),
      _clothingType(
        ['Jacket', 'Coat', 'Blazer', 'Hoodie', 'Windbreaker'],
        ['ज्याकेट', 'कोट', 'ब्लेजर', 'हुडी', 'विन्डब्रेकर'],
      ),
      _size,
      _fitType,
      _color,
    ],
    'Traditional Clothing': [
      _conditionOptional,
      _brand('Enter brand name'),
      _clothingType(
        [
          'Daura Suruwal',
          'Dhaka Topi',
          'Topi',
          'Dhoti',
          'Kurta',
          'Sherwani',
          'Other',
        ],
        [
          'दौरा सुरुवाल',
          'ढाका टोपी',
          'टोपी',
          'धोती',
          'कुर्ता',
          'शेरवानी',
          'अन्य',
        ],
      ),
      _size,
      _fabric(
        [
          'Cotton',
          'Silk',
          'Dhaka',
          'Wool/Pashmina',
          'Linen',
          'Synthetic',
          'Mixed',
        ],
        ['सुती', 'रेशम', 'ढाका', 'ऊन/पस्मिना', 'लिनेन', 'सिन्थेटिक', 'मिश्रित'],
      ),
      _color,
    ],
    'Grooming & Bodycare': [
      _brand('e.g., Nivea, Gillette, Park Avenue'),
      _productWeight(),
      _expiryDate(),
    ],

    // Shared between Men's and Women's (one config, two DB rows)
    'Footwear': [
      _conditionOptional,
      _brand('e.g., Nike, Adidas, Puma, Bata'),
      _footwearType,
      _shoeSize,
      _color,
    ],
    'Watches': [
      _conditionOptional,
      _brand('e.g., Casio, Fossil, Titan, Apple'),
      _watchType,
      _strapMaterial,
      _color,
    ],
    'Bags & Accessories': [
      _conditionOptional,
      _brand('e.g., Tommy Hilfiger, Michael Kors, Wildcraft'),
      _bagAccessoryType,
      _material(
        ['Leather', 'PU Leather', 'Canvas', 'Nylon', 'Fabric', 'Other'],
        ['छाला', 'पीयू छाला', 'क्यानभास', 'नाइलन', 'कपडा', 'अन्य'],
      ),
      _color,
    ],
    'Optical & Sunglasses': [
      _conditionOptional,
      _brand('e.g., Ray-Ban, Oakley, Titan'),
      _eyewearType,
      _color,
    ],
    'Wholesale - Bulk': [
      _conditionOptional,
      _brand('Enter brand name'),
      _minOrderQuantity,
      _quantity,
    ],
    "Baby Boy's Fashion": [
      _conditionOptional,
      _brand("e.g., Carter's, Mothercare, Next"),
      _ageGroup,
      _color,
    ],
    "Baby Girl's Fashion": [
      _conditionOptional,
      _brand("e.g., Carter's, Mothercare, Next"),
      _ageGroup,
      _color,
    ],

    // -- WOMEN'S FASHION & BEAUTY -------------
    'Western Wear': [
      _conditionOptional,
      _brand('e.g., Zara, H&M, Forever 21, Max'),
      _clothingType(
        ['Dress', 'Top', 'Jeans', 'Skirt', 'Leggings', 'Jacket', 'Coat'],
        ['ड्रेस', 'टप', 'जिन्स', 'स्कर्ट', 'लेगिङ्स', 'ज्याकेट', 'कोट'],
      ),
      _size,
      _fitType,
      _color,
    ],
    'Traditional Wear': [
      _conditionOptional,
      _brand('Enter brand name'),
      _clothingType(
        [
          'Saree',
          'Kurta',
          'Kurtha Suruwal',
          'Lehenga',
          'Gunyo Cholo',
          'Sherwani',
          'Dhoti',
          'Topi',
          'Other',
        ],
        [
          'साडी',
          'कुर्ता',
          'कुर्था सुरुवाल',
          'लेहंगा',
          'गुन्यो चोलो',
          'शेरवानी',
          'धोती',
          'टोपी',
          'अन्य',
        ],
      ),
      _size,
      _fabric(
        [
          'Cotton',
          'Silk',
          'Georgette',
          'Chiffon',
          'Banarasi',
          'Dhaka',
          'Wool/Pashmina',
          'Synthetic',
          'Mixed',
        ],
        [
          'सुती',
          'रेशम',
          'जर्जेट',
          'सिफन',
          'बनारसी',
          'ढाका',
          'ऊन/पस्मिना',
          'सिन्थेटिक',
          'मिश्रित',
        ],
      ),
      _color,
    ],
    'Winter Wear': [
      _conditionOptional,
      _brand('e.g., North Face, Columbia, Zara'),
      _clothingType(
        [
          'Jacket',
          'Coat',
          'Sweater',
          'Hoodie',
          'Shawl/Pashmina',
          'Thermal',
          'Gloves',
          'Cap',
          'Muffler',
          'Other',
        ],
        [
          'ज्याकेट',
          'कोट',
          'स्वेटर',
          'हुडी',
          'शल/पस्मिना',
          'थर्मल',
          'पन्जा',
          'टोपी',
          'मफलर',
          'अन्य',
        ],
      ),
      _size,
      _color,
    ],
    'Jewellery & Watches': [
      _conditionOptional,
      _brand('e.g., Tanishq, Swarovski, Fossil'),
      _jewelleryMaterial,
      _watchType,
      _strapMaterial,
      _color,
    ],
    'Beauty & Personal Care': [
      _brand("e.g., L'Oreal, Nivea, Garnier, Himalaya"),
      _productWeight(),
      _expiryDate(),
    ],
    'Lingerie & Sleepwear': [_brand('Enter brand name'), _size, _color],

    // -- PETS & ANIMALS -----------------------
    'Pets': [
      _animalType(_petAnimalTypes, _petAnimalTypesNe),
      _breed(placeholder: 'e.g., Golden Retriever, Persian Cat, Parrot'),
      _petAge,
      _petGender,
      _petColor,
      _vaccination,
      _petPapers,
      _trained,
      _friendlyWith,
    ],
    'Farm Animals': [
      _animalType(_farmAnimalTypes, _farmAnimalTypesNe),
      _breed(placeholder: 'e.g., Jersey, Murrah, Khari'),
      _petAge,
      _petGender,
      _animalWeight,
      _priceUnit(
        ['Per Animal', 'Per Kg (live weight)'],
        ['प्रति जनावर', 'प्रति के.जी. (जिउँदो तौल)'],
      ),
      _milkYield,
      _vaccination,
    ],
    'Other Pets & Animals': [
      _animalType(_petAnimalTypes, _petAnimalTypesNe),
      _breed(label: 'Breed / Species', labelNe: 'जात / प्रजाति'),
      _petAge,
      _petGender,
      _petColor,
    ],
    // B-17: dog food cannot require a "Brand New" declaration - condition is
    // hidden for this subcategory by policy and is not declared here.
    'Pet & Animal food': [
      _suitableFor,
      _brand('e.g., Pedigree, Royal Canin, Whiskas'),
      _productWeight(label: 'Pack Size', labelNe: 'प्याक साइज'),
      _expiryDate(),
    ],
    'Pet & Animal Accessories': [
      _productType(
        [
          'Cage/Kennel',
          'Aquarium',
          'Leash',
          'Collar',
          'Bedding',
          'Bowls',
          'Grooming',
          'Toys',
          'Pet Clothing',
          'Veterinary',
          'Livestock Equipment',
          'Other',
        ],
        [
          'पिंजरा/केनेल',
          'एक्वेरियम',
          'डोरी',
          'कलर',
          'ओछ्यान',
          'भाँडा',
          'सफाइ',
          'खेलौना',
          'पाल्तु लुगा',
          'पशु चिकित्सा',
          'पशुपालन उपकरण',
          'अन्य',
        ],
      ),
      _suitableFor,
      _conditionOptional,
      _brand('Enter brand name'),
    ],

    // -- SERVICES -----------------------------
    'Building maintenance': [
      _serviceType(
        [
          'Plumbing',
          'Electrical',
          'Painting',
          'Masonry/Tiling',
          'Carpentry',
          'Cleaning',
          'Pest Control',
          'Waterproofing',
          'Welding/Grill',
          'House Shifting',
          'Other',
        ],
        [
          'प्लम्बिङ',
          'इलेक्ट्रिकल',
          'रङ्गरोगन',
          'डकर्मी/टायल',
          'सिकर्मी',
          'सफाइ',
          'किरा नियन्त्रण',
          'वाटरप्रुफिङ',
          'वेल्डिङ/ग्रिल',
          'घरसारी',
          'अन्य',
        ],
      ),
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _pricePeriod(
        ['Per Hour', 'Per Visit', 'Per Day', 'Per Project', 'Free Inspection'],
        [
          'प्रति घण्टा',
          'प्रति भिजिट',
          'प्रति दिन',
          'प्रति परियोजना',
          'निःशुल्क निरीक्षण',
        ],
      ),
    ],
    'Domestic & Daycare Services': [
      _serviceType(
        [
          'House Maid',
          'Cook',
          'Nanny',
          'Elderly Care',
          'Daycare Centre',
          'Housekeeping',
          'Domestic Driver',
          'Other',
        ],
        [
          'घरेलु सहयोगी',
          'भान्से',
          'बच्चा हेर्ने',
          'वृद्ध हेरचाह',
          'डे-केयर केन्द्र',
          'हाउसकिपिङ',
          'घरेलु चालक',
          'अन्य',
        ],
      ),
      _serviceLocation(
        ['At Customer Home', 'At Daycare Centre'],
        ['ग्राहकको घरमा', 'डे-केयर केन्द्रमा'],
      ),
      _availability(
        ['Full Day', 'Half Day', 'Live-in', 'Weekdays', 'Weekends', 'On-Call'],
        [
          'पूरा दिन',
          'आधा दिन',
          'बस्ने (लिभ-इन)',
          'हप्ताका दिन',
          'शनिबार/आइतबार',
          'अन-कल',
        ],
      ),
      _experience,
      _languages(_languageOptions, _languageOptionsNe),
      _pricePeriod(
        ['Per Hour', 'Per Day', 'Per Month'],
        ['प्रति घण्टा', 'प्रति दिन', 'प्रति महिना'],
      ),
    ],
    'Fitness & Beauty Services': [
      _serviceType(
        [
          'Gym/Trainer',
          'Yoga',
          'Zumba/Dance',
          'Salon/Parlour',
          'Bridal Makeup',
          'Hair/Spa',
          'Massage Therapy',
          'Nutrition',
          'Other',
        ],
        [
          'जिम/ट्रेनर',
          'योग',
          'जुम्बा/नृत्य',
          'सैलुन/पार्लर',
          'दुलही श्रृंगार',
          'कपाल/स्पा',
          'मसाज थेरापी',
          'पोषण',
          'अन्य',
        ],
      ),
      _serviceLocation(
        ['At Customer Location', 'At Gym/Studio', 'At Salon/Parlour'],
        ['ग्राहकको स्थानमा', 'जिम/स्टुडियोमा', 'सैलुन/पार्लरमा'],
      ),
      _genderServed,
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _pricePeriod(
        ['Per Session', 'Per Month', 'Per Package'],
        ['प्रति सेसन', 'प्रति महिना', 'प्रति प्याकेज'],
      ),
    ],
    'IT Services': [
      _serviceType(
        [
          'Web Development',
          'Mobile App',
          'Software',
          'Graphic Design',
          'Digital Marketing/SEO',
          'Networking',
          'Computer Repair',
          'Data Entry',
          'Hosting',
          'Other',
        ],
        [
          'वेब विकास',
          'मोबाइल एप',
          'सफ्टवेयर',
          'ग्राफिक डिजाइन',
          'डिजिटल मार्केटिङ/एसईओ',
          'नेटवर्किङ',
          'कम्प्युटर मर्मत',
          'डाटा इन्ट्री',
          'होस्टिङ',
          'अन्य',
        ],
      ),
      _serviceLocation(_serviceLocationOptions, _serviceLocationOptionsNe),
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _pricePeriod(
        ['Per Hour', 'Per Project', 'Per Month'],
        ['प्रति घण्टा', 'प्रति परियोजना', 'प्रति महिना'],
      ),
    ],
    'Matrimonials': [_lookingFor, _ageRange, _maritalStatus],
    'Media & Event Management Services': [
      _serviceType(
        [
          'Photography',
          'Videography',
          'Wedding Planning',
          'Decoration',
          'Catering',
          'Sound/DJ',
          'Tent House',
          'MC/Anchor',
          'Printing',
          'Other',
        ],
        [
          'फोटोग्राफी',
          'भिडियोग्राफी',
          'विवाह योजना',
          'सजावट',
          'क्याटरिङ',
          'साउन्ड/डीजे',
          'टेन्ट हाउस',
          'एमसी/एंकर',
          'छपाइ',
          'अन्य',
        ],
      ),
      _availability(
        ['Weekdays', 'Weekends', 'Peak Season (Wedding)', 'Flexible'],
        ['हप्ताका दिन', 'शनिबार/आइतबार', 'विवाह सिजन', 'लचिलो'],
      ),
      _experience,
      _pricePeriod(
        ['Per Event', 'Per Day', 'Per Hour', 'Per Package'],
        ['प्रति कार्यक्रम', 'प्रति दिन', 'प्रति घण्टा', 'प्रति प्याकेज'],
      ),
    ],
    'Professional Services': [
      _serviceType(
        [
          'Legal',
          'Accounting/Tax',
          'Audit',
          'Architecture',
          'Engineering',
          'Translation',
          'Business Consulting',
          'Insurance',
          'Photography',
          'Other',
        ],
        [
          'कानुनी',
          'लेखा/कर',
          'लेखापरीक्षण',
          'वास्तुकला',
          'इन्जिनियरिङ',
          'अनुवाद',
          'व्यापार परामर्श',
          'बीमा',
          'फोटोग्राफी',
          'अन्य',
        ],
      ),
      _serviceLocation(_serviceLocationOptions, _serviceLocationOptionsNe),
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _languages(_languageOptions, _languageOptionsNe),
      _pricePeriod(
        [
          'Per Hour',
          'Per Case',
          'Per Month',
          'Per Project',
          'Free Consultation',
        ],
        [
          'प्रति घण्टा',
          'प्रति केस',
          'प्रति महिना',
          'प्रति परियोजना',
          'निःशुल्क परामर्श',
        ],
      ),
    ],
    'Servicing & Repair': [
      _serviceType(
        [
          'Mobile/Laptop',
          'TV/Electronics',
          'AC/Fridge',
          'Washing Machine',
          'Plumbing',
          'Electrical',
          'Furniture',
          'Vehicle',
          'Watch',
          'Other',
        ],
        [
          'मोबाइल/ल्यापटप',
          'टिभी/इलेक्ट्रोनिक्स',
          'एसी/फ्रिज',
          'वासिङ मेसिन',
          'प्लम्बिङ',
          'इलेक्ट्रिकल',
          'फर्निचर',
          'सवारी साधन',
          'घडी',
          'अन्य',
        ],
      ),
      _serviceLocation(_serviceLocationOptions, _serviceLocationOptionsNe),
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _pricePeriod(
        ['Per Hour', 'Per Visit', 'Per Job', 'Free Inspection'],
        ['प्रति घण्टा', 'प्रति भिजिट', 'प्रति काम', 'निःशुल्क निरीक्षण'],
      ),
    ],
    'Tours & Travels': [
      _serviceType(
        [
          'Trekking',
          'Tour Package',
          'Air Ticketing',
          'Hotel Booking',
          'Vehicle Hire',
          'Visa/Documentation',
          'Pilgrimage',
          'Adventure',
          'Other',
        ],
        [
          'ट्रेकिङ',
          'टुर प्याकेज',
          'हवाई टिकट',
          'होटल बुकिङ',
          'सवारी भाडा',
          'भिसा/कागजात',
          'तीर्थयात्रा',
          'एडभेन्चर',
          'अन्य',
        ],
      ),
      _tripDuration,
      _pricePeriod(
        ['Per Person', 'Per Package', 'Per Vehicle', 'Per Day'],
        ['प्रति व्यक्ति', 'प्रति प्याकेज', 'प्रति सवारी', 'प्रति दिन'],
      ),
    ],

    // -- EDUCATION ----------------------------
    'Tuition': [
      _subjects,
      _gradeLevel,
      _modeOfTeaching,
      _languages(
        _languageOptions,
        _languageOptionsNe,
        label: 'Language of Instruction',
        labelNe: 'पढाउने भाषा',
      ),
      _experience,
      _availability(
        ['Morning', 'Day', 'Evening', 'Weekend', 'Flexible'],
        ['बिहान', 'दिउँसो', 'साँझ', 'सप्ताहन्त', 'लचिलो'],
      ),
      _pricePeriod(
        ['Per Hour', 'Per Month', 'Per Subject', 'Per Course'],
        ['प्रति घण्टा', 'प्रति महिना', 'प्रति विषय', 'प्रति कोर्स'],
      ),
    ],
    'Courses': [
      _courseType,
      _courseDuration,
      _modeOfTeaching,
      _availability(_availabilityOptions, _availabilityOptionsNe),
      _experience,
      _pricePeriod(
        ['Per Course', 'Per Month', 'Per Hour'],
        ['प्रति कोर्स', 'प्रति महिना', 'प्रति घण्टा'],
      ),
    ],
    'Textbooks': [_bookLevel, _publisher, _conditionOptional],
    'Study Abroad': [
      _destinationCountry,
      _studyLevel,
      _serviceType(
        [
          'Counselling',
          'Test Preparation',
          'Documentation',
          'Visa Processing',
          'Scholarship',
        ],
        ['परामर्श', 'परीक्षा तयारी', 'कागजात', 'भिसा प्रक्रिया', 'छात्रवृत्ति'],
      ),
    ],
    // Deliberate catch-all: zero fields is correct.
    'Other Education': [],

    // -- HOME & LIVING ------------------------
    'Bedroom Furniture': [
      _conditionOptional,
      _furnitureType(
        [
          'Bed',
          'Wardrobe',
          'Dresser',
          'Nightstand',
          'Dressing Table',
          'Bunk Bed',
          'Mattress only',
          'Bed + Mattress Set',
          'Other',
        ],
        [
          'पलंग',
          'अलमारी',
          'ड्रेसर',
          'साइड टेबल',
          'ड्रेसिङ टेबल',
          'बंक बेड',
          'ग्याद्दा मात्र',
          'पलंग + ग्याद्दा सेट',
          'अन्य',
        ],
      ),
      _material(_furnitureMaterials, _furnitureMaterialsNe),
      _dimensions(),
      _brand('e.g., IKEA, Ashley, Local Carpenter'),
    ],
    'Living Room Furniture': [
      _conditionOptional,
      _furnitureType(
        [
          'Sofa',
          'Sofa Set',
          'Coffee Table',
          'Center Table',
          'TV Stand',
          'Shelf',
          'Shoe Rack',
          'Cabinet',
          'Divan',
          'Recliner',
          'Ottoman',
        ],
        [
          'सोफा',
          'सोफा सेट',
          'कफी टेबल',
          'सेन्टर टेबल',
          'टिभी स्ट्यान्ड',
          'शेल्फ',
          'जुत्ता र्‍याक',
          'क्याबिनेट',
          'दिवान',
          'रिक्लाइनर',
          'ओटोमन',
        ],
      ),
      _seatingCapacity(
        ['1 Seater', '2 Seater', '3 Seater', '5 Seater', '7+ Seater'],
        ['१ सिटर', '२ सिटर', '३ सिटर', '५ सिटर', '७+ सिटर'],
      ),
      _material(_furnitureMaterials, _furnitureMaterialsNe),
      _dimensions(),
      _brand('e.g., IKEA, La-Z-Boy, Local Maker'),
    ],
    'Kitchen & Dining Furniture': [
      _conditionOptional,
      _furnitureType(
        [
          'Dining Table',
          'Dining Chair',
          'Dining Set',
          'Kitchen Cabinet',
          'Crockery Unit',
          'Rack',
          'Bar Stool',
        ],
        [
          'खाना टेबल',
          'खाना कुर्सी',
          'डाइनिङ सेट',
          'किचन क्याबिनेट',
          'क्रकरी युनिट',
          'र्‍याक',
          'बार स्टुल',
        ],
      ),
      _seatingCapacity(
        ['2 Seater', '4 Seater', '6 Seater', '8+ Seater'],
        ['२ सिटर', '४ सिटर', '६ सिटर', '८+ सिटर'],
      ),
      _material(_furnitureMaterials, _furnitureMaterialsNe),
      _dimensions(),
      _brand('e.g., IKEA, Local Carpenter'),
    ],
    'Office & Shop Furniture': [
      _conditionOptional,
      _furnitureType(
        [
          'Desk',
          'Office Chair',
          'Filing Cabinet',
          'Bookshelf',
          'Conference Table',
          'Reception Desk',
          'Display Rack',
          'Shop Counter',
          'Cash Counter',
          'Workstation',
          'Safe/Locker',
        ],
        [
          'डेस्क',
          'अफिस कुर्सी',
          'फाइलिङ क्याबिनेट',
          'बुकसेल्फ',
          'कन्फरेन्स टेबल',
          'रिसेप्सन डेस्क',
          'डिस्प्ले र्‍याक',
          'पसल काउन्टर',
          'क्यास काउन्टर',
          'वर्कस्टेसन',
          'सेफ/लकर',
        ],
      ),
      _material(_furnitureMaterials, _furnitureMaterialsNe),
      _dimensions(),
      _quantity,
      _brand('e.g., Herman Miller, Steelcase, IKEA'),
    ],
    "Children's Furniture": [
      _conditionOptional,
      _furnitureType(
        [
          'Crib',
          'Kids Bed',
          'Bunk Bed',
          'Study Table',
          'Study Chair',
          'Toy Storage',
          'High Chair',
          'Changing Table',
          'Play Pen',
        ],
        [
          'क्रिब',
          'बच्चाको पलंग',
          'बंक बेड',
          'पढ्ने टेबल',
          'पढ्ने कुर्सी',
          'खेलौना भण्डार',
          'हाई चेयर',
          'चेन्जिङ टेबल',
          'प्ले पेन',
        ],
      ),
      _material(_furnitureMaterials, _furnitureMaterialsNe),
      _dimensions(),
      _brand('e.g., IKEA, Fisher-Price'),
    ],
    'Home Textiles & Decoration': [
      _conditionOptional,
      _productType(
        [
          'Bedsheet',
          'Curtain',
          'Blanket',
          'Cushion',
          'Carpet/Rug',
          'Doormat',
          'Towel',
          'Table Cover',
          'Wall Decor',
          'Artificial Plants',
          'Other',
        ],
        [
          'तन्ना',
          'पर्दा',
          'कम्बल',
          'कुसन',
          'कार्पेट/गलैंचा',
          'डोरम्याट',
          'तौलिया',
          'टेबल कभर',
          'भित्ता सजावट',
          'कृत्रिम बिरुवा',
          'अन्य',
        ],
      ),
      _material(
        [
          'Cotton',
          'Silk',
          'Wool',
          'Polyester',
          'Jute',
          'Velvet',
          'Synthetic',
          'Mixed',
        ],
        [
          'सुती',
          'रेशम',
          'ऊन',
          'पोलिस्टर',
          'जुट',
          'मखमल',
          'सिन्थेटिक',
          'मिश्रित',
        ],
      ),
      _color,
      _brand('e.g., Bombay Dyeing, Portico, Spaces, Local'),
    ],
    'Bathroom Products': [
      _conditionOptional,
      _productType(
        [
          'Sanitary Ware',
          'Taps/Fittings',
          'Shower',
          'Geyser',
          'Cabinet/Mirror',
          'Bathtub',
          'Accessories',
          'Other',
        ],
        [
          'स्यानिटरी वेयर',
          'ट्याप/फिटिङ',
          'सावर',
          'गिजर',
          'क्याबिनेट/ऐना',
          'बाथटब',
          'सामान',
          'अन्य',
        ],
      ),
      _material(
        ['Ceramic', 'Steel', 'Brass', 'PVC', 'Glass', 'Marble', 'Other'],
        ['सेरामिक', 'स्टिल', 'पित्तल', 'पीभीसी', 'सिसा', 'संगमरमर', 'अन्य'],
      ),
      _brand('Enter brand name'),
    ],
    // Durables. Consumables belong under Essentials > Household.
    'Household Items': [
      _conditionOptional,
      _productType(
        [
          'Cookware',
          'Crockery',
          'Storage',
          'Water Tank',
          'Cleaning Tools',
          'Lighting',
          'Plastic Ware',
          'Other',
        ],
        [
          'भाँडाकुँडा',
          'क्रकरी',
          'भण्डारण',
          'पानी ट्यांकी',
          'सफाइ सामान',
          'बत्ती',
          'प्लास्टिक सामान',
          'अन्य',
        ],
      ),
      _material(
        [
          'Steel',
          'Aluminium',
          'Plastic',
          'Glass',
          'Ceramic',
          'Copper/Brass',
          'Non-stick',
          'Wood',
          'Mixed',
        ],
        [
          'स्टिल',
          'एल्युमिनियम',
          'प्लास्टिक',
          'सिसा',
          'सेरामिक',
          'तामा/पित्तल',
          'नन-स्टिक',
          'काठ',
          'मिश्रित',
        ],
      ),
      _brand('e.g., Prestige, Milton, Local'),
    ],
    'Doors': [
      _conditionOptional,
      _productType(
        [
          'Main Door',
          'Room Door',
          'Bathroom Door',
          'Sliding Door',
          'Flush Door',
          'Panel/Carved',
          'Safety Grill',
          'Window',
          'Frame (Chaukath)',
          'Other',
        ],
        [
          'मुख्य ढोका',
          'कोठाको ढोका',
          'बाथरूम ढोका',
          'स्लाइडिङ ढोका',
          'फ्लस ढोका',
          'प्यानल/कुँदिएको',
          'सेफ्टी ग्रिल',
          'झ्याल',
          'चौकाठ',
          'अन्य',
        ],
        label: 'Door Type',
        labelNe: 'ढोका प्रकार',
      ),
      _material(
        [
          'Wood',
          'Plywood/Flush',
          'MDF',
          'Steel',
          'Aluminium',
          'uPVC',
          'Glass',
          'Fiber',
        ],
        [
          'काठ',
          'प्लाइउड/फ्लस',
          'एमडीएफ',
          'स्टिल',
          'एल्युमिनियम',
          'यूपीभीसी',
          'सिसा',
          'फाइबर',
        ],
      ),
      _dimensions(
        label: 'Size (H x W)',
        labelNe: 'साइज (उ x चौ)',
        placeholder: 'e.g., 7ft x 3ft',
        placeholderNe: 'जस्तै, ७ फिट x ३ फिट',
      ),
      _quantity,
      _brand('e.g., CenturyPly, Greenply, Local'),
    ],

    // -- HOBBIES, SPORTS & KIDS ---------------
    'Sports': [
      _conditionOptional,
      _brand('e.g., Nike, Adidas, Yonex, Wilson'),
      _sportType,
    ],
    'Fitness & Gym': [
      _conditionOptional,
      _brand('e.g., Decathlon, Kobo, Domyos'),
      _equipmentType,
    ],
    'Musical Instruments': [
      _conditionOptional,
      _brand('e.g., Yamaha, Gibson, Fender, Roland'),
      _instrumentType,
    ],
    "Children's Items": [
      _conditionOptional,
      _brand('e.g., Chicco, Fisher-Price, Mothercare'),
      _kidsItemType,
      _ageGroup,
    ],
    'Music, Books & Movies': [
      _conditionOptional,
      _mediaType,
      _authorPublisher,
      _mediaLanguage,
    ],
    'Other Hobby, Sport & Kids items': [
      _conditionOptional,
      _brand('Enter brand name'),
    ],

    // -- BUSINESS & INDUSTRY ------------------
    'Industry Machinery & Tools': [
      _conditionOptional,
      _machineryType(
        [
          'Construction',
          'Manufacturing',
          'Food Processing',
          'Woodworking',
          'Metalworking/Welding',
          'Printing',
          'Generator',
          'Power Tools',
          'Water Pump',
          'Other',
        ],
        [
          'निर्माण',
          'उत्पादन',
          'खाद्य प्रशोधन',
          'काठ काम',
          'धातु काम/वेल्डिङ',
          'छपाइ',
          'जेनेरेटर',
          'पावर टुल्स',
          'पानी पम्प',
          'अन्य',
        ],
      ),
      _powerSource,
      _vehicleYear,
      _warranty,
      _brand('e.g., Caterpillar, John Deere, Bosch, Makita'),
    ],
    'Medical Equipment & Supplies': [
      _conditionOptional,
      _machineryType(
        [
          'Diagnostic',
          'Surgical',
          'Monitoring',
          'Laboratory',
          'Therapy',
          'Mobility/Rehab',
          'Hospital Furniture',
          'Dental',
          'Oxygen/Respiratory',
          'Consumables',
        ],
        [
          'डायग्नोस्टिक',
          'शल्यक्रिया',
          'मोनिटरिङ',
          'प्रयोगशाला',
          'थेरापी',
          'मोबिलिटी/पुनःस्थापना',
          'अस्पताल फर्निचर',
          'दन्त',
          'अक्सिजन/श्वासप्रश्वास',
          'उपभोग्य सामग्री',
        ],
        label: 'Equipment Type',
        labelNe: 'उपकरण प्रकार',
      ),
      _warranty,
      _brand('e.g., Philips, GE Healthcare, Siemens'),
    ],
    'Office Supplies & Stationary': [
      _conditionOptional,
      _productType(
        [
          'Paper/Notebooks',
          'Pens',
          'Files',
          'Printer Consumables',
          'Office Machines',
          'Whiteboard',
          'Desk Accessories',
          'School Supplies',
          'Other',
        ],
        [
          'कागज/कापी',
          'कलम',
          'फाइल',
          'प्रिन्टर उपभोग्य',
          'कार्यालय मेसिन',
          'ह्वाइटबोर्ड',
          'डेस्क सामान',
          'विद्यालय सामग्री',
          'अन्य',
        ],
      ),
      _quantity,
      _brand('e.g., HP, Canon, Xerox, Brother'),
    ],
    'Other Business & Industry Items': [
      _conditionOptional,
      _brand('Enter brand name'),
    ],
    'Raw Materials & Industrial Supplies': [
      _productType(
        [
          'Metal/Steel',
          'Cement/Aggregates',
          'Timber',
          'Plastic',
          'Chemicals',
          'Textile/Yarn',
          'Paper',
          'Rubber',
          'Glass',
          'Electrical',
          'Other',
        ],
        [
          'धातु/स्टिल',
          'सिमेन्ट/गिट्टी',
          'काठ',
          'प्लास्टिक',
          'रसायन',
          'कपडा/धागो',
          'कागज',
          'रबर',
          'सिसा',
          'इलेक्ट्रिकल',
          'अन्य',
        ],
        label: 'Material Type',
        labelNe: 'सामग्री प्रकार',
      ),
      _brand('e.g., Shivam, Hetauda, Panchakanya'),
      _priceUnit(
        [
          'per Kg',
          'per Quintal',
          'per Ton',
          'per Piece',
          'per Bag',
          'per Sack (Bora)',
          'per Metre',
          'per Litre',
        ],
        [
          'प्रति के.जी.',
          'प्रति क्विन्टल',
          'प्रति टन',
          'प्रति गोटा',
          'प्रति ब्याग',
          'प्रति बोरा',
          'प्रति मिटर',
          'प्रति लिटर',
        ],
      ),
      _quantity,
    ],
    'Safety & Security': [
      _conditionOptional,
      _productType(
        [
          'CCTV',
          'Alarms',
          'Fire Safety',
          'Safety Gear',
          'Locks/Safes',
          'Access Control',
          'Security Doors',
          'Other',
        ],
        [
          'सीसीटीभी',
          'अलार्म',
          'अग्नि सुरक्षा',
          'सुरक्षा सामग्री',
          'ताल्चा/सेफ',
          'एक्सेस कन्ट्रोल',
          'सुरक्षा ढोका',
          'अन्य',
        ],
      ),
      _warranty,
      _brand('Enter brand name'),
    ],
    'Licences, Titles & Tenders': [
      _productType(
        [
          'Business Licence',
          'Permit/Quota',
          'Tender Notice',
          'Company Registration',
          'Franchise',
          'Trademark',
          'Other',
        ],
        [
          'व्यवसाय इजाजतपत्र',
          'अनुमति/कोटा',
          'टेन्डर सूचना',
          'कम्पनी दर्ता',
          'फ्रान्चाइज',
          'ट्रेडमार्क',
          'अन्य',
        ],
        label: 'Listing Type',
        labelNe: 'सूचीकरण प्रकार',
      ),
      _expiryDate(label: 'Valid Until', labelNe: 'मान्य रहने मिति'),
    ],

    // -- ESSENTIALS ---------------------------
    'Grocery': [
      _productType(
        [
          'Rice/Flour',
          'Pulses',
          'Oil/Ghee',
          'Spices',
          'Dairy',
          'Snacks',
          'Beverage',
          'Instant Food',
          'Other',
        ],
        [
          'चामल/पिठो',
          'दाल',
          'तेल/घ्यू',
          'मसला',
          'दुग्ध पदार्थ',
          'खाजा',
          'पेय',
          'तयारी खाना',
          'अन्य',
        ],
      ),
      _brand('Enter brand name'),
      _priceUnit(
        [
          'per Kg',
          'per Gram',
          'per Litre',
          'per Piece',
          'per Packet',
          'per Dozen',
          'per Sack (Bora)',
          'per Carton',
        ],
        [
          'प्रति के.जी.',
          'प्रति ग्राम',
          'प्रति लिटर',
          'प्रति गोटा',
          'प्रति प्याकेट',
          'प्रति दर्जन',
          'प्रति बोरा',
          'प्रति कार्टुन',
        ],
      ),
      _quantity,
      _expiryDate(),
    ],
    'Healthcare': [
      _productType(
        [
          'Medicine',
          'First Aid',
          'Medical Device',
          'Supplements',
          'Mobility Aids',
          'Ayurvedic/Herbal',
        ],
        [
          'औषधि',
          'प्राथमिक उपचार',
          'चिकित्सा उपकरण',
          'सप्लिमेन्ट',
          'हिँडडुल सहायक',
          'आयुर्वेदिक/जडीबुटी',
        ],
      ),
      _brand('Enter brand name'),
      _productWeight(label: 'Pack Size', labelNe: 'प्याक साइज'),
      _quantity,
      _expiryDate(),
    ],
    'Baby Products': [
      _productType(
        [
          'Diapers',
          'Baby Food',
          'Baby Care',
          'Feeding',
          'Baby Clothes',
          'Stroller/Carrier',
          'Cot/Crib',
          'Bath',
          'Toys',
        ],
        [
          'ड्यापर',
          'बच्चाको खाना',
          'बेबी केयर',
          'दूध खुवाउने',
          'बच्चाको लुगा',
          'स्ट्रोलर/क्यारियर',
          'खाट/क्रिब',
          'नुहाउने',
          'खेलौना',
        ],
      ),
      _ageGroup,
      _conditionOptional,
      _brand('e.g., Pampers, Johnson & Johnson, Huggies'),
      _quantity,
      _expiryDate(),
    ],
    // Consumables. Durables belong under Home & Living > Household Items.
    'Household': [
      _productType(
        [
          'Cleaning',
          'Laundry/Detergent',
          'Toiletries',
          'Pest Control',
          'Storage',
          'Kitchen Consumables',
          'Other',
        ],
        [
          'सफाइ',
          'लुगा धुने/डिटर्जेन्ट',
          'नुहाउने सामान',
          'किरा नियन्त्रण',
          'भण्डारण',
          'भान्साका उपभोग्य',
          'अन्य',
        ],
      ),
      _brand('Enter brand name'),
      _productWeight(label: 'Pack Size', labelNe: 'प्याक साइज'),
      _quantity,
    ],
    'Fruits & Vegetables': [
      _priceUnit(
        [
          'per Kg',
          'per Gram',
          'per Dozen',
          'per Piece',
          'per Crate',
          'per Sack (Bora)',
          'per Muri',
        ],
        [
          'प्रति के.जी.',
          'प्रति ग्राम',
          'प्रति दर्जन',
          'प्रति गोटा',
          'प्रति क्रेट',
          'प्रति बोरा',
          'प्रति मुरी',
        ],
      ),
      _quantity,
      _organic,
    ],
    'Meat & Seafood': [
      _productType(
        [
          'Chicken',
          'Mutton/Khasi',
          'Buff',
          'Pork',
          'Fish',
          'Prawn/Seafood',
          'Eggs',
          'Frozen/Processed',
          'Other',
        ],
        [
          'कुखुरा',
          'खसी',
          'राँगा',
          'बंगुर',
          'माछा',
          'झिंगेमाछा/समुद्री',
          'अण्डा',
          'फ्रोजन/प्रशोधित',
          'अन्य',
        ],
        label: 'Meat Type',
        labelNe: 'मासु प्रकार',
      ),
      _priceUnit(
        ['per Kg', 'per Piece', 'per Dozen'],
        ['प्रति के.जी.', 'प्रति गोटा', 'प्रति दर्जन'],
      ),
      _quantity,
    ],
    'Other Essentials': [
      _priceUnit(
        ['per Kg', 'per Litre', 'per Piece', 'per Packet', 'per Sack (Bora)'],
        [
          'प्रति के.जी.',
          'प्रति लिटर',
          'प्रति गोटा',
          'प्रति प्याकेट',
          'प्रति बोरा',
        ],
      ),
      _quantity,
    ],

    // -- AGRICULTURE --------------------------
    'Crops, Seeds & Plants': [
      _productType(
        [
          'Seeds',
          'Saplings',
          'Harvested Grain',
          'Bulk Vegetables',
          'Fruit Trees',
          'Flowers',
          'Mushroom/Spawn',
          'Other',
        ],
        [
          'बीउ',
          'बेर्ना',
          'उत्पादित अन्न',
          'थोक तरकारी',
          'फलफूलका बिरुवा',
          'फूल',
          'च्याउ/स्पन',
          'अन्य',
        ],
        label: 'Item Type',
        labelNe: 'वस्तु प्रकार',
      ),
      _cropType,
      _priceUnit(
        [
          'per Kg',
          'per Quintal',
          'per Muri',
          'per Pathi',
          'per Packet',
          'per Sapling',
          'per Sack (Bora)',
        ],
        [
          'प्रति के.जी.',
          'प्रति क्विन्टल',
          'प्रति मुरी',
          'प्रति पाथी',
          'प्रति प्याकेट',
          'प्रति बेर्ना',
          'प्रति बोरा',
        ],
      ),
      _quantity,
    ],
    'Farming Tools & Machinery': [
      _conditionOptional,
      _farmingToolType,
      _powerSource,
      _vehicleYear,
      _brand('e.g., John Deere, Mahindra, Kubota'),
    ],
    'Other Agriculture': [
      _productType(
        [
          'Fertilizer/Pesticide',
          'Animal Feed',
          'Veterinary',
          'Irrigation',
          'Greenhouse/Nets',
          'Farm Produce',
          'Beekeeping',
          'Other',
        ],
        [
          'मल/विषादी',
          'पशु आहार',
          'पशु चिकित्सा',
          'सिँचाइ',
          'हरितगृह/जाली',
          'कृषि उपज',
          'मौरीपालन',
          'अन्य',
        ],
      ),
      _priceUnit(
        ['per Kg', 'per Litre', 'per Piece', 'per Packet', 'per Sack (Bora)'],
        [
          'प्रति के.जी.',
          'प्रति लिटर',
          'प्रति गोटा',
          'प्रति प्याकेट',
          'प्रति बोरा',
        ],
      ),
      _quantity,
    ],

    // -- JOBS ---------------------------------
    // The other five Jobs subcategories use the parent-level fallback; only
    // these three carry a genuine extra field or a different employer label.
    'Construction & Trades': [
      _jobPostType,
      _tradeSkill,
      _jobType,
      _workLocationType,
      _companyName(
        label: 'Company / Contractor Name',
        labelNe: 'कम्पनी / ठेकेदारको नाम',
      ),
      _experience,
      _educationRequired,
      _pricePeriod(
        _jobPricePeriodOptions,
        _jobPricePeriodOptionsNe,
        label: 'Salary Period',
        labelNe: 'तलब अवधि',
      ),
    ],
    'Healthcare & Medical': [
      _jobPostType,
      _jobType,
      _workLocationType,
      _companyName(
        label: 'Hospital / Clinic / Employer',
        labelNe: 'अस्पताल / क्लिनिक / रोजगारदाता',
      ),
      _experience,
      _educationRequired,
      _pricePeriod(
        _jobPricePeriodOptions,
        _jobPricePeriodOptionsNe,
        label: 'Salary Period',
        labelNe: 'तलब अवधि',
      ),
    ],
    'Transportation & Logistics': [
      _jobPostType,
      _licenseCategory,
      _jobType,
      _workLocationType,
      _companyName(),
      _experience,
      _educationRequired,
      _pricePeriod(
        ['Per Month', 'Per Day', 'Per Hour', 'Per Trip', 'Per Project'],
        [
          'प्रति महिना',
          'प्रति दिन',
          'प्रति घण्टा',
          'प्रति यात्रा',
          'प्रति परियोजना',
        ],
        label: 'Salary Period',
        labelNe: 'तलब अवधि',
      ),
    ],

    // -- OVERSEAS JOBS ------------------------
    'Bulgaria': _overseasJobFields(['NPR', 'EUR', 'USD']),
    'Croatia': _overseasJobFields(['NPR', 'EUR', 'USD']),
    'Serbia': _overseasJobFields(['NPR', 'EUR', 'USD']),
    'Malaysia': _overseasJobFields(['MYR', 'NPR', 'USD']),
    'Qatar': _overseasJobFields(['QAR', 'NPR', 'USD']),
    'Saudi Arabia': _overseasJobFields(['SAR', 'NPR', 'USD']),
    'Singapore': _overseasJobFields(['SGD', 'NPR', 'USD']),
    'UAE': _overseasJobFields(['AED', 'NPR', 'USD']),
  };

  /// Shared by "Photocopiers" and its renamed twin.
  static final List<FormFieldModel> _printerConfig = [
    _conditionRequired,
    const FormFieldModel(
      name: 'machineType',
      label: 'Machine Type',
      labelNe: 'मेसिन प्रकार',
      type: FieldType.select,
      options: [
        'Inkjet Printer',
        'Laser Printer',
        'All-in-One',
        'Photocopier',
        'Scanner',
        'Plotter',
        'Other',
      ],
      optionsNe: [
        'इंकजेट प्रिन्टर',
        'लेजर प्रिन्टर',
        'अल-इन-वन',
        'फोटोकपियर',
        'स्क्यानर',
        'प्लटर',
        'अन्य',
      ],
    ),
    _brand('e.g., Canon, Xerox, HP, Ricoh, Epson, Brother'),
    _model('Enter model name'),
    _warranty,
  ];

  /// "Auto Services" and "Maintenance and Repair" are field-identical.
  static final List<FormFieldModel> _autoServiceConfig = [
    _serviceType(_autoServiceTypes, _autoServiceTypesNe),
    _vehicleTypesServiced,
    _serviceOptions,
  ];

  // ============================================
  // CATEGORY-LEVEL FALLBACKS
  // Jobs and Overseas Jobs subcategories differ so little that one set per
  // parent covers them; only the exceptions above get their own config.
  // ============================================

  static final Map<String, List<FormFieldModel>> _categoryFallbacks = {
    'Jobs': [
      _jobPostType,
      _jobType,
      _workLocationType,
      _companyName(),
      _experience,
      _educationRequired,
      _pricePeriod(
        _jobPricePeriodOptions,
        _jobPricePeriodOptionsNe,
        label: 'Salary Period',
        labelNe: 'तलब अवधि',
      ),
    ],
    'Overseas Jobs': _overseasJobFields(['NPR', 'USD']),
  };

  /// Required fields the seller has not filled. The Form's own validators only
  /// paint red text; this is what actually blocks the post.
  static List<FormFieldModel> missingRequiredFields(
    List<FormFieldModel> fields,
    Map<String, dynamic> values,
  ) {
    return fields.where((f) {
      if (!f.required) return false;
      final value = values[f.name];
      if (value == null) return true;
      if (value is String) return value.trim().isEmpty;
      if (value is List) return value.isEmpty;
      return false;
    }).toList();
  }

  /// Get applicable fields for a subcategory.
  /// 1. Exact subcategory name match
  /// 2. Category-level fallback (Jobs, Overseas Jobs)
  /// 3. No custom fields at all
  ///
  /// Condition is governed by the category policy, not by the config: the
  /// policy decides whether it is required, optional, or dropped entirely.
  /// Pass the slugs whenever they are known; without them the declared flag
  /// stands. Every other field is optional — sellers can put the rest in the
  /// description.
  List<FormFieldModel> getApplicableFields(
    String categoryName,
    String subcategoryName, {
    String? categorySlug,
    String? subcategorySlug,
  }) {
    final fields =
        _subcategoryConfigs[subcategoryName] ??
        _categoryFallbacks[categoryName] ??
        const <FormFieldModel>[];
    if (categorySlug == null) return fields;

    final mode = getCategoryPolicy(categorySlug, subcategorySlug).condition;
    if (mode == ConditionMode.hidden) {
      return fields.where((f) => f.name != 'condition').toList();
    }
    return fields
        .map(
          (f) => f.name == 'condition'
              ? f.copyWith(required: mode == ConditionMode.required)
              : f,
        )
        .toList();
  }
}
