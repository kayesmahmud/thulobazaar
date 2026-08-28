import { getTranslations } from 'next-intl/server';
import { formatPrice } from '@thulobazaar/utils';
import type { SpecificationsSectionProps } from './types';
import type { FormField } from '@/config/formTemplates';
import { getApplicableFields } from '@/config/formTemplates';
import { getTemplateForCategory } from '@/config/formTemplates/categoryMapping';
import { getFieldsForSubcategory, hasSubcategoryConfig } from '@/config/formTemplates/subcategories';
import * as commonFields from '@/config/formTemplates/fields/common';
import * as electronicsFields from '@/config/formTemplates/fields/electronics';
import * as vehiclesFields from '@/config/formTemplates/fields/vehicles';
import * as propertyFields from '@/config/formTemplates/fields/property';
import * as fashionFields from '@/config/formTemplates/fields/fashion';
import * as petsFields from '@/config/formTemplates/fields/pets';
import * as servicesFields from '@/config/formTemplates/fields/services';
import * as generalFields from '@/config/formTemplates/fields/general';

// Rendered elsewhere on this page: condition is a badge, amenities get their
// own block below.
const RENDERED_ELSEWHERE = ['condition', 'amenities'];

// Retired: the value lives in a first-class column now. monthlyRent duplicates
// the core Price input, which reads "Monthly Rent" on rentals. Older ads keep
// the stored value, it just stops rendering.
const RETIRED_KEYS = ['monthlyRent'];

// Display-only. These fields were dropped from the post-ad forms, so nothing
// writes them any more, but ads posted before that still carry real values and
// would otherwise lose a spec row. Never referenced by a template, so adding a
// label back here cannot put the field in front of a seller again.
const LEGACY_FIELDS: FormField[] = [
  { name: 'style', label: 'Style', labelNe: 'शैली', type: 'select', options: [], required: false, appliesTo: [] },
  {
    name: 'assemblyRequired',
    label: 'Assembly Required',
    labelNe: 'जोड्नु पर्ने',
    type: 'select',
    options: [],
    required: false,
    appliesTo: [],
  },
  {
    name: 'manufacturingDate',
    label: 'Manufacturing Date',
    labelNe: 'उत्पादन मिति',
    type: 'date',
    required: false,
    appliesTo: [],
  },
  // Superseded by roadSize (banded) and buildYear (an AD year). The stored
  // values — a raw number and a range like '0-1 years' — cannot convert, so
  // older ads keep showing them under the label they were captured with.
  {
    name: 'roadWidth',
    label: 'Road Width (feet)',
    labelNe: 'सडक चौडाइ (फिट)',
    type: 'number',
    required: false,
    appliesTo: [],
  },
  {
    name: 'propertyAge',
    label: 'Property Age',
    labelNe: 'सम्पत्ति उमेर',
    type: 'select',
    options: [],
    required: false,
    appliesTo: [],
  },
];

// Units the field's own label doesn't already carry.
const UNIT_SUFFIX: Record<string, string> = {
  mileage: 'km',
  roadWidth: 'ft',
  engineCapacity: 'cc',
};

const CURRENCY_KEYS = ['securityDeposit'];

function collectFields(module: Record<string, unknown>): FormField[] {
  return Object.values(module).filter(
    (v): v is FormField => !!v && typeof v === 'object' && 'name' in v && 'label' in v && 'type' in v
  );
}

let cachedKnownFields: Record<string, FormField> | null = null;

// Every attribute the post-ad forms can write, keyed by name. custom_fields is
// stored verbatim and never whitelisted server-side, so a key that isn't here
// is a stale attribute from a switched category or an old client — it is
// dropped rather than shown to buyers under a prettified label.
function getKnownFields(): Record<string, FormField> {
  if (cachedKnownFields) return cachedKnownFields;

  const known: Record<string, FormField> = {};
  const allFields = [
    ...collectFields(commonFields),
    ...collectFields(electronicsFields),
    ...collectFields(vehiclesFields),
    ...collectFields(propertyFields),
    ...collectFields(fashionFields),
    ...collectFields(petsFields),
    ...collectFields(servicesFields),
    ...collectFields(generalFields),
    ...LEGACY_FIELDS,
  ];

  for (const field of allFields) {
    if (!known[field.name]) known[field.name] = field;
  }

  cachedKnownFields = known;
  return known;
}

// The fields the post-ad form showed for this subcategory, in declaration
// order. Spec rows follow that order so two ads in one subcategory always
// list their specs the same way.
function resolveTemplateFields(
  categoryName: string | null,
  parentCategoryName: string | null
): FormField[] {
  if (!categoryName) return [];
  if (hasSubcategoryConfig(categoryName)) return getFieldsForSubcategory(categoryName);

  const template = getTemplateForCategory(categoryName, parentCategoryName ?? categoryName);
  return getApplicableFields(template, categoryName);
}

interface SpecRow {
  key: string;
  field: FormField;
  value: string;
}

