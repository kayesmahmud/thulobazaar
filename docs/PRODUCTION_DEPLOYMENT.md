# ThuluBazaar Production Deployment Guide

> Complete guide for testing, deploying, and maintaining ThuluBazaar in production on AWS.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [AWS Infrastructure](#aws-infrastructure)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Health Monitoring](#health-monitoring)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Testing Strategy

### Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  ← Few, slow, high confidence
                    │ (Playwright)│
                   ┌┴─────────────┴┐
                   │  Integration  │  ← Some, medium speed
                   │   (Vitest)    │
                  ┌┴───────────────┴┐
                  │   Unit Tests    │  ← Many, fast, low-level
                  │    (Vitest)     │
                 ┌┴─────────────────┴┐
                 │   Type Checking   │  ← Instant, catches 30-40% of bugs
                 │   (TypeScript)    │
                 └───────────────────┘
```

### Test Types Explained

| Test Type | Tool | Purpose | When to Run |
|-----------|------|---------|-------------|
| **Type Check** | TypeScript | Catch type errors, null issues | Every save, every commit |
| **Unit Tests** | Vitest | Test individual functions | Every commit |
| **Integration Tests** | Vitest + Prisma | Test database operations | Before deploy |
| **E2E Tests** | Playwright | Test user journeys | Before deploy |
| **Security Scan** | npm audit | Find vulnerabilities | Every commit |

### Test Commands

```bash
# Quick verification (run frequently)
npm run type-check              # TypeScript errors

# Unit tests
npm run test:unit               # Run unit tests only
npm run test:run                # Run all Vitest tests
npm run test:coverage           # Tests with coverage report

# E2E tests
npm run test:e2e                # Run Playwright tests
npm run test:e2e:ui             # Playwright with UI (debugging)
npm run test:e2e:headed         # See browser while testing

# Full verification (before deploy)
npm run type-check && npm run test:run && npm run test:e2e
```

### Test Folder Structure

```
apps/web/
├── e2e/                              # Playwright E2E tests
│   ├── home.spec.ts                  # Homepage tests
│   ├── auth.spec.ts                  # Authentication tests
│   └── critical-paths.spec.ts        # Must-pass production tests
├── src/__tests__/
│   ├── unit/                         # Unit tests
│   │   └── helpers.test.ts
│   ├── integration/                  # Database integration tests
│   │   ├── prisma-test-utils.ts
│   │   └── shop-reports.test.ts
│   ├── api/                          # API route tests
│   │   ├── test-utils.ts
│   │   └── shop-reports.test.ts
│   └── setup.ts                      # Test configuration
├── vitest.config.ts                  # Vitest configuration
└── playwright.config.ts              # Playwright configuration
```

---

## Pre-Deployment Checklist

### Must Complete Before Going Live

- [ ] **All tests pass**
  ```bash
  npm run type-check
  npm run test:run
  npm run test:e2e
  ```

- [ ] **Build succeeds**
  ```bash
  npm run build
  ```

- [ ] **Health endpoint works**
  ```bash
  curl http://localhost:3333/api/health
  curl http://localhost:3333/api/health?deep=true
  ```

- [ ] **Environment variables set** (see [Environment Variables](#environment-variables))

- [ ] **Database migrated**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **SSL certificate configured**

- [ ] **Domain DNS configured**

- [ ] **Backup strategy in place**

### Critical User Journeys to Test Manually

1. ✅ User can view homepage
2. ✅ User can register
3. ✅ User can login
4. ✅ User can post an ad
5. ✅ User can view ads
6. ✅ User can view shop pages
7. ✅ User can report a shop
8. ✅ Editor can login
9. ✅ Editor can manage reports
10. ✅ Payment flow works (if applicable)

---

## CI/CD Pipeline

### GitHub Actions Workflow

Located at: `.github/workflows/ci.yml`

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  On Push/PR to main:                                        │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │ Quality │  │  Test   │  │   E2E   │  │  Security   │   │
│  │  Check  │  │  Unit   │  │  Tests  │  │    Scan     │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘   │
│       │            │            │               │          │
│       └────────────┴─────┬──────┴───────────────┘          │
│                          │                                  │
│                          ▼                                  │
│                    ┌──────────┐                             │
│                    │  Build   │                             │
│                    └────┬─────┘                             │
│                         │                                   │
│                         ▼                                   │
│                    ┌──────────┐                             │
│                    │  Deploy  │  (if all pass)              │
│                    └──────────┘                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Jobs

| Job | Purpose | Fails If |
|-----|---------|----------|
| `quality` | Type check & lint | TypeScript errors |
| `test` | Unit tests | Test failures |
| `e2e` | End-to-end tests | User flow broken |
| `security` | npm audit, secret scan | High vulnerabilities |
| `build` | Build application | Build errors |

### Viewing Pipeline Results

1. Go to GitHub repository
2. Click "Actions" tab
3. View workflow runs
4. Check failed jobs for errors

---

## AWS Infrastructure

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────┐     ┌─────────────┐     ┌─────────────────┐  │
│  │  Route   │────▶│  CloudFront │────▶│   Application   │  │
│  │   53     │     │    (CDN)    │     │  Load Balancer  │  │
│  │  (DNS)   │     └─────────────┘     └────────┬────────┘  │
│  └──────────┘                                  │            │
│                                                │            │
│                              ┌─────────────────┼────────┐   │
│                              │                 │        │   │
│                              ▼                 ▼        │   │
│                         ┌────────┐       ┌────────┐    │   │
│                         │  ECS   │       │  ECS   │    │   │
│                         │ Task 1 │       │ Task 2 │    │   │
│                         └───┬────┘       └───┬────┘    │   │
│                             │                │         │   │
│                             └───────┬────────┘         │   │
│                                     │                  │   │
│                                     ▼                  │   │
│                              ┌────────────┐            │   │
│                              │    RDS     │            │   │
│                              │ PostgreSQL │            │   │
│                              └────────────┘            │   │
│                                                        │   │
│                              ┌────────────┐            │   │
│                              │     S3     │            │   │
│                              │  (Images)  │            │   │
│                              └────────────┘            │   │
│                                                        │   │
└────────────────────────────────────────────────────────────┘
```

### AWS Services Required

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| **ECS Fargate** or **App Runner** | Run Next.js application | $20-100/month |
| **RDS PostgreSQL** | Database | $15-50/month |
| **S3** | Image/file storage | $5-20/month |
| **CloudFront** | CDN for static assets | $10-30/month |
| **Route 53** | Domain DNS | $0.50/month |
| **ALB** | Load balancer | $20/month |
| **ACM** | SSL certificate | Free |

### Load Balancer Health Check Configuration

```
Health Check Path:     /api/health
Protocol:              HTTP
Port:                  3333
Healthy threshold:     2
Unhealthy threshold:   3
Timeout:               5 seconds
Interval:              30 seconds
Success codes:         200
```

---

## Environment Variables

### Required for Production

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/thulobazaar"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# API
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# OAuth (if using social login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# AWS S3 (for image uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="ap-south-1"

# Optional: Error tracking
SENTRY_DSN="your-sentry-dsn"
```

### Setting Environment Variables on AWS

**ECS/Fargate:**
1. Go to Task Definition
2. Edit container
3. Add environment variables or use AWS Secrets Manager

**App Runner:**
1. Go to Service configuration
2. Configure service → Environment variables
3. Add key-value pairs

**EC2:**
```bash
# Add to /etc/environment or use .env file
export DATABASE_URL="..."
export NEXTAUTH_SECRET="..."
```

---

## Database Setup

### Initial Setup

```bash
# 1. Connect to production database
PGPASSWORD=yourpassword psql -h your-rds-endpoint -U postgres -d thulobazaar

# 2. Run migrations
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# 3. Verify migration status
DATABASE_URL="postgresql://..." npx prisma migrate status
```

### Backup Strategy

```bash
# Manual backup
pg_dump -h your-rds-endpoint -U postgres thulobazaar > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h your-rds-endpoint -U postgres thulobazaar < backup_20241214.sql
```

### RDS Recommended Settings

| Setting | Value |
|---------|-------|
| Instance Class | db.t3.micro (start), db.t3.small (scale) |
| Storage | 20GB SSD (auto-scaling enabled) |
| Multi-AZ | Yes (for production) |
| Automated Backups | 7 days retention |
| Encryption | Enabled |

---

## Health Monitoring

### Health Check Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/health` | Basic health check | `{ status: "healthy" }` |
| `GET /api/health?deep=true` | Full system check | Includes database status |

### Example Responses

**Basic Health Check:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-14T10:30:00.000Z",
  "version": "1.0.0",
  "checks": {
    "app": { "status": "ok" }
  }
}
```

**Deep Health Check:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-14T10:30:00.000Z",
  "version": "1.0.0",
  "checks": {
    "app": { "status": "ok" },
    "database": { "status": "ok", "latency": 15 },
    "environment": { "status": "ok" }
  }
}
```

