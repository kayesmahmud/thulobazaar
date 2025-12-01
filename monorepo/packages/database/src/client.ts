import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
import 'dotenv/config';

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL || 'postgresql://elw:postgres@localhost:5432/thulobazaar';
const pool = new Pool({ connectionString });

// Create adapter for Prisma 7
const adapter = new PrismaPg(pool);

// Prevent multiple instances of Prisma Client in development
// This is the recommended pattern from Prisma docs
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown (only in Node.js environment)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
}
