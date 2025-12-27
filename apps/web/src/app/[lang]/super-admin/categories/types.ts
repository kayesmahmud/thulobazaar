export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: number | null;
  parent_name: string | null;
  form_template: string | null;
  created_at: string;
  ad_count: string;
  subcategory_count: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  parent_id: string;
  form_template: string;
}

export const DEFAULT_FORM_DATA: CategoryFormData = {
  name: '',
  slug: '',
  icon: '',
  parent_id: '',
  form_template: '',
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
