/**
 * Subcategory Configurations
 *
 * Each subcategory explicitly defines which fields it needs
 * and any customizations (placeholders, options, etc.)
 */

export * from './electronics';
export * from './vehicles';
export * from './property';
export * from './services';
export * from './fashion';
export * from './pets';
export * from './general';

// Re-export the main config map and helper functions
export {
  SUBCATEGORY_CONFIGS,
  getSubcategoryConfig,
  getFieldsForSubcategory,
  hasSubcategoryConfig,
  getAllConfiguredSubcategories,
} from './configMap';