### Recommended Monitoring Tools

| Tool | Purpose | Cost |
|------|---------|------|
| **AWS CloudWatch** | Logs, metrics, alarms | Included |
| **Sentry** | Error tracking | Free tier available |
| **UptimeRobot** | Uptime monitoring | Free tier available |
| **DataDog** | Full observability | $15/host/month |

### Setting Up CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "ThuluBazaar-High-CPU" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Security Checklist

### Before Going Live

- [ ] **HTTPS enforced** (redirect HTTP to HTTPS)
- [ ] **Environment variables secured** (not in code)
- [ ] **Database not publicly accessible**
- [ ] **Strong passwords** for all services
- [ ] **Rate limiting** on API endpoints
- [ ] **CORS configured** properly
- [ ] **Security headers** set (CSP, HSTS, etc.)
- [ ] **npm audit** passes with no high/critical issues
- [ ] **Secrets not in git** (check with `git log -p`)

### Security Headers (next.config.js)

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### Regular Security Tasks

| Task | Frequency |
|------|-----------|
| `npm audit` | Every deploy |
| Rotate secrets | Every 90 days |
| Review access logs | Weekly |
| Update dependencies | Monthly |
| Penetration testing | Annually |

---

## Troubleshooting

### Common Issues

#### 1. Health Check Failing

