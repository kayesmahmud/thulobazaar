# 🚀 ThuLoBazaar Production Deployment Guide

## Overview

Your ThuLoBazaar application is now a **single Next.js 15 application** - no separate Express backend needed!

## ✅ What Changed

### Before Migration
- **2 Servers Required**:
  - Express backend on port 5000
  - Next.js frontend on port 3333
  - Complex CORS setup
  - Separate deployments

### After Migration  
- **1 Server Only**:
  - Next.js on port 3333
  - All API routes built-in
  - No CORS issues
  - Simple deployment

## 📦 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd /Users/elw/Documents/Web/thulobazaar/monorepo
   vercel
   ```

3. **Environment Variables**
   Configure in Vercel dashboard:
   ```
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=your-production-jwt-secret
   NEXTAUTH_SECRET=your-production-nextauth-secret
   NEXTAUTH_URL=https://your-domain.com
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

### Option 2: Railway / Render

1. **Create new project**
2. **Connect GitHub repo**
3. **Set build command**: `npm run build`
4. **Set start command**: `npm start`
5. **Add environment variables** (same as above)

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. **Install dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Clone and setup**
   ```bash
   git clone your-repo
   cd monorepo
   npm install
   npm run build
   ```

3. **Setup PM2**
   ```bash
   pm2 start npm --name "thulobazaar" -- start
   pm2 save
   pm2 startup
   ```

4. **Setup Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3333;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔐 Environment Variables

### Required Variables

Create `.env.local` in `apps/web/`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/thulobazaar

# JWT Secret (MUST match your old backend secret)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production
NEXTAUTH_URL=https://your-domain.com

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### ⚠️ Important Notes

1. **JWT_SECRET must match** your old Express backend secret for existing user tokens to work
2. **Never commit `.env.local`** to git
3. **Use strong secrets** in production (generate with `openssl rand -base64 32`)

## 🗄️ Database Setup

### Option 1: Managed PostgreSQL

Use managed services like:
- **Supabase** (Free tier available)
- **Railway** (Built-in PostgreSQL)
- **Neon** (Serverless PostgreSQL)
- **AWS RDS**

### Option 2: Self-hosted

1. **Install PostgreSQL**
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create database**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE thulobazaar;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE thulobazaar TO your_user;
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

## 📊 Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database connected and migrated
- [ ] Test user registration/login
- [ ] Test ad creation
- [ ] Test payment flow (mock)
- [ ] Test file uploads
- [ ] Test admin panel
- [ ] Setup SSL certificate (Let's Encrypt)
- [ ] Configure domain DNS
- [ ] Setup monitoring (Sentry, etc.)
- [ ] Configure backups

## 🔍 Monitoring & Logs

### Vercel
- Built-in analytics dashboard
- Real-time logs in dashboard

### VPS with PM2
```bash
pm2 logs thulobazaar     # View logs
pm2 status               # Check status
pm2 restart thulobazaar  # Restart app
```

## 🚨 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
```bash
# Test connection
npx prisma db pull
```

### JWT Token Issues
- Ensure `JWT_SECRET` matches old backend
- Check token expiration settings

## 📝 Deployment Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## 🎯 Performance Optimization

1. **Enable caching** in production
2. **Use CDN** for static assets
3. **Enable image optimization** (Next.js built-in)
4. **Setup database connection pooling**
5. **Enable gzip compression**

## 📞 Support

If you encounter issues:
1. Check logs: `pm2 logs` or Vercel dashboard
2. Verify environment variables
3. Test database connection
4. Check Next.js version compatibility

---

**Current Status**: ✅ Ready for Production Deployment

**Architecture**: Single Next.js application (no Express backend needed)

**Generated**: 2025-10-29
