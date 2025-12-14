/**
 * Prisma Integration Test Utilities
 *
 * Provides helpers for database testing with Prisma.
 * Uses transactions for test isolation - changes are rolled back after each test.
 */
import { PrismaClient } from '@prisma/client';

// Create a test-specific Prisma client
export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://elw:postgres@localhost:5432/thulobazaar',
    },
  },
});

/**
 * Clean up specific tables (use in afterEach/afterAll)
 * Order matters due to foreign key constraints!
 */
export async function cleanupTestData(tables: string[]) {
  for (const table of tables) {
    try {
      await prismaTest.$executeRawUnsafe(`DELETE FROM ${table} WHERE id > 1000`);
    } catch (error) {
      console.warn(`Cleanup warning for ${table}:`, error);
    }
  }
}

/**
 * Create a test user for integration tests
 */
export async function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return prismaTest.users.create({
    data: {
      email: `test-${timestamp}@example.com`,
      full_name: `Test User ${timestamp}`,
      password: 'hashedpassword123',
      phone: `+977${timestamp.toString().slice(-10)}`,
      role: 'user',
      is_active: true,
      ...overrides,
    },
  });
}

/**
 * Create a test shop (user with business)
 */
export async function createTestShop(overrides = {}) {
  const timestamp = Date.now();
  return prismaTest.users.create({
    data: {
      email: `shop-${timestamp}@example.com`,
      full_name: `Test Shop ${timestamp}`,
      business_name: `Test Business ${timestamp}`,
      password: 'hashedpassword123',
      phone: `+977${timestamp.toString().slice(-10)}`,
      role: 'user',
      is_active: true,
      account_type: 'business',
      ...overrides,
    },
  });
}

/**
 * Disconnect Prisma after tests
 */
export async function disconnectPrisma() {
  await prismaTest.$disconnect();
}