```bash
# Check if app is running
curl -v http://localhost:3333/api/health

# Check logs
docker logs <container-id>
# or
aws logs tail /ecs/thulobazaar --follow
```

#### 2. Database Connection Issues

```bash
# Test connection
psql -h your-rds-endpoint -U postgres -d thulobazaar -c "SELECT 1"

# Check security groups allow connection
# Check DATABASE_URL is correct
```

#### 3. Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### 4. E2E Tests Failing in CI

```bash
# Run locally with same conditions
CI=true npm run test:e2e

# Check Playwright report
npx playwright show-report
```

### Useful Commands

```bash
# Check running processes
lsof -i :3333

# View real-time logs (AWS)
aws logs tail /ecs/thulobazaar --follow

# Force restart ECS service
aws ecs update-service --cluster thulobazaar --service web --force-new-deployment

# Check database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'thulobazaar';
```

---

## Quick Reference

### Deploy Checklist (Copy-Paste)

```bash
# 1. Run tests
npm run type-check
npm run test:run
npm run test:e2e

# 2. Build
npm run build

# 3. Test health endpoint locally
curl http://localhost:3333/api/health?deep=true

# 4. Deploy (your method)
git push origin main  # Triggers CI/CD

# 5. Verify production
curl https://yourdomain.com/api/health?deep=true
```

### Emergency Rollback

```bash
# ECS: Update to previous task definition
aws ecs update-service \
  --cluster thulobazaar \
  --service web \
  --task-definition thulobazaar-web:PREVIOUS_VERSION

# Database: Restore from backup
pg_restore -h your-rds-endpoint -U postgres -d thulobazaar backup.sql
```

---

## Support

- **GitHub Issues:** Report bugs and feature requests
- **Documentation:** `/docs` folder in repository
- **Logs:** AWS CloudWatch or your logging service

---

*Last updated: December 2024*
