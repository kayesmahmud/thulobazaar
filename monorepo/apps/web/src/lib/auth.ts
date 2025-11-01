// @ts-nocheck
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user in database
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              password_hash: true,
              full_name: true,
              phone: true,
              role: true,
              is_active: true,
              avatar: true,
              account_type: true,
              shop_slug: true,
              seller_slug: true,
              business_name: true,
              business_verification_status: true,
              individual_verified: true,
            },
          });

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Check if user is active
          if (!user.is_active) {
            throw new Error('Account is deactivated');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Also get backend JWT token for API calls
          let backendToken = null;
          try {
            const response = await fetch(`${process.env.API_URL || 'http://localhost:3333'}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              // Backend returns token nested under data.data.token
              backendToken = data.data?.token || data.token;
              console.log('🔐 [NextAuth] Backend token fetched:', backendToken ? 'Yes' : 'No');
            } else {
              console.error('🔐 [NextAuth] Backend login failed:', response.status, await response.text());
            }
          } catch (error) {
            console.error('🔐 [NextAuth] Failed to get backend token:', error);
            // Continue anyway - NextAuth session will work, but API calls might need separate handling
          }

          // Return user data (without password_hash) plus backend token
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            image: user.avatar,
            role: user.role,
            phone: user.phone,
            accountType: user.account_type,
            shopSlug: user.shop_slug,
            sellerSlug: user.seller_slug,
            businessName: user.business_name,
            businessVerificationStatus: user.business_verification_status,
            individualVerified: user.individual_verified,
            backendToken,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image; // Avatar
        token.role = user.role;
        token.phone = user.phone;
        token.accountType = user.accountType;
        token.shopSlug = user.shopSlug;
        token.sellerSlug = user.sellerSlug;
        token.businessName = user.businessName;
        token.businessVerificationStatus = user.businessVerificationStatus;
        token.individualVerified = user.individualVerified;
        token.backendToken = user.backendToken;
        // Store token creation time
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Re-fetch user data from database when session is being updated
      if (trigger === 'update' && token.id) {
        try {
          const updatedUser = await prisma.users.findUnique({
            where: { id: parseInt(token.id as string) },
            select: {
              id: true,
              email: true,
              full_name: true,
              phone: true,
              role: true,
              avatar: true,
              account_type: true,
              shop_slug: true,
              seller_slug: true,
              business_name: true,
              business_verification_status: true,
              individual_verified: true,
            },
          });

          if (updatedUser) {
            // Update token with fresh data from database
            token.name = updatedUser.full_name;
            token.email = updatedUser.email;
            token.phone = updatedUser.phone;
            token.role = updatedUser.role;
            token.image = updatedUser.avatar; // Update avatar
            token.accountType = updatedUser.account_type;
            token.shopSlug = updatedUser.shop_slug;
            token.sellerSlug = updatedUser.seller_slug;
            token.businessName = updatedUser.business_name;
            token.businessVerificationStatus = updatedUser.business_verification_status;
            token.individualVerified = updatedUser.individual_verified;
            console.log('🔄 [NextAuth] Session updated with fresh data from database');
          }
        } catch (error) {
          console.error('🔐 [NextAuth] Failed to refresh user data:', error);
        }
      }

      // Check if token has expired (24 hours = 86400 seconds)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0);
      if (tokenAge > 86400) {
        console.log('🔐 [NextAuth] Token expired, forcing logout');
        return null; // This will invalidate the session
      }

      return token;
    },

    async session({ session, token }) {
      // If token is null (expired), return null to force logout
      if (!token) {
        return null as any;
      }

      // Add user data from token to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.image as string | null; // Avatar
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
        session.user.accountType = token.accountType as string | null;
        session.user.shopSlug = token.shopSlug as string | null;
        session.user.sellerSlug = token.sellerSlug as string | null;
        session.user.businessName = token.businessName as string | null;
        session.user.businessVerificationStatus = token.businessVerificationStatus as string | null;
        session.user.individualVerified = token.individualVerified as boolean | null;
        session.user.backendToken = token.backendToken as string | null;
      }
      return session;
    },
  },

  events: {
    async signOut() {
      console.log('🔐 [NextAuth] User signed out');
    },
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
