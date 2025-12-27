/**
 * Test fixtures for user data
 * Use these in tests to maintain consistency
 */

export const testUsers = {
  regular: {
    id: 1,
    email: 'user@test.com',
    password: 'test123',
    password_hash: '$2b$10$test_hash', // bcrypt hash of 'test123'
    full_name: 'Test User',
    phone: '9800000000',
    is_active: true,
    is_suspended: false,
    account_type: 'individual',
    shop_slug: 'test-user',
    business_verification_status: null,
    individual_verified: false,
    created_at: new Date('2024-01-01'),
  },

  verified: {
    id: 2,
    email: 'verified@test.com',
    password: 'test123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Verified User',
    phone: '9800000001',
    is_active: true,
    is_suspended: false,
    account_type: 'individual',
    shop_slug: 'verified-user',
    business_verification_status: null,
    individual_verified: true,
    individual_verified_at: new Date('2024-06-01'),
    verified_seller_name: 'Verified Seller',
    created_at: new Date('2024-01-01'),
  },

  business: {
    id: 3,
    email: 'business@test.com',
    password: 'test123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Business Owner',
    phone: '9800000002',
    is_active: true,
    is_suspended: false,
    account_type: 'business',
    shop_slug: 'test-business-shop',
    business_name: 'Test Business Shop',
    business_verification_status: 'approved',
    business_verified_at: new Date('2024-06-01'),
    individual_verified: false,
    created_at: new Date('2024-01-01'),
  },

  suspended: {
    id: 4,
    email: 'suspended@test.com',
    password: 'test123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Suspended User',
    phone: '9800000003',
    is_active: true,
    is_suspended: true,
    account_type: 'individual',
    shop_slug: 'suspended-user',
    business_verification_status: null,
    individual_verified: false,
    created_at: new Date('2024-01-01'),
  },

  inactive: {
    id: 5,
    email: 'inactive@test.com',
    password: 'test123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Inactive User',
    phone: '9800000004',
    is_active: false,
    is_suspended: false,
    account_type: 'individual',
    shop_slug: 'inactive-user',
    business_verification_status: null,
    individual_verified: false,
    created_at: new Date('2024-01-01'),
  },
};

export const testEditors = {
  editor: {
    id: 100,
    email: 'editor@thulobazaar.com',
    password: 'editor123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Test Editor',
    role: 'editor',
    is_active: true,
    created_at: new Date('2024-01-01'),
  },

  admin: {
    id: 101,
    email: 'admin@thulobazaar.com',
    password: 'admin123',
    password_hash: '$2b$10$test_hash',
    full_name: 'Test Admin',
    role: 'admin',
    is_active: true,
    created_at: new Date('2024-01-01'),
  },
};

/**
 * Generate a valid JWT token for testing authenticated routes
 */
export function generateTestToken(userId: number, email: string): string {
  // In tests, use a simple test secret
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-jwt-secret-for-testing',
    { expiresIn: '1h' }
  );
}
