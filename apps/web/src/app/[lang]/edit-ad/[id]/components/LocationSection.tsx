'use client';

import CascadingLocationFilter from '@/components/CascadingLocationFilter';
import type { EditAdFormData } from './types';

interface LocationSectionProps {
  formData: EditAdFormData;
  onFormChange: (updates: Partial<EditAdFormData>) => void;
}

export function LocationSection({ formData, onFormChange }: LocationSectionProps) {
  return (
    <div className="mb-8">
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="m-0 mb-3 text-base font-semibold text-gray-900">Location (Area/Place) *</h3>
        <CascadingLocationFilter
          onLocationSelect={(locationSlug, locationName) => {
            onFormChange({
              locationSlug: locationSlug || '',
              locationName: locationName || '',
            });
          }}
          selectedLocationSlug={formData.locationSlug || null}
          selectedLocationName={formData.locationName || null}
        />
      </div>
    </div>
  );
}
