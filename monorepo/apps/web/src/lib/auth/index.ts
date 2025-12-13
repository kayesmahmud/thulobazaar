// @ts-nocheck
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from '@thulobazaar/database';
import {
  findUserForAuth,
  validateUserStatus,
  verifyPassword,
  verify2FA,
  generateBackendToken,
  fetchBackendToken,
  createUserObject,
  generateShopSlug,
} from './helpers';
import { userSelectBase, userSelectForOAuth } from './queries';

export const authOptions: NextAuthOptions = {
  debug: true,

  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),

    // OAuth Token Provider (for backend Passport.js flow)
    CredentialsProvider({
      id: 'oauth-token',
      name: 'OAuth Token',
      credentials: {
        token: { label: 'Token', type: 'text' },
        userId: { label: 'User ID', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.token || !credentials?.userId || !credentials?.email) {
          throw new Error('Missing OAuth credentials');
        }

        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(
            credentials.token,
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
          );

          const user = await prisma.users.findUnique({
            where: { id: decoded.userId },
            select: userSelectBase,
          });

          if (!user) throw new Error('User not found');
          if (!user.is_active) throw new Error('Account is deactivated');

          console.log('🔐 [OAuth Token] User authenticated:', user.email);

          return createUserObject(user as any, credentials.token, 'google');
        } catch (error: any) {
          console.error('🔐 [OAuth Token] Error:', error.message);
          throw new Error(error.message || 'Token verification failed');
        }
      },
    }),

    // Credentials Provider (Email/Phone Login)
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
        phone: { label: 'Phone', type: 'tel' },
        loginType: { label: 'Login Type', type: 'text' },
      },
      async authorize(credentials) {
        const isPhoneLogin = credentials?.loginType === 'phone';

        // Validate required fields
        if (isPhoneLogin) {
          if (!credentials?.phone || !credentials?.password) {
            throw new Error('Phone and password are required');
          }
        } else {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }
        }

        try {
          const user = await findUserForAuth(
            isPhoneLogin ? undefined : credentials.email,
            isPhoneLogin ? credentials.phone : undefined
          );

          if (!user) {
            throw new Error(isPhoneLogin ? 'No account found with this phone number' : 'Invalid email or password');
          }

          const statusError = validateUserStatus(user);
          if (statusError) throw new Error(statusError);

          const isValidPassword = await verifyPassword(credentials.password, user.password_hash);
          if (!isValidPassword) throw new Error('Invalid email or password');

          // Handle 2FA
          if (user.two_factor_enabled && user.two_factor_secret) {
            if (!credentials.twoFactorCode) throw new Error('2FA_REQUIRED');

            const { valid } = await verify2FA(user, credentials.twoFactorCode);
            if (!valid) throw new Error('Invalid 2FA code');
          }

          const previousLastLogin = user.last_login;
          await prisma.users.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          });

          // Generate backend token
          let backendToken: string | null = null;
          if (isPhoneLogin || !credentials.email) {
            backendToken = await generateBackendToken(user);
          } else {
            backendToken = await fetchBackendToken(credentials.email, credentials.password, user.role);
          }

          return {
            ...createUserObject(user as any, backendToken),
            lastLogin: previousLastLogin?.toISOString() || null,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 [OAUTH] Sign in - Provider:', account?.provider, 'Email:', user?.email);

      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const email = user.email;
          if (!email) {
            console.error('🔐 [OAUTH] ERROR: No email from provider');
            return false;
          }

          let dbUser = await prisma.users.findUnique({ where: { email } });

          if (dbUser) {
            const updateData: any = {
              last_login: new Date(),
              oauth_provider: account.provider,
            };

            if (!dbUser.avatar && user.image) updateData.avatar = user.image;
            if (!dbUser.shop_slug) {
              updateData.shop_slug = generateShopSlug(dbUser.full_name, dbUser.id);
            }

            await prisma.users.update({ where: { id: dbUser.id }, data: updateData });
          } else {
            const fullName = user.name || profile?.name || email.split('@')[0];

            dbUser = await prisma.users.create({
              data: {
                email,
                full_name: fullName,
                password_hash: '',
                oauth_provider: account.provider,
                oauth_provider_id: account.providerAccountId,
                avatar: user.image || null,
                is_active: true,
                role: 'user',
                account_type: 'individual',
                last_login: new Date(),
              },
            });

            await prisma.users.update({
              where: { id: dbUser.id },
              data: { shop_slug: generateShopSlug(fullName, dbUser.id) },
            });
          }

          (user as any).dbId = dbUser.id.toString();
          (user as any).dbRole = dbUser.role;
          (user as any).oauthProvider = account.provider;

          return true;
        } catch (error: any) {
          console.error('🔐 [OAUTH] SIGN IN ERROR:', error?.message);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // Handle OAuth sign-in
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const dbId = (user as any).dbId;
        if (dbId) {
          const dbUser = await prisma.users.findUnique({
            where: { id: parseInt(dbId) },
            select: userSelectForOAuth,
          });

          if (dbUser) {
            Object.assign(token, {
              id: dbUser.id.toString(),
              name: dbUser.full_name,
              email: dbUser.email,
              image: dbUser.avatar || user.image,
              role: dbUser.role,
              phone: dbUser.phone,
              accountType: dbUser.account_type,
              shopSlug: dbUser.shop_slug,
              customShopSlug: dbUser.custom_shop_slug,
              businessName: dbUser.business_name,
              businessVerificationStatus: dbUser.business_verification_status,
              individualVerified: dbUser.individual_verified,
              oauthProvider: dbUser.oauth_provider,
              iat: Math.floor(Date.now() / 1000),
            });
            return token;
          }
        }
      }

      // Add user data on credentials sign in
      if (user) {
        Object.assign(token, {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          phone: user.phone,
          accountType: user.accountType,
          shopSlug: user.shopSlug,
          customShopSlug: user.customShopSlug,
          businessName: user.businessName,
          businessVerificationStatus: user.businessVerificationStatus,
          individualVerified: user.individualVerified,
          lastLogin: user.lastLogin,
          backendToken: user.backendToken,
          oauthProvider: user.oauthProvider,
          iat: Math.floor(Date.now() / 1000),
        });
      }

      // Handle session update trigger
      if (trigger === 'update' && token.id) {
        try {
          const updatedUser = await prisma.users.findUnique({
            where: { id: parseInt(token.id as string) },
            select: userSelectBase,
          });

          if (updatedUser) {
            Object.assign(token, {
              name: updatedUser.full_name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              role: updatedUser.role,
              image: updatedUser.avatar,
              accountType: updatedUser.account_type,
              shopSlug: updatedUser.shop_slug,
              customShopSlug: updatedUser.custom_shop_slug,
              businessName: updatedUser.business_name,
              businessVerificationStatus: updatedUser.business_verification_status,
              individualVerified: updatedUser.individual_verified,
            });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }

      // Check token expiration (24 hours)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0);
      if (tokenAge > 86400) return null;

      return token;
    },

    async session({ session, token }) {
      if (!token) return null as any;

      if (session.user) {
        Object.assign(session.user, {
          id: token.id as string,
          name: token.name as string | null,
          email: token.email as string | null,
          image: token.image as string | null,
          role: token.role as string,
          phone: token.phone as string | null,
          accountType: token.accountType as string | null,
          shopSlug: token.shopSlug as string | null,
          customShopSlug: token.customShopSlug as string | null,
          businessName: token.businessName as string | null,
          businessVerificationStatus: token.businessVerificationStatus as string | null,
          individualVerified: token.individualVerified as boolean | null,
          lastLogin: token.lastLogin as string | null,
          backendToken: token.backendToken as string | null,
          oauthProvider: token.oauthProvider as string | null,
        });
      }

      (session as any).backendToken = token.backendToken as string | null;

      return session;
    },
  },

  events: {
    async signOut() {
      console.log('🔐 [NextAuth] User signed out');
    },
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
