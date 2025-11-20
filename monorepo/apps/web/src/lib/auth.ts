// @ts-nocheck
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  debug: false, // Disable debug logging
  logger: {
    error: () => {}, // Suppress error logs in console
    warn: () => {},  // Suppress warnings
    debug: () => {}, // Suppress debug logs
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text', placeholder: '000000' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Find user in database (include 2FA fields)
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
              last_login: true,
              account_type: true,
              shop_slug: true,
              seller_slug: true,
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

          // Check if 2FA is enabled for this user
          if (user.two_factor_enabled && user.two_factor_secret) {
            const twoFactorCode = credentials.twoFactorCode;

            // If no 2FA code provided, signal that 2FA is required
            if (!twoFactorCode) {
              throw new Error('2FA_REQUIRED');
            }

            // Verify 2FA code
            const speakeasy = require('speakeasy');

            // First try TOTP verification
            const isValidTotp = speakeasy.totp.verify({
              secret: user.two_factor_secret,
              encoding: 'base32',
              token: twoFactorCode,
              window: 2, // Allow 2 time steps before/after (60 seconds)
            });

            let isValid = isValidTotp;

            // If TOTP fails, check if it's a backup code
            if (!isValidTotp && user.two_factor_backup_codes) {
              const backupCodes = JSON.parse(user.two_factor_backup_codes as string);
              if (backupCodes.includes(twoFactorCode.toUpperCase())) {
                isValid = true;

                // Remove used backup code
                const updatedBackupCodes = backupCodes.filter(
                  (code: string) => code !== twoFactorCode.toUpperCase()
                );

                await prisma.users.update({
                  where: { id: user.id },
                  data: {
                    two_factor_backup_codes: JSON.stringify(updatedBackupCodes)
                  },
                });

                console.log('🔐 [2FA] Backup code used and removed');
              }
            }

            if (!isValid) {
              throw new Error('Invalid 2FA code');
            }

            console.log('🔐 [2FA] Code verified successfully');
          }

          // Save the current last_login BEFORE updating it (this is what we'll show)
          const previousLastLogin = user.last_login;

          // Update last login timestamp to NOW for next time
          await prisma.users.update({
            where: { id: user.id },
            data: { last_login: new Date() },
          });

          // Also get backend JWT token for API calls
          let backendToken = null;
          try {
            const backendUrl = process.env.API_URL || 'http://localhost:5000';

            // Choose correct endpoint based on role
            let loginEndpoint;
            if (user.role === 'root') {
              loginEndpoint = `${backendUrl}/api/editor/root-login`;
            } else if (user.role === 'super_admin') {
              loginEndpoint = `${backendUrl}/api/admin/auth/login`;
            } else if (user.role === 'editor') {
              // Regular editors use admin auth endpoint
              loginEndpoint = `${backendUrl}/api/admin/auth/login`;
            } else {
              // Regular users use the user auth endpoint
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
                // Backend returns: { success, data: { token, user } } or { success, token, user }
                backendToken = data.data?.token || data.token;
                console.log('🔐 [NextAuth] Backend token fetched for role', user.role, ':', backendToken ? 'Yes' : 'No');
              } else {
                const errorText = await response.text();
                console.error('🔐 [NextAuth] Backend login failed:', response.status, errorText);
              }
            }
          } catch (error) {
            console.error('🔐 [NextAuth] Failed to get backend token:', error);
            // Continue anyway - NextAuth session will work, but API calls might need separate handling
          }

          // Return user data (without password_hash) plus backend token and PREVIOUS last login
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
        token.customShopSlug = user.customShopSlug;
        token.businessName = user.businessName;
        token.businessVerificationStatus = user.businessVerificationStatus;
        token.individualVerified = user.individualVerified;
        token.lastLogin = user.lastLogin;
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
              custom_shop_slug: true,
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
            token.customShopSlug = updatedUser.custom_shop_slug;
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
        session.user.customShopSlug = token.customShopSlug as string | null;
        session.user.businessName = token.businessName as string | null;
        session.user.businessVerificationStatus = token.businessVerificationStatus as string | null;
        session.user.individualVerified = token.individualVerified as boolean | null;
        session.user.lastLogin = token.lastLogin as string | null;
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
    signIn: '/auth/signin',
    signOut: '/auth/logout',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET,
};
