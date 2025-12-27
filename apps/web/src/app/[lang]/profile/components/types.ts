export interface LocationOption {
  id: number;
  name: string;
  type: string;
}

export interface FavoriteAd {
  id: number;
  adId: number;
  createdAt: string;
  ad: {
    id: number;
    title: string;
    slug: string;
    price: number | null;
    primaryImage: string | null;
    category: { name: string } | null;
    location: { name: string } | null;
  };
}

export interface ProfileFormData {
  name: string;
  locationId: string;
}

export interface ProfileEditFormProps {
  formData: ProfileFormData;
  isNameLocked: boolean;
  profile: {
    oauthProvider?: string | null;
    email?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    location?: { name: string } | null;
  };
  activeShopSlug: string;
  lang: string;
  unsavedChanges: boolean;
  saving: boolean;
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onGoToSecurity: () => void;
}
