// @ts-nocheck
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// =============================================================================
// FRESH OAUTH CONFIGURATION - REBUILT FROM SCRATCH
// =============================================================================

export const authOptions: NextAuthOptions = {
  // Enable debug mode to see all OAuth logs
  debug: true,

  providers: [
    // ==========================================================================
    // GOOGLE OAUTH PROVIDER - FRESH CONFIGURATION
    // ==========================================================================
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
      // Use allowDangerousEmailAccountLinking to allow users who already have
      // an account with the same email to link their OAuth account
      allowDangerousEmailAccountLinking: true,
    }),

    // ==========================================================================
    // FACEBOOK OAUTH PROVIDER
    // ==========================================================================
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),

    // ==========================================================================
    // OAUTH TOKEN PROVIDER (For backend Passport.js OAuth flow)
    // ==========================================================================
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
          // Verify the JWT token from backend
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(
            credentials.token,
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
          );

          // Fetch user from database to get full profile
          const user = await prisma.users.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              full_name: true,
              phone: true,
              role: true,
              avatar: true,
              is_active: true,
              account_type: true,
              shop_slug: true,
              custom_shop_slug: true,
              business_name: true,
              business_verification_status: true,
              individual_verified: true,
            },
          });

          if (!user) {
            throw new Error('User not found');
          }

          if (!user.is_active) {
            throw new Error('Account is deactivated');
          }

          console.log('🔐 [OAuth Token] User authenticated:', user.email);

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            image: user.avatar,
            role: user.role,
            phone: user.phone,
            accountType: user.account_type,
            shopSlug: user.shop_slug,
            customShopSlug: user.custom_shop_slug,
            businessName: user.business_name,
            businessVerificationStatus: user.business_verification_status,
            individualVerified: user.individual_verified,
            backendToken: credentials.token,
            oauthProvider: 'google',
          };
        } catch (error: any) {
          console.error('🔐 [OAuth Token] Error:', error.message);
          throw new Error(error.message || 'Token verification failed');
        }
      },
    }),

    // ==========================================================================
    // CREDENTIALS PROVIDER (Email/Phone Login)
    // ==========================================================================
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text', placeholder: '000000' },
        phone: { label: 'Phone', type: 'tel', placeholder: '98XXXXXXXX' },
        loginType: { label: 'Login Type', type: 'text' },
      },
      async authorize(credentials) {
        const isPhoneLogin = credentials?.loginType === 'phone';

        // Validate required fields based on login type
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
          // Find user in database
          let user;
          if (isPhoneLogin) {
            let phoneNumber = credentials.phone.replace(/\D/g, '');
            if (phoneNumber.startsWith('977')) {
              phoneNumber = phoneNumber.slice(3);
            }

            user = await prisma.users.findFirst({
              where: {
                phone: phoneNumber,
                phone_verified: true,
              },
              select: {
                id: true,
                email: true,
                password_hash: true,
                full_name: true,
                phone: true,
                role: true,
                is_active: true,
                avatar: true,
                last_login: true,
                account_type: true,
                shop_slug: true,
                custom_shop_slug: true,
                business_name: true,
                business_verification_status: true,
                individual_verified: true,
                two_factor_enabled: true,
                two_factor_secret: true,
                two_factor_backup_codes: true,
              },
            });

            if (!user) {
              throw new Error('No account found with this phone number');
            }
          } else {
            user = await prisma.users.findUnique({
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
                last_login: true,
                account_type: true,
                shop_slug: true,
                custom_shop_slug: true,
                business_name: true,
                business_verification_status: true,
                individual_verified: true,
                two_factor_enabled: true,
                two_factor_secret: true,
                two_factor_backup_codes: true,
              },
            });

            if (!user) {
              throw new Error('Invalid email or password');
            }
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

          // Check if 2FA is enabled
          if (user.two_factor_enabled && user.two_factor_secret) {
            const twoFactorCode = credentials.twoFactorCode;

            if (!twoFactorCode) {
              throw new Error('2FA_REQUIRED');
            }

            const speakeasy = require('speakeasy');

            const isValidTotp = speakeasy.totp.verify({
              secret: user.two_factor_secret,
              encoding: 'base32',
              token: twoFactorCode,
              window: 2,
            });

            let isValid = isValidTotp;

            if (!isValidTotp && user.two_factor_backup_codes) {
              const backupCodes = JSON.parse(user.two_factor_backup_codes as string);
              if (backupCodes.includes(twoFactorCode.toUpperCase())) {
                isValid = true;
                const updatedBackupCodes = backupCodes.filter(
                  (code: string) => code !== twoFactorCode.toUpperCase()
                );
                await prisma.users.update({
                  where: { id: user.id },
                  data: { two_factor_backup_codes: JSON.stringify(updatedBackupCodes) },
                });
              }
            }

            if (!isValid) {
              throw new Error('Invalid 2FA code');
            }
          }

          const previousLastLogin = user.last_login;

          await prisma.users.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          });

          // Generate backend token
          let backendToken = null;
          try {
            if (isPhoneLogin || !credentials.email) {
              const JWT_SECRET = new TextEncoder().encode(
                process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
              );
              backendToken = await new SignJWT({
                userId: user.id,
                email: user.email || '',
                phone: user.phone,
                role: user.role,
              })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('24h')
                .sign(JWT_SECRET);
            } else {
              const backendUrl = process.env.API_URL || 'http://localhost:5000';
              let loginEndpoint;
              if (user.role === 'root') {
                loginEndpoint = `${backendUrl}/api/editor/root-login`;
              } else if (user.role === 'super_admin') {
                loginEndpoint = `${backendUrl}/api/admin/auth/login`;
              } else if (user.role === 'editor') {
                loginEndpoint = `${backendUrl}/api/admin/auth/login`;
              } else {
                loginEndpoint = `${backendUrl}/api/auth/login`;
              }

              if (loginEndpoint) {
                const response = await fetch(loginEndpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                  }),
                });

                if (response.ok) {
                  const data = await response.json();
                  backendToken = data.data?.token || data.token;
                }
              }
            }
          } catch (error) {
            console.error('Failed to get backend token:', error);
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.full_name,
            image: user.avatar,
            role: user.role,
            phone: user.phone,
            accountType: user.account_type,
            shopSlug: user.shop_slug,
            customShopSlug: user.custom_shop_slug,
            businessName: user.business_name,
            businessVerificationStatus: user.business_verification_status,
            individualVerified: user.individual_verified,
            lastLogin: previousLastLogin?.toISOString() || null,
            backendToken,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],

  // ============================================================================
  // CALLBACKS - FRESH IMPLEMENTATION
  // ============================================================================
  callbacks: {
    // --------------------------------------------------------------------------
    // SIGN IN CALLBACK - Handles OAuth user creation/update
    // --------------------------------------------------------------------------
    async signIn({ user, account, profile }) {
      console.log('========================================');
      console.log('🔐 [OAUTH] SIGN IN CALLBACK TRIGGERED');
      console.log('========================================');
      console.log('Provider:', account?.provider);
      console.log('User email:', user?.email);
      console.log('User name:', user?.name);
      console.log('Profile:', JSON.stringify(profile, null, 2));

      // Only handle OAuth providers (Google/Facebook)
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const email = user.email;

          if (!email) {
            console.error('🔐 [OAUTH] ERROR: No email from provider');
            return false;
          }

          console.log('🔐 [OAUTH] Looking up user in database...');

          // Check if user exists
          let dbUser = await prisma.users.findUnique({
            where: { email },
          });

          if (dbUser) {
            console.log('🔐 [OAUTH] Existing user found:', dbUser.id);

            // Update existing user
            const updateData: any = {
              last_login: new Date(),
              oauth_provider: account.provider,
            };

            if (!dbUser.avatar && user.image) {
              updateData.avatar = user.image;
            }

            if (!dbUser.shop_slug) {
              const baseSlug = dbUser.full_name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .substring(0, 50);
              updateData.shop_slug = `${baseSlug}-${dbUser.id}`;
            }

            await prisma.users.update({
              where: { id: dbUser.id },
              data: updateData,
            });

            console.log('🔐 [OAUTH] User updated successfully');
          } else {
            console.log('🔐 [OAUTH] Creating new user...');

            // Create new user
            const fullName = user.name || profile?.name || email.split('@')[0];
            const baseSlug = fullName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 50);

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

            const shopSlug = `${baseSlug}-${dbUser.id}`;
            await prisma.users.update({
              where: { id: dbUser.id },
              data: { shop_slug: shopSlug },
            });

            dbUser.shop_slug = shopSlug;
            console.log('🔐 [OAUTH] New user created:', dbUser.id);
          }

          // Store database ID for JWT callback
          (user as any).dbId = dbUser.id.toString();
          (user as any).dbRole = dbUser.role;
          (user as any).oauthProvider = account.provider;

          console.log('🔐 [OAUTH] Sign in SUCCESS');
          return true;
        } catch (error: any) {
          console.error('========================================');
          console.error('🔐 [OAUTH] SIGN IN ERROR');
          console.error('========================================');
          console.error('Message:', error?.message);
          console.error('Code:', error?.code);
          console.error('Full error:', error);
          return false;
        }
      }

      // Allow credentials login
      return true;
    },

    // --------------------------------------------------------------------------
    // JWT CALLBACK - Add user data to token
    // --------------------------------------------------------------------------
    async jwt({ token, user, account, trigger }) {
      // Handle OAuth sign-in
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const dbId = (user as any).dbId;
        if (dbId) {
          const dbUser = await prisma.users.findUnique({
            where: { id: parseInt(dbId) },
            select: {
              id: true,
              email: true,
              full_name: true,
              phone: true,
              role: true,
              avatar: true,
              account_type: true,
              shop_slug: true,
              custom_shop_slug: true,
              business_name: true,
              business_verification_status: true,
              individual_verified: true,
              oauth_provider: true,
            },
          });

          if (dbUser) {
            token.id = dbUser.id.toString();
            token.name = dbUser.full_name;
            token.email = dbUser.email;
            token.image = dbUser.avatar || user.image;
            token.role = dbUser.role;
            token.phone = dbUser.phone;
            token.accountType = dbUser.account_type;
            token.shopSlug = dbUser.shop_slug;
            token.customShopSlug = dbUser.custom_shop_slug;
            token.businessName = dbUser.business_name;
            token.businessVerificationStatus = dbUser.business_verification_status;
            token.individualVerified = dbUser.individual_verified;
            token.oauthProvider = dbUser.oauth_provider;
            token.iat = Math.floor(Date.now() / 1000);
            return token;
          }
        }
      }

      // Add user data on credentials sign in
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.role = user.role;
        token.phone = user.phone;
        token.accountType = user.accountType;
        token.shopSlug = user.shopSlug;
        token.customShopSlug = user.customShopSlug;
        token.businessName = user.businessName;
        token.businessVerificationStatus = user.businessVerificationStatus;
        token.individualVerified = user.individualVerified;
        token.lastLogin = user.lastLogin;
        token.backendToken = user.backendToken;
        token.oauthProvider = user.oauthProvider;
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Handle session update trigger
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
              custom_shop_slug: true,
              business_name: true,
              business_verification_status: true,
              individual_verified: true,
            },
          });

          if (updatedUser) {
            token.name = updatedUser.full_name;
            token.email = updatedUser.email;
            token.phone = updatedUser.phone;
            token.role = updatedUser.role;
            token.image = updatedUser.avatar;
            token.accountType = updatedUser.account_type;
            token.shopSlug = updatedUser.shop_slug;
            token.customShopSlug = updatedUser.custom_shop_slug;
            token.businessName = updatedUser.business_name;
            token.businessVerificationStatus = updatedUser.business_verification_status;
            token.individualVerified = updatedUser.individual_verified;
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }

      // Check token expiration (24 hours)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0);
      if (tokenAge > 86400) {
        return null;
      }

      return token;
    },

    // --------------------------------------------------------------------------
    // SESSION CALLBACK - Add token data to session
    // --------------------------------------------------------------------------
    async session({ session, token }) {
      if (!token) {
        return null as any;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.image as string | null;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string | null;
        session.user.accountType = token.accountType as string | null;
        session.user.shopSlug = token.shopSlug as string | null;
        session.user.customShopSlug = token.customShopSlug as string | null;
        session.user.businessName = token.businessName as string | null;
        session.user.businessVerificationStatus = token.businessVerificationStatus as string | null;
        session.user.individualVerified = token.individualVerified as boolean | null;
        session.user.lastLogin = token.lastLogin as string | null;
        session.user.backendToken = token.backendToken as string | null;
        session.user.oauthProvider = token.oauthProvider as string | null;
      }

      (session as any).backendToken = token.backendToken as string | null;

      return session;
    },
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  events: {
    async signOut() {
      console.log('🔐 [NextAuth] User signed out');
    },
  },

  // ============================================================================
  // PAGES - Custom auth pages
  // ============================================================================
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  // ============================================================================
  // SESSION CONFIGURATION
  // ============================================================================
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ============================================================================
  // SECRET - REQUIRED for production
  // ============================================================================
  secret: process.env.NEXTAUTH_SECRET,
};
