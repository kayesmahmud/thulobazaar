import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: string;
      phone: string | null;
      accountType: string | null;
      shopSlug: string | null;
      sellerSlug: string | null;
      businessName: string | null;
      businessVerificationStatus: string | null;
      individualVerified: boolean | null;
      backendToken: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    phone: string | null;
    accountType: string | null;
    shopSlug: string | null;
    sellerSlug: string | null;
    businessName: string | null;
    businessVerificationStatus: string | null;
    individualVerified: boolean | null;
    backendToken: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    phone: string | null;
    accountType: string | null;
    shopSlug: string | null;
    sellerSlug: string | null;
    businessName: string | null;
    businessVerificationStatus: string | null;
    individualVerified: boolean | null;
    backendToken: string | null;
  }
}
