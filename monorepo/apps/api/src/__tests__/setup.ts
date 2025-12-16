import { vi, beforeAll, afterAll } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// Mock console to reduce noise in tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});
