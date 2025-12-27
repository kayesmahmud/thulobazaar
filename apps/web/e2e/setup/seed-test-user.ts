/**
 * E2E Test User Seed Script
 *
 * Creates a test user for E2E testing.
 * Run: npx tsx e2e/setup/seed-test-user.ts
 *
 * This script should be run before running E2E tests that require authentication.
 */

import { prisma } from '@thulobazaar/database';
import bcrypt from 'bcryptjs';

// Test user credentials (must match auth fixture)
const TEST_USER = {
  phone: process.env.TEST_USER_PHONE || '9800000001',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  email: 'e2e-test@thulobazaar.local',
  fullName: 'E2E Test User',
};

async function main() {
  console.log('🔧 Setting up E2E test user...\n');

  // Check if test user already exists
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [
        { phone: TEST_USER.phone },
        { email: TEST_USER.email },
      ],
    },
  });

  if (existingUser) {
    console.log(`✅ Test user already exists (ID: ${existingUser.id})`);
    console.log(`   Phone: ${existingUser.phone}`);
    console.log(`   Email: ${existingUser.email}`);

    // Update password in case it changed
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
    await prisma.users.update({
      where: { id: existingUser.id },
      data: {
        password_hash: hashedPassword,
        phone_verified: true,
        is_active: true,
        is_suspended: false,
      },
    });
    console.log('   Password updated to test credentials.');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);

  // Create the test user
  const user = await prisma.users.create({
    data: {
      phone: TEST_USER.phone,
      email: TEST_USER.email,
      password_hash: hashedPassword,
      full_name: TEST_USER.fullName,
      phone_verified: true,
      is_active: true,
      is_verified: false,
      is_suspended: false,
      role: 'user',
      account_type: 'individual',
    },
  });

  console.log(`✅ Test user created successfully!`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Phone: ${user.phone}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: ${TEST_USER.password}`);
  console.log('');
  console.log('📝 Use these credentials in your E2E tests:');
  console.log(`   TEST_USER_PHONE=${TEST_USER.phone}`);
  console.log(`   TEST_USER_PASSWORD=${TEST_USER.password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
