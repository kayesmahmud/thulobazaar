# 🚀 Migration Checklist - Old Backend & Frontend → Monorepo

## 📊 Overview

**Before deleting `/Documents/Web/thulobazaar/backend` and `/frontend`:**

- **Backend**: 62+ API endpoints, 28 database migrations, comprehensive marketplace API
- **Frontend**: 18 routes, 50+ components, 39,561 lines of React code
- **Critical**: Files, database schema, and running services need careful migration

---

## 🔴 CRITICAL - MUST MIGRATE (Cannot Delete Until Complete)

### 1. Uploaded Files (HIGHEST PRIORITY)

**Location**: `/backend/uploads/`

**What's stored:**
```
uploads/
├── ads/                      # Ad images (user-uploaded)
├── avatars/                  # User profile pictures
├── covers/                   # User cover photos
├── business-licenses/        # Business verification documents
├── business_verification/    # Additional business docs
└── individual_verification/  # ID documents, selfies
```

**Action Required:**
- [ ] **Option 1**: Move to monorepo `/public/uploads/`
- [ ] **Option 2**: Upload to cloud storage (AWS S3, Cloudinary, etc.)
- [ ] **Option 3**: Keep backend folder ONLY for uploads (delete code)
- [ ] Update database `file_path` columns to new URLs
- [ ] Update frontend image URLs

**Estimated size**: Check with `du -sh /Users/elw/Documents/Web/thulobazaar/backend/uploads/`

---

### 2. Database Migrations (CRITICAL)

**Location**: `/backend/migrations/` (28 migration files)

**What's in database:**
- Complete schema (users, ads, categories, locations, etc.)
- All user data, ads, images, messages
- Verification requests
- Payment transactions
- Promotion history

**Action Required:**
- [ ] **Database is EXTERNAL** - Lives in PostgreSQL (port 5432)
- [ ] Verify database connection: `psql -U elw -d thulobazaar -c "\dt"`
- [ ] **Keep migration files** as documentation (copy to monorepo/docs/)
- [ ] Document database schema in monorepo
- [ ] Update monorepo connection strings to point to same database

**Note**: Database itself is NOT in backend folder, so it won't be deleted. But migration files should be preserved.

---

### 3. Typesense Search Index

**Location**: `/backend/typesense-data/` (search index)

**What's stored:**
- Indexed ads for fast search
- 115MB typesense-server binary

**Action Required:**
- [ ] **Option 1**: Move typesense-data to monorepo
- [ ] **Option 2**: Reindex all ads to new Typesense instance
- [ ] **Option 3**: Use external Typesense Cloud
- [ ] Update Typesense connection config

**Reindex command** (if needed):
```bash
curl -X POST http://localhost:5000/api/search/reindex
```

---

### 4. Environment Variables & Secrets

**Location**: `/backend/.env`

**Critical secrets:**
```env
# Database
DB_USER, DB_PASSWORD, DB_NAME, DB_HOST

# Security
JWT_SECRET (MUST match for existing tokens)

# Typesense
TYPESENSE_API_KEY

# Future: eSewa/Khalti payment keys
```

**Action Required:**
- [ ] Copy ALL .env variables to monorepo
- [ ] **CRITICAL**: Use same JWT_SECRET or all users must re-login
- [ ] Document all environment variables
- [ ] Update CORS origins to remove old frontend URLs

---

## 🟠 HIGH PRIORITY - Backend API Endpoints

### All 62 Endpoints Need Migration

**Organized by Feature:**

#### Authentication (3 endpoints)
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/super-admin/auth/login

#### User Profile (8 endpoints)
- [ ] GET /api/profile
- [ ] PUT /api/profile
- [ ] POST /api/profile/avatar
- [ ] POST /api/profile/cover
- [ ] DELETE /api/profile/avatar
- [ ] DELETE /api/profile/cover
- [ ] GET /api/shop/:shopSlug
- [ ] GET /api/seller/:sellerSlug

#### Ads Management (10 endpoints)
- [ ] GET /api/ads (with filters)
- [ ] GET /api/ads/:id
- [ ] POST /api/ads (with image upload)
- [ ] PUT /api/ads/:id
- [ ] DELETE /api/ads/:id
- [ ] GET /api/ads/my-ads
- [ ] GET /api/ads/nearby
- [ ] GET /api/shop/:shopSlug/ads
- [ ] GET /api/seller/:sellerSlug/ads

