import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PhoneLogin: undefined;
  OtpVerification: { phone: string };
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  PostAdTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
};

// Home Stack (inside HomeTab)
export type HomeStackParamList = {
  Home: undefined;
  AdDetail: { slug: string };
  CategoryList: { categorySlug: string; categoryName: string };
  Shop: { shopSlug: string };
};

// Search Stack
export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query?: string; category?: string; location?: string };
  AdDetail: { slug: string };
};

// Post Ad Stack
export type PostAdStackParamList = {
  PostAd: {
    selectedCategory?: { id: number; name: string; slug: string };
    selectedLocation?: { id: number; name: string; slug: string };
  } | undefined;
  SelectCategory: undefined;
  SelectLocation: undefined;
  AdPreview: { adData: any };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyAds: undefined;
  AdDetail: { slug: string };
  Settings: undefined;
  ChangePassword: undefined;
  PhoneVerification: undefined;
};

// Root Navigator (combines Auth and Main)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type SearchScreenProps<T extends keyof SearchStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SearchStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
