# ThuluBazaar - AWS Production Deployment Guide

## Stack Overview

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 |
| Backend | Express.js |
| Database | PostgreSQL + Prisma |
| Language | TypeScript |
| Structure | Monorepo (Turborepo) |

---

## Recommended AWS Architecture

```
┌─────────────────────────────────────────────────┐
│                 Cloudflare                       │
│    (DNS + SSL + DDoS Protection + Firewall)      │
│              FREE PLAN AVAILABLE                 │
└─────────────────────┬───────────────────────────┘
                      │
                      │ (Proxied traffic)
                      │
┌─────────────────────▼───────────────────────────┐
│              EC2 Instance + PM2                  │
│  ┌─────────────────┐   ┌─────────────────┐      │
│  │   Next.js App   │   │   Express API   │      │
│  │   Port 3333     │   │   Port 5000     │      │
│  │  (Auto-restart) │   │  (Auto-restart) │      │
│  └─────────────────┘   └─────────────────┘      │
│                   Nginx                          │
│            (Reverse Proxy)                       │
└─────────────────────┬───────────────────────────┘
                      │
              ┌───────▼───────┐
              │   RDS         │
              │  PostgreSQL   │
              │ (Managed DB)  │
              └───────────────┘
```

---

## Why Cloudflare (Not CloudFront)?

| Feature | Cloudflare | CloudFront |
|---------|------------|------------|
| **DDoS Protection** | ✅ Included FREE | ❌ Extra cost (AWS Shield) |
| **Web Application Firewall** | ✅ FREE tier | ❌ Extra cost (AWS WAF) |
| **Free SSL** | ✅ Yes | ✅ Yes |
| **Bot Protection** | ✅ Included | ❌ Extra cost |
| **Rate Limiting** | ✅ FREE (basic) | ❌ Not included |
| **Nepal-only restriction** | ✅ Easy (Firewall Rules) | ⚠️ Complex |
| **Cost** | **FREE** | ~$1-10/month |

**For Nepal-only site:** Cloudflare lets you easily block traffic from other countries if needed.

---

## Services Needed

| Service | Purpose | Estimated Cost |
|---------|---------|----------------|
| EC2 (t3.small) | Run Next.js + Express | ~$15/month |
| RDS PostgreSQL (db.t3.micro) | Database | ~$13/month |
| Cloudflare | DNS + SSL + Security | **FREE** |
| S3 | Image/file storage | ~$1-5/month |
| **Total** | | **~$29-33/month** |

---

## Step-by-Step Deployment

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose:
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: t3.small (2 vCPU, 2GB RAM)
   - **Storage**: 20GB SSD
   - **Security Group**:
     - SSH (22) - Your IP only
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - Custom TCP (3333) - Anywhere (Next.js)
     - Custom TCP (5000) - Anywhere (Express API)

3. Create/download key pair (.pem file)

### Step 2: Create RDS PostgreSQL

1. Go to AWS Console → RDS → Create Database
2. Choose:
   - **Engine**: PostgreSQL 15+
   - **Template**: Free tier (or Production)
   - **Instance**: db.t3.micro
   - **Storage**: 20GB
   - **DB name**: thulobazaar
   - **Master username**: thulobazaar_admin
   - **Password**: (save securely!)
   - **Public access**: Yes (for initial setup, disable later)

3. Note the endpoint: `your-db.xxxxxxx.us-east-1.rds.amazonaws.com`

### Step 3: Connect to EC2 & Setup Environment

```bash
# Connect to EC2
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 globally
sudo npm install -g pm2

# Verify installations
node --version   # v20.x.x
npm --version    # 10.x.x
pm2 --version    # 5.x.x
```

### Step 4: Clone & Build Project

```bash
# Clone repository
cd /home/ec2-user
git clone https://github.com/YOUR_USERNAME/thulobazaar.git
cd thulobazaar/monorepo

# Install dependencies
npm install

# Create environment file
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://thulobazaar_admin:YOUR_PASSWORD@your-db.xxxxxxx.us-east-1.rds.amazonaws.com:5432/thulobazaar"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# JWT
JWT_SECRET="another-secure-random-string"

# API URL (internal)
NEXT_PUBLIC_API_URL="http://localhost:5000"

# Node Environment
NODE_ENV="production"
EOF

# Run Prisma migrations
npx prisma migrate deploy

# Build the project
npm run build
```

### Step 5: Create PM2 Ecosystem Config

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'thulobazaar-api',
      script: 'npm',
      args: 'run start:api',
      cwd: '/home/ec2-user/thulobazaar/monorepo',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/home/ec2-user/logs/api-error.log',
      out_file: '/home/ec2-user/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'thulobazaar-web',
      script: 'npm',
      args: 'run start:web',
      cwd: '/home/ec2-user/thulobazaar/monorepo',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3333
      },
      error_file: '/home/ec2-user/logs/web-error.log',
      out_file: '/home/ec2-user/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Create logs directory
