import request from 'supertest';
import type { Express } from 'express';

/** The dev web origin; allow-listed by default in config.CORS_ORIGINS. */
export const BROWSER_ORIGIN = 'http://localhost:3333';

/**
 * A supertest agent that behaves like a browser client: every request carries an
 * Origin header. app.ts rejects origin-less POST/PUT/DELETE with 403 (CSRF guard)
 * before any route runs, so without this the route-level auth/validation that the
 * tests assert on is never reached.
 */
export function browserRequest(app: Express) {
  return request.agent(app).set('Origin', BROWSER_ORIGIN);
}
