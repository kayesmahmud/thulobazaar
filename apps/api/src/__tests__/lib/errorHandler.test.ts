import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler, ValidationError } from '../../middleware/errorHandler.js';
import { AD_LIMIT_REACHED_CODE } from '../../services/adLimits.service.js';

/**
 * Clients (web form + Flutter) key off `code`/`details` to localize the ad-cap
 * refusal and offer "Get verified" — this pins the wire shape the handler emits.
 */
function appThrowing(err: Error) {
  const app = express();
  app.get('/boom', (_req, _res, next) => next(err));
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('emits code and details when the error carries them', async () => {
    const err = new ValidationError('You have reached the limit of 50 ads for unverified accounts');
    err.code = AD_LIMIT_REACHED_CODE;
    err.details = { limit: 50, verifiedLimit: 1000, verified: false };

    const res = await request(appThrowing(err)).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: 'You have reached the limit of 50 ads for unverified accounts',
      code: 'AD_LIMIT_REACHED',
      details: { limit: 50, verifiedLimit: 1000, verified: false },
    });
  });

  it('omits code and details for a plain validation error', async () => {
    const res = await request(appThrowing(new ValidationError('Title is required'))).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title is required');
    expect(res.body).not.toHaveProperty('code');
    expect(res.body).not.toHaveProperty('details');
  });
});
