/**
 * Subcategory Configuration Lookup
 *
 * Per-subcategory fields now live in the parent templates (templates/*.ts), which
 * declare a field once per option domain with disjoint `appliesTo` sets. Keying a
 * second set of configs on subcategory names is what produced 55 configs matching
 * no DB row, which silently rendered nothing.
 *
 * These two functions remain so the resolver keeps a single code path: they report
 * that no subcategory carries its own config, and the resolver falls through to
 * the template.
 */

import type { FormField } from '../types';

export function hasSubcategoryConfig(_subcategoryName: string): boolean {
  return false;
}

export function getFieldsForSubcategory(_subcategoryName: string): FormField[] {
  return [];
}
