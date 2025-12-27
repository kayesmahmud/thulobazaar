import type { SpecificationsSectionProps } from './types';

export function SpecificationsSection({ customFields }: SpecificationsSectionProps) {
  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  const filteredKeys = ['isNegotiable', 'amenities', 'condition'];
  const entries = Object.entries(customFields)
    .filter(([key]) => !filteredKeys.includes(key));

  // Check if this is a property-related ad (has totalArea field)
  const hasAreaFields = entries.some(([key]) => key === 'totalArea' || key === 'areaUnit');

  if (hasAreaFields) {
    // Sort to put totalArea first, then areaUnit, then everything else
    entries.sort((a, b) => {
      const [keyA] = a;
      const [keyB] = b;

      if (keyA === 'totalArea') return -1;
      if (keyB === 'totalArea') return 1;
      if (keyA === 'areaUnit') return -1;
      if (keyB === 'areaUnit') return 1;

      return 0;
    });
  }

  const amenitiesValue = customFields.amenities;
  let amenitiesList: string[] = [];

  if (typeof amenitiesValue === 'string') {
    amenitiesList = amenitiesValue.split(',').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(amenitiesValue)) {
    amenitiesList = amenitiesValue;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Specifications
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key} className="p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
            </div>
            <div className="text-base font-medium text-gray-800">
              {String(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Amenities Section */}
      {amenitiesList.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Amenities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {amenitiesList.map((amenity, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-700">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-bold flex-shrink-0">
                  ✓
                </span>
                <span>{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