export async function SpecificationsSection({
  customFields,
  lang,
  categoryName,
  parentCategoryName,
}: SpecificationsSectionProps) {
  const t = await getTranslations('ads');
  const isNe = lang === 'ne';

  if (!customFields || Object.keys(customFields).length === 0) {
    return null;
  }

  const knownFields = getKnownFields();
  const templateFields = resolveTemplateFields(categoryName, parentCategoryName);
  const templateOrder = new Map<string, number>();
  const templateFieldsByName = new Map<string, FormField>();
  templateFields.forEach((field, index) => {
    if (templateFieldsByName.has(field.name)) return;
    templateFieldsByName.set(field.name, field);
    templateOrder.set(field.name, index);
  });

  // Prefer the subcategory's own copy of a field: its overrides carry the right
  // label and option list (e.g. "Property Type", not "Land Type").
  const fieldFor = (key: string): FormField | undefined =>
    templateFieldsByName.get(key) || knownFields[key];

  const getLabel = (field: FormField): string => (isNe && field.labelNe) || field.label;

  const getOptionLabel = (field: FormField | undefined, option: string): string => {
    if (!isNe || !field || !('optionsNe' in field) || !field.optionsNe) return option;
    const index = field.options.indexOf(option);
    return (index >= 0 && field.optionsNe[index]) || option;
  };

  const yesLabel = isNe ? 'छ' : 'Yes';

  const formatNumber = (key: string, value: number): string => {
    if (CURRENCY_KEYS.includes(key)) return formatPrice(value, 'Rs.', isNe ? 'ne' : 'en');
    const unit = UNIT_SUFFIX[key];
    // Everything else renders verbatim so a year never becomes "2,020".
    return unit ? `${value.toLocaleString('en-NP')} ${unit}` : String(value);
  };

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(isNe ? 'ne-NP' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Returns null when the row should be dropped entirely.
  const formatValue = (key: string, raw: unknown, field: FormField): string | null => {
    if (raw === null || raw === undefined) return null;
    // Opt-in flags: "false" is not information a buyer needs, it just adds noise.
    if (typeof raw === 'boolean') return raw ? yesLabel : null;
    if (typeof raw === 'number') return formatNumber(key, raw);

    if (Array.isArray(raw)) {
      const items = raw.map(item => String(item).trim()).filter(Boolean);
      return items.length > 0 ? items.map(item => getOptionLabel(field, item)).join(', ') : null;
    }

    const value = String(raw).trim();
    if (value === '' || value === 'false') return null;
    if (value === 'true') return yesLabel;

    // Multiselects posted by older clients arrive as a comma-joined string.
    if (field.type === 'multiselect' && value.includes(',')) {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => getOptionLabel(field, item))
        .join(', ');
    }

    if (field.type === 'number' && !Number.isNaN(Number(value))) {
      return formatNumber(key, Number(value));
    }
    if (field.type === 'date') return formatDate(value);

    return getOptionLabel(field, value);
  };

  const rows = Object.entries(customFields)
    .filter(([key]) => !RENDERED_ELSEWHERE.includes(key) && !RETIRED_KEYS.includes(key))
    .map(([key, raw]): SpecRow | null => {
      const field = fieldFor(key);
      if (!field) return null;

      const value = formatValue(key, raw, field);
      return value === null ? null : { key, field, value };
    })
    .filter((row): row is SpecRow => row !== null)
    .sort(
      (a, b) =>
        (templateOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (templateOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER)
    );

  // Merge "Total Area" + "Area Unit" into one row (e.g. "10 sq ft") so the
  // measurement and its unit read together instead of as two rows.
  const totalAreaRow = rows.find(row => row.key === 'totalArea');
  const areaUnitRow = rows.find(row => row.key === 'areaUnit');
  const displayRows =
    totalAreaRow && areaUnitRow
      ? rows
          .filter(row => row.key !== 'areaUnit')
          .map(row => (row.key === 'totalArea' ? { ...row, value: `${row.value} ${areaUnitRow.value}` } : row))
      : rows;

  const amenitiesField = fieldFor('amenities');
  const amenitiesValue: unknown = customFields.amenities;
  let amenitiesList: string[] = [];

  if (typeof amenitiesValue === 'string') {
    amenitiesList = amenitiesValue.split(',').map(a => a.trim()).filter(Boolean);
  } else if (Array.isArray(amenitiesValue)) {
    amenitiesList = amenitiesValue.map(a => String(a).trim()).filter(Boolean);
  }

  if (displayRows.length === 0 && amenitiesList.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {displayRows.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('specifications')}
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
            {displayRows.map(({ key, field, value }) => (
              <div
                key={key}
                className="grid grid-cols-[minmax(7rem,38%)_1fr] gap-x-4 py-2.5 border-b border-gray-100"
              >
                <dt className="text-sm text-gray-600 break-words">{getLabel(field)}</dt>
                <dd className="text-sm font-medium text-gray-900 min-w-0 break-words">
                  {key === 'googleMapsLink' ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t('viewOnGoogleMaps')}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {/* Amenities Section */}
      {amenitiesList.length > 0 && (
        <div className={displayRows.length > 0 ? 'mt-6 pt-6 border-t border-gray-200' : ''}>
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            {t('amenities')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {amenitiesList.map((amenity, index) => (
              <div key={index} className="flex items-center gap-3 text-gray-700">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-sm font-bold flex-shrink-0">
                  ✓
                </span>
                <span>{getOptionLabel(amenitiesField, amenity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
