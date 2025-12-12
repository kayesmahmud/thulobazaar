import { Router } from 'express';

// Import all route modules
import authRoutes from './auth.routes.js';
import adsRoutes from './ads.routes.js';
import usersRoutes from './users.routes.js';
import verificationsRoutes from './verifications.routes.js';
import editorsRoutes from './editors.routes.js';
import statsRoutes from './stats.routes.js';
import reportsRoutes from './reports.routes.js';
import categoriesRoutes from './categories.routes.js';

const router = Router();

// Auth routes: /auth/login
router.use('/auth', authRoutes);

// Profile route is directly on auth routes
router.use('/', authRoutes);

// Stats routes: /stats (main), /notifications/count, /system-alerts, /avg-response-time, /trends, /support-chat/count, /avg-response-time/trend, /my-work-today
router.use('/', statsRoutes);

// Ads routes: /ads, /ads/:id/*, etc.
router.use('/ads', adsRoutes);

// Users routes: /users, /users/:id/*
router.use('/users', usersRoutes);

// Verifications routes: /verifications, /verifications/:id/*
router.use('/verifications', verificationsRoutes);

// Editors management routes: /editors, /editors/:id/*
router.use('/editors', editorsRoutes);

// Reports routes: /user-reports/*, /reported-ads, /reports/:id/dismiss
router.use('/', reportsRoutes);

// Categories routes: /categories, /categories/:id
router.use('/categories', categoriesRoutes);

export default router;
