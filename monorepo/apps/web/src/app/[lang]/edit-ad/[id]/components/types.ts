export interface EditAdFormData {
  title: string;
  description: string;
  price: string;
  isNegotiable: boolean;
  categoryId: string;
  subcategoryId: string;
  locationSlug: string;
  locationName: string;
  status: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
}

export interface Subcategory {
  id: number;
  name: string;
}
