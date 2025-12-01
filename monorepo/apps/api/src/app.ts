import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import config from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes (will be added as we migrate them)
import authRoutes from './routes/auth.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import adsRoutes from './routes/ads.routes.js';
import profileRoutes from './routes/profile.routes.js';
import shopRoutes from './routes/shop.routes.js';
import searchRoutes from './routes/search.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import editorRoutes from './routes/editor.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import areasRoutes from './routes/areas.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import mockPaymentRoutes from './routes/mockPayment.routes.js';

export function createApp(): Express {
  const app = express();

  // Security middleware - Helmet for HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'http://localhost:3000',
            'http://localhost:3333',
            'http://localhost:5000',
          ],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files statically with CORS headers
  const uploadsPath = path.resolve(config.UPLOAD_DIR);
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      next();
    },
    express.static(uploadsPath)
  );

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
  });

  // Test endpoint
  app.get('/api/test', (_req, res) => {
    res.json({ success: true, message: 'ThuluBazaar API v2 (TypeScript)' });
  });

  // Register routes
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/locations', locationsRoutes);
  app.use('/api/ads', adsRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/profiles', profileRoutes); // Alias
  app.use('/api/shop', shopRoutes);
  app.use('/api/seller', shopRoutes); // Alias
  app.use('/api/search', searchRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/editor', editorRoutes);
  app.use('/api/admin', editorRoutes); // Admin uses same routes as editor
  app.use('/api/verification', verificationRoutes);
  app.use('/api/areas', areasRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/promotion-pricing', promotionRoutes);
  app.use('/api/mock-payment', mockPaymentRoutes);

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
}