mkdir -p /home/ec2-user/logs
```

### Step 6: Start Applications with PM2

```bash
# Start all apps
pm2 start ecosystem.config.js

# Check status
pm2 status

# Expected output:
# ┌─────────────────────┬────┬─────────┬──────┬───────┐
# │ App name            │ id │ status  │ cpu  │ memory│
# ├─────────────────────┼────┼─────────┼──────┼───────┤
# │ thulobazaar-api     │ 0  │ online  │ 0%   │ 80mb  │
# │ thulobazaar-web     │ 1  │ online  │ 0%   │ 150mb │
# └─────────────────────┴────┴─────────┴──────┴───────┘

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Run the command it outputs (looks like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### Step 7: Setup Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo yum install -y nginx

# Create Nginx config
sudo cat > /etc/nginx/conf.d/thulobazaar.conf << 'EOF'
# Next.js Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Express API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 8: Setup Cloudflare (Security + SSL)

#### Why Cloudflare for ThuluBazaar?
- **FREE** DDoS protection
- **FREE** SSL certificate
- **FREE** Web Application Firewall (WAF)
- **FREE** Bot protection
- Easy Nepal-only traffic restriction

#### Cloudflare Setup Steps:

1. **Create Cloudflare Account**
   - Go to https://cloudflare.com
   - Sign up (free)

2. **Add Your Domain**
   - Click "Add a Site"
   - Enter: `thulobazaar.com`
   - Select **FREE** plan

3. **Update Nameservers**
   - Cloudflare will give you 2 nameservers like:
     - `anna.ns.cloudflare.com`
     - `bob.ns.cloudflare.com`
   - Go to your domain registrar and update nameservers

4. **Configure DNS Records**
   ```
   Type    Name              Content              Proxy
   A       thulobazaar.com   YOUR_EC2_PUBLIC_IP   ✅ Proxied
   A       www               YOUR_EC2_PUBLIC_IP   ✅ Proxied
   A       api               YOUR_EC2_PUBLIC_IP   ✅ Proxied
   ```

5. **Enable SSL (Full Strict)**
   - Go to SSL/TLS → Overview
   - Select: **Full (strict)**
   - This encrypts traffic between users and Cloudflare AND Cloudflare and your server

6. **Security Settings (Recommended)**

   **a) Enable "Under Attack" mode (when needed):**
   - Overview → Quick Actions → Under Attack Mode

   **b) Set Security Level:**
   - Security → Settings → Security Level: **Medium**

   **c) Enable Bot Fight Mode:**
   - Security → Bots → Bot Fight Mode: **ON**

   **d) Block Countries (Optional - Nepal only):**
   - Security → WAF → Custom Rules → Create Rule:
   ```
   Name: Block non-Nepal traffic
   Expression: (ip.geoip.country ne "NP")
   Action: Block
   ```

   **e) Rate Limiting (Protect against abuse):**
   - Security → WAF → Rate limiting rules:
   ```
   Name: API Rate Limit
   URL: api.thulobazaar.com/*
   Requests: 100 per 1 minute
   Action: Block for 1 hour
   ```

7. **Page Rules (Optional)**
   - Rules → Page Rules:
   ```
   URL: *thulobazaar.com/*
   Settings:
   - Always Use HTTPS: ON
   - Browser Cache TTL: 4 hours
   ```

#### With Cloudflare, you DON'T need Let's Encrypt:
Cloudflare provides **FREE SSL** automatically. Your Nginx config just needs:

