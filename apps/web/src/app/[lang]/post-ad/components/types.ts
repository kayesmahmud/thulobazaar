export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_id?: number | null;
  parentId?: number | null;
  subcategories?: Category[];
}

// No `condition` here: Condition exists only where the category policy allows
// it, and there it is the category's own Condition field (customFields).
export interface PostAdFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  isNegotiable: boolean;
  isCodAvailable: boolean;
  /** When true the WhatsApp number mirrors the verified phone and is not editable. */
  whatsappSameAsPhone: boolean;
  whatsappNumber: string;
}

export const INITIAL_FORM_DATA: PostAdFormData = {
  title: '',
  description: '',
  price: '',
  categoryId: '',
  subcategoryId: '',
  locationSlug: '',
  locationName: '',
  isNegotiable: false,
  isCodAvailable: false,
  whatsappSameAsPhone: true,
  whatsappNumber: '',
};
