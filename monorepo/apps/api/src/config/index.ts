import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database (for legacy pg pool - Prisma uses its own connection)
  DB_USER: process.env.DB_USER || 'elw',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: process.env.DB_NAME || 'thulobazaar',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),

  // Security
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '24h') as string,

  // Typesense
  TYPESENSE_HOST: process.env.TYPESENSE_HOST || 'localhost',
  TYPESENSE_PORT: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
  TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL || 'http',
  TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY || '',

  // CORS
  CORS_ORIGINS: (process.env.CORS_ORIGIN || 'http://localhost:3333').split(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Email
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'smtp',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '',

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3333',

  // File Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
} as const;

// Validate required environment variables
export function validateConfig(): void {
  if (!config.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
  }
}

export default config;
