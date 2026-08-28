/**
 * Shared Constants
 *
 * Values that both the canonical field definitions (fields/*.ts) and the
 * templates need. Field objects themselves live in fields/*.ts.
 */

// Year inputs accept next year's models. Never hardcode a year here — a
// hardcoded max silently blocks every new model once the year rolls over.
export const MIN_MODEL_YEAR = 1980;
export const MAX_MODEL_YEAR = new Date().getFullYear() + 1;

// The 8 real Jobs subcategories. Job fields gate on these names, not on a list
// of job titles — a job title is not a subcategory and matches no DB row.
export const JOBS_SUBCATEGORIES = [
  'Accounting & Finance', 'Administrative & Office', 'Construction & Trades',
  'Healthcare & Medical', 'IT & Technology', 'Other Jobs', 'Retail & Sales',
  'Transportation & Logistics',
] as const;

// The 8 real Overseas Jobs subcategories (each one is a destination country)
export const OVERSEAS_JOBS_SUBCATEGORIES = [
  'Bulgaria', 'Croatia', 'Malaysia', 'Qatar', 'Saudi Arabia', 'Serbia',
  'Singapore', 'UAE',
] as const;
