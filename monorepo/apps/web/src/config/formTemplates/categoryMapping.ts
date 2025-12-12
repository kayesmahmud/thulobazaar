/**
 * Category to Template Mapping
 */

import type { CategoryTemplateMap, TemplateName } from './types';

export const CATEGORY_TEMPLATE_MAP: CategoryTemplateMap = {
  // Electronics
  'Mobiles': 'electronics',
  'Electronics': 'electronics',
  // Vehicles
  'Vehicles': 'vehicles',
  // Property
  'Property': 'property',
  // Fashion
  "Men's Fashion & Grooming": 'fashion',
  "Women's Fashion & Beauty": 'fashion',
  // Pets
  'Pets & Animals': 'pets',
  // Services & Jobs
  'Services': 'services',
  'Jobs': 'services',
  'Education': 'services',
  'Overseas Jobs': 'services',
  // General
  'Home & Living': 'general',
  'Hobbies, Sports & Kids': 'general',
  'Business & Industry': 'general',
  'Essentials': 'general',
  'Agriculture': 'general',
};

/**
 * Get template name for a category
 */
export function getTemplateForCategory(categoryName: string, parentCategoryName: string): TemplateName {
  return CATEGORY_TEMPLATE_MAP[parentCategoryName] || 'general';
}
