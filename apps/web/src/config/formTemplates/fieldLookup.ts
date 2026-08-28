/**
 * Field Translation Lookup
 *
 * Builds a flat map from field name to its English label, Nepali label and value
 * translations, from the canonical field definitions in fields/*.ts.
 * Used by SpecificationsSection to display spec rows.
 *
 * A spec key that is not in this map is a client bug, a stale attribute from a
 * switched category or arbitrary client text — `custom_fields` is stored verbatim
 * and never whitelisted server-side. Callers should drop unknown keys rather than
 * prettify them.
 */

import type { FormField } from './types';

// Import all field definitions. Order matters: the first module to define a field
// name supplies its labels, so domain modules come before `common` — otherwise a
// car's manufacture year renders as the generic "Year"/"वर्ष". `pets` sits last so
// a car ad's `color` row is not labelled "Color / Coat".
import * as electronicsFields from './fields/electronics';
import * as vehiclesFields from './fields/vehicles';
import * as propertyFields from './fields/property';
import * as fashionFields from './fields/fashion';
import * as servicesFields from './fields/services';
import * as generalFields from './fields/general';
import * as commonFields from './fields/common';
import * as petsFields from './fields/pets';

interface FieldTranslation {
  label: string;
  labelNe: string;
  optionMap: Record<string, string>;
}

let cachedLookup: Record<string, FieldTranslation> | null = null;

function collectFields(module: Record<string, unknown>): FormField[] {
  return Object.values(module).filter(
    (v): v is FormField => !!v && typeof v === 'object' && 'name' in v && 'label' in v && 'type' in v
  );
}

export function getFieldTranslationLookup(): Record<string, FieldTranslation> {
  if (cachedLookup) return cachedLookup;

  const lookup: Record<string, FieldTranslation> = {};
  const allFields = [
    ...collectFields(electronicsFields),
    ...collectFields(vehiclesFields),
    ...collectFields(propertyFields),
    ...collectFields(fashionFields),
    ...collectFields(servicesFields),
    ...collectFields(generalFields),
    ...collectFields(commonFields),
    ...collectFields(petsFields),
  ];

  for (const field of allFields) {
    // Keys like productType and serviceType are defined once per option domain.
    // Labels come from the first definition; option translations merge across all
    // of them so a Grocery value never resolves through the pet-accessory list.
    const entry = lookup[field.name] ?? {
      label: field.label,
      labelNe: field.labelNe || field.label,
      optionMap: {},
    };

    if ('options' in field && field.optionsNe) {
      const { options, optionsNe } = field;
      options.forEach((opt, i) => {
        if (optionsNe[i] && !entry.optionMap[opt]) entry.optionMap[opt] = optionsNe[i];
      });
    }

    lookup[field.name] = entry;
  }

  cachedLookup = lookup;
  return lookup;
}
