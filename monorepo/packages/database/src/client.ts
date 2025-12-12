import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables
import 'dotenv/config';

// Create PostgreSQL connection pool with proper configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://elw:postgres@localhost:5432/thulobazaar';
const isProduction = process.env.NODE_ENV === 'production';

// Environment-specific pool configuration
const poolConfig = {
  connectionString,
  // Pool size: smaller in dev, larger in production
  max: isProduction ? 20 : 10,
  min: isProduction ? 5 : 2,
  // Timeout configuration
  idleTimeoutMillis: isProduction ? 60000 : 30000,  // 60s prod, 30s dev
  connectionTimeoutMillis: 5000,                     // 5 seconds
  // Statement timeout (prevent long-running queries)
  statement_timeout: isProduction ? 60000 : 30000,   // 60s prod, 30s dev
};

const pool = new Pool(poolConfig);

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
  console.error('🔴 Unexpected database pool error:', err.message);
  // Don't exit - let the pool try to recover
});

pool.on('connect', () => {
  if (!isProduction) {
    console.log('🟢 New database connection established');
  }
});

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
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Health check function - verify database connectivity
 * Use this in API health endpoints
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latencyMs: number;
  poolStats: { total: number; idle: number; waiting: number };
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      healthy: true,
      latencyMs: Date.now() - start,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      poolStats: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown (only in Node.js environment)
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
}
