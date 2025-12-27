import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

const app = createApp();

describe('Health Check Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 with success message', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/test', () => {
    it('should return API version info', async () => {
      const response = await request(app).get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('ThuluBazaar API');
    });
  });

  describe('GET /api/nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
    });
  });
});