#### Categories & Locations (6 endpoints)
- [ ] GET /api/categories
- [ ] GET /api/locations (hierarchical)
- [ ] GET /api/locations/search
- [ ] GET /api/locations/reverse
- [ ] GET /api/areas
- [ ] GET /api/areas/search

#### Search (Typesense) (4 endpoints)
- [ ] GET /api/search
- [ ] GET /api/search/suggest
- [ ] GET /api/search/stats
- [ ] POST /api/search/reindex

#### Messaging (4 endpoints)
- [ ] POST /api/contact-seller
- [ ] GET /api/user/contact-messages
- [ ] POST /api/reply-message
- [ ] POST /api/report-ad

#### Verification (10 endpoints)
- [ ] POST /api/business/verify-request
- [ ] GET /api/business/verification-status
- [ ] POST /api/individual-verification/submit
- [ ] GET /api/individual-verification/status
- [ ] GET /api/verification/status (unified)
- [ ] GET /api/business/verification-requests (Editor)
- [ ] PUT /api/business/verification-requests/:id/approve
- [ ] PUT /api/business/verification-requests/:id/reject

#### Promotions (7 endpoints)
- [ ] GET /api/business/promotion-pricing
- [ ] POST /api/business/promote-ad
- [ ] GET /api/business/my-promotions
- [ ] GET /api/promotion-pricing
- [ ] GET /api/promotion-pricing/:type

#### Mock Payment (7 endpoints - TESTING ONLY)
- [ ] GET /api/mock-payment
- [ ] POST /api/mock-payment/initiate
- [ ] GET /api/mock-payment/success
- [ ] GET /api/mock-payment/failure
- [ ] POST /api/mock-payment/verify
- [ ] GET /api/mock-payment/status/:txnId

**Note**: These are already in monorepo backend docs, but need to be implemented.

#### Admin Panel (15+ endpoints)
- [ ] GET /api/super-admin/stats
- [ ] GET /api/super-admin/ads
- [ ] GET /api/super-admin/users
- [ ] PUT /api/super-admin/ads/:id/status
- [ ] PUT /api/super-admin/users/:id/status
- [ ] DELETE /api/super-admin/ads/:id
- [ ] All verification approval/rejection endpoints

---

## 🟡 MEDIUM PRIORITY - Backend Services & Logic

### Core Services (Copy to Monorepo)

- [ ] **promotionService.js** (278 lines)
  - Promotion activation logic
  - Price calculation with business discounts
  - Expiration handling

- [ ] **typesenseService.js** (150+ lines)
  - Search indexing
  - Collection management
  - Bulk operations

- [ ] **mockPaymentService.js** (100+ lines)
  - Payment simulation (for testing)
  - Replace with real eSewa/Khalti later

### Middleware (Copy to Monorepo)

- [ ] **auth.js** - JWT authentication
- [ ] **editorAuth.js** - Editor/admin authentication
- [ ] **secureFileUpload.js** - Multer file upload config
- [ ] **validation.js** - Joi schemas for validation
- [ ] **security.js** - Helmet, XSS protection
- [ ] **cors.js** - CORS configuration
- [ ] **errorHandler.js** - Global error handling
- [ ] **activityLogger.js** - Admin activity logging

### Utilities (Copy to Monorepo)

- [ ] **contentFilter.js** - Bad words, spam detection
- [ ] **rateLimiter.js** - Rate limiting logic
- [ ] **duplicateDetector.js** - Duplicate ad detection
- [ ] **locationUtils.js** - Distance calculations
- [ ] **slugUtils.js** - Slug generation
- [ ] **imageOptimizer.js** - Image processing (Sharp)
- [ ] **cache.js** - In-memory caching
- [ ] **logger.js** - Winston logging

---

## 🟢 LOWER PRIORITY - Frontend Components

### Pages (18 routes - Reference for Next.js)

All these need Next.js equivalents:

