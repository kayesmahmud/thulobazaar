export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id?: number | null;
  parentId?: number | null;
  subcategories?: Category[];
}

export interface PostAdFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  condition: string;
  isNegotiable: boolean;
}

export const INITIAL_FORM_DATA: PostAdFormData = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  subcategoryId: '',
  locationSlug: '',
  locationName: '',
  condition: 'new',
  isNegotiable: false,
};