```nginx
# Cloudflare provides SSL, so Nginx only needs HTTP
server {
    listen 80;
    server_name thulobazaar.com www.thulobazaar.com;

    # Cloudflare real IP headers
    set_real_ip_from 103.21.244.0/22;
    set_real_ip_from 103.22.200.0/22;
    set_real_ip_from 103.31.4.0/22;
    set_real_ip_from 104.16.0.0/13;
    set_real_ip_from 104.24.0.0/14;
    set_real_ip_from 108.162.192.0/18;
    set_real_ip_from 131.0.72.0/22;
    set_real_ip_from 141.101.64.0/18;
    set_real_ip_from 162.158.0.0/15;
    set_real_ip_from 172.64.0.0/13;
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 188.114.96.0/20;
    set_real_ip_from 190.93.240.0/20;
    set_real_ip_from 197.234.240.0/22;
    set_real_ip_from 198.41.128.0/17;
    real_ip_header CF-Connecting-IP;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Cloudflare Security Features Summary:

| Feature | Status | What it does |
|---------|--------|--------------|
| DDoS Protection | ✅ Always ON | Blocks attack traffic |
| SSL/TLS | ✅ Full (strict) | Encrypts all traffic |
| WAF | ✅ Enabled | Blocks common attacks |
| Bot Protection | ✅ Enabled | Blocks bad bots |
| Rate Limiting | ✅ Configured | Prevents API abuse |
| Country Blocking | ⚙️ Optional | Nepal-only access |

---

## PM2 Commands Reference

| Command | Description |
|---------|-------------|
| `pm2 status` | Check all app status |
| `pm2 logs` | View all logs |
| `pm2 logs thulobazaar-api` | View specific app logs |
| `pm2 restart all` | Restart all apps |
| `pm2 restart thulobazaar-api` | Restart specific app |
| `pm2 stop all` | Stop all apps |
| `pm2 delete all` | Remove all apps from PM2 |
| `pm2 monit` | Real-time monitoring dashboard |
| `pm2 save` | Save current process list |
| `pm2 resurrect` | Restore saved processes |

---

## Auto-Restart Features (PM2)

PM2 automatically restarts your apps when:

| Scenario | PM2 Behavior |
|----------|--------------|
| App crashes (unhandled error) | Restarts immediately |
| Memory exceeds limit | Restarts (max_memory_restart) |
| Server reboots | Restarts (pm2 startup) |
| Manual restart | `pm2 restart app-name` |
| File changes | Restarts if `watch: true` |

---

## Monitoring & Alerts

### Option 1: PM2 Plus (Paid)
```bash
pm2 plus  # Follow instructions
```

### Option 2: UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Add monitors:
   - `https://yourdomain.com` (Frontend)
   - `https://api.yourdomain.com/api/health` (API)
3. Set alert contacts (email, SMS)

### Option 3: AWS CloudWatch
```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure to monitor:
# - CPU usage
# - Memory usage
# - Disk space
# - Custom metrics from PM2
```

---

## Deployment Updates

### Manual Deployment
```bash
cd /home/ec2-user/thulobazaar/monorepo

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart apps
pm2 restart all
```

### Automated Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/thulobazaar/monorepo
            git pull origin main
            npm install
            npx prisma migrate deploy
            npm run build
            pm2 restart all
```

---

## Troubleshooting

### App not starting
```bash
pm2 logs thulobazaar-api --lines 100
pm2 logs thulobazaar-web --lines 100
```

### Database connection issues
```bash
# Test connection
psql -h your-db.xxxxxxx.rds.amazonaws.com -U thulobazaar_admin -d thulobazaar

# Check security group allows EC2 IP
```

### Memory issues
```bash
# Check memory usage
free -m
pm2 monit

# Increase instance size if needed
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :3333
sudo lsof -i :5000

# Kill if needed
sudo kill -9 <PID>
```

---

## Security Checklist

- [ ] **Cloudflare**: Proxied (orange cloud) enabled for all DNS records
- [ ] **Cloudflare**: SSL mode set to "Full (strict)"
- [ ] **Cloudflare**: Bot Fight Mode enabled
- [ ] **Cloudflare**: WAF rules enabled
- [ ] **Cloudflare**: Rate limiting configured for API
- [ ] **EC2 Security Group**: Only ports 80, 443, 22 (your IP only)
- [ ] **RDS**: Not publicly accessible (only EC2 can connect)
- [ ] **SSH**: Key-based authentication only (no password)
- [ ] **Environment variables**: Not in git, stored in .env on server
- [ ] **Database**: Strong password, automated backups enabled
- [ ] **PM2**: Running as non-root user (ec2-user)
- [ ] **Nginx**: Only accepts Cloudflare IPs (optional extra security)

---

## Cost Optimization Tips

1. **Use Reserved Instances** - Save 30-50% on EC2/RDS
2. **Right-size instances** - Start small, scale as needed
3. **Use Spot Instances** - For non-critical workloads
4. **Enable S3 lifecycle policies** - Archive old files
5. **CloudFront caching** - Reduce origin requests

---

## Scaling (When Needed)

When traffic grows:

1. **Vertical Scaling**: Upgrade EC2 instance (t3.small → t3.medium)
2. **Horizontal Scaling**: Add more EC2 instances behind ALB
3. **Database Scaling**: Upgrade RDS or add read replicas
4. **Caching**: Add ElastiCache (Redis) for sessions/queries
5. **CDN**: Optimize CloudFront for static assets

---

## Support

- AWS Documentation: https://docs.aws.amazon.com
- PM2 Documentation: https://pm2.keymetrics.io/docs
- Prisma Documentation: https://www.prisma.io/docs

---

*Last updated: December 2025*