- [ ] Home page (/) - With search & categories
- [ ] Search Results (/search) - With filters
- [ ] All Ads (/all-ads)
- [ ] Ad Detail (/ad/:slug) - SEO-friendly
- [ ] Browse (/ads/*) - Hierarchical URLs
- [ ] Post Ad (/post-ad) - Multi-step form
- [ ] Dashboard (/dashboard) - User's ads
- [ ] Edit Ad (/edit-ad/:id)
- [ ] Profile (/profile) - With avatar/cover
- [ ] Shop Profile (/shop/:shopSlug)
- [ ] Seller Profile (/seller/:sellerSlug)
- [ ] Admin Panel (/admin/dashboard)
- [ ] Editor Dashboard (/editor/dashboard)
- [ ] Promotion pages (/promote/:adId, /payment/:adId)

### Key Components to Port

**Essential:**
- [ ] ImageUpload - Drag-drop with preview
- [ ] LocationSelector - Hierarchical location picker
- [ ] CategorySelector - Dynamic category selection
- [ ] AuthModal - Login/register modal
- [ ] AdCard - Reusable ad display
- [ ] ImageGallery - Photo viewer with zoom

**Form Templates (7 specialized forms):**
- [ ] ElectronicsForm, VehiclesForm, PropertyForm
- [ ] FashionForm, HomeLivingForm, PetsForm, ServicesForm
- [ ] formTemplates.js (1,288 lines) - Field definitions

**Admin Components:**
- [ ] AdminPanel, AdminStats, AdminFilters
- [ ] EditorDashboard, EditorStats
- [ ] Verification request management

### Frontend Configuration

- [ ] **formTemplates.js** (1,288 lines) - CRITICAL for dynamic forms
- [ ] **theme.js** (605 lines) - Design system
- [ ] **env.js** - Environment config
- [ ] **API modules** (10 files) - API client architecture

---

## ⚙️ Configuration & Documentation

### Must Preserve

- [ ] **package.json** - All dependencies list
- [ ] **Backend migrations/** - Schema documentation
- [ ] **Backend .env.example** - Environment template
- [ ] **Frontend .env.example** - Frontend config template

### Documentation to Keep

**Backend Docs:**
- [ ] ARCHITECTURE_STATUS.md
- [ ] MVC_ARCHITECTURE_COMPLETE.md
- [ ] VERIFICATION_DEBUG_SUMMARY.md

**Frontend Docs:**
- [ ] API_REFACTORING_SUMMARY.md
- [ ] PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] SECURITY_ISSUES.md
- [ ] TEST_SUITE_SUMMARY.md
- [ ] All 14 documentation files

---

## 🚫 CAN SAFELY DELETE (After Migration)

### Backend

- [ ] server.js (after migrating to monorepo API)
- [ ] /routes/ folder (after endpoints recreated)
- [ ] /controllers/ (after logic migrated)
- [ ] node_modules/ (can reinstall)
- [ ] /logs/ (if not needed)

### Frontend

- [ ] All /src code (after Next.js equivalents created)
- [ ] node_modules/ (can reinstall)
- [ ] /dist/ (build output)
- [ ] /coverage/ (test coverage reports)

---

## 📋 Migration Steps (Recommended Order)

### Phase 1: Setup (Week 1)
1. [ ] Copy environment variables to monorepo
2. [ ] Move uploaded files to cloud storage (AWS S3 recommended)
3. [ ] Update database file_path columns
4. [ ] Copy migration files to monorepo/docs/
5. [ ] Set up Typesense in monorepo

### Phase 2: Backend API (Week 2-3)
6. [ ] Create monorepo backend structure (apps/api/)
7. [ ] Migrate middleware & utilities
8. [ ] Implement authentication endpoints
9. [ ] Implement ad endpoints with image upload
10. [ ] Implement search endpoints (Typesense)
11. [ ] Implement user profile endpoints
12. [ ] Test all endpoints with Postman/curl

### Phase 3: Advanced Features (Week 4)
13. [ ] Implement verification system
14. [ ] Implement promotion system
15. [ ] Implement admin panel endpoints
16. [ ] Set up cron jobs (promotion expiry)
17. [ ] Replace mock payment with real eSewa/Khalti

### Phase 4: Frontend (Week 5-6)
18. [ ] Create Next.js pages for all routes
19. [ ] Port essential components (ImageUpload, etc.)
20. [ ] Port form templates
21. [ ] Implement authentication flow
22. [ ] Implement ad posting flow
23. [ ] Test end-to-end user journeys

### Phase 5: Testing & Deployment (Week 7)
24. [ ] Test all features
25. [ ] Run production build
26. [ ] Deploy to staging
27. [ ] User acceptance testing
28. [ ] Deploy to production
29. [ ] **ONLY THEN**: Delete old backend/frontend

---

## ⚠️ Critical Warnings

### DO NOT DELETE UNTIL:

1. ✅ All uploaded files moved/backed up
2. ✅ Database migrations documented
3. ✅ All API endpoints working in monorepo
4. ✅ Frontend working in monorepo
5. ✅ Tested end-to-end in production
6. ✅ Users can post ads, upload images, search, etc.
7. ✅ Payment gateway working (not mock)
8. ✅ Admin panel working
9. ✅ Backup entire backend/frontend folder first

### Backup Strategy

```bash
# Create backup before deletion
cd /Users/elw/Documents/Web/thulobazaar
tar -czf thulobazaar_backup_$(date +%Y%m%d).tar.gz backend/ frontend/

# Move to safe location
mv thulobazaar_backup_*.tar.gz ~/Backups/
```

---

## 📊 Migration Complexity Estimate

| Component | Complexity | Time Estimate |
|-----------|-----------|---------------|
| Uploaded Files Migration | Low | 1-2 hours |
| Database Documentation | Low | 1 hour |
| Environment Setup | Low | 1 hour |
| Backend API Endpoints | **High** | 20-30 hours |
| Middleware & Services | Medium | 10-15 hours |
| Typesense Integration | Medium | 5-8 hours |
| Frontend Pages | **High** | 30-40 hours |
| Form Templates | Medium | 8-12 hours |
| Admin Panel | Medium | 10-15 hours |
| Testing | Medium | 10-15 hours |
| **TOTAL** | | **100-150 hours** |

**Estimated Timeline**: 6-8 weeks (full-time) or 3-4 months (part-time)

---

## 🎯 Quick Win Strategy

**If you want to delete old folders SOONER:**

### Minimal Migration (2-3 weeks):
1. Move uploaded files to S3/Cloudinary
2. Implement core API endpoints (auth, ads, search)
3. Create basic Next.js pages (home, search, ad detail, post ad)
4. Test with real users
5. Delete old folders

**Keep for later:**
- Admin panel
- Verification system
- Promotion system
- Advanced features

---

## 📁 What's Already in Monorepo

Good news! Some things are already done:

✅ **Types System** - Complete with transformers
✅ **Utilities** - 30+ utility functions
✅ **API Client** - Structure ready (needs backend)
✅ **Next.js App** - Basic structure
✅ **Documentation** - 10 comprehensive guides
✅ **2025 Best Practices** - Type guards, error handling

**What's Missing:**
❌ Backend API implementation (all endpoints)
❌ Frontend pages/components
❌ File upload handling
❌ Admin panel
❌ Search integration
❌ Payment integration

---

## 🚀 Recommendation

**Best Approach:**

1. **DON'T DELETE YET** - Keep both running in parallel
2. **Backend Port (3-4 weeks)**:
   - Move uploads to cloud
   - Implement all API endpoints in monorepo
   - Test thoroughly

3. **Frontend Port (3-4 weeks)**:
   - Create Next.js pages
   - Port components
   - Test thoroughly

4. **Production Switch**:
   - Deploy monorepo
   - Test with real users for 1-2 weeks
   - Monitor for issues

5. **THEN Delete**:
   - Archive old folders (tar.gz)
   - Keep backups for 6 months
   - Delete after confidence

**Timeline**: 2-3 months for safe, thorough migration

---

## 📞 Need Help?

**Critical Tasks:**
- Uploaded files migration → AWS S3 setup
- API endpoints → Express/Next.js API routes
- Typesense integration → Search setup
- Payment gateway → eSewa/Khalti integration

**Reference:**
- Backend has excellent code structure to copy
- Frontend has production-ready components
- All migration info in this checklist

---

**Last Updated**: 2025-10-28
**Status**: Migration NOT started
**Priority**: HIGH - But don't rush, do it right!
