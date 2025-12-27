# ThuluBazaar AWS Infrastructure Guide

> AWS setup for 100k users, 50k daily visits, serving Nepal market

---

## Table of Contents

1. [Traffic Analysis](#traffic-analysis)
2. [AWS Region Selection](#aws-region-selection)
3. [Recommended Architecture](#recommended-architecture)
4. [Service Specifications](#service-specifications)
5. [Cost Estimation](#cost-estimation)
6. [Scaling Strategy](#scaling-strategy)
7. [Setup Instructions](#setup-instructions)

---

## Traffic Analysis

### Expected Load

| Metric | Value |
|--------|-------|
| Total Users | 100,000 |
| Daily Unique Visitors | 50,000 |
| Average Users/Hour | ~2,000 |
| Peak Users/Hour | ~6,000 |
| Peak Concurrent Users | ~500-1,000 |
| API Requests/Day | ~1-2 million |
| Database Queries/Day | ~5-10 million |
| Image Uploads/Day | ~1,000-5,000 |
| Total Storage Needed | ~50-100 GB (images) |

### Traffic Pattern (Nepal)

```
Peak Hours:    10:00 AM - 10:00 PM NPT (Nepal Time)
Low Traffic:   12:00 AM - 6:00 AM NPT
Busiest Days:  Saturday (Nepal weekend), Fridays
```

---

## AWS Region Selection

### Recommended: Mumbai (ap-south-1)

| Region | Latency to Nepal | Cost | Recommendation |
|--------|------------------|------|----------------|
| **Mumbai (ap-south-1)** | ~30-50ms | Low | **Best Choice** |
| Singapore (ap-southeast-1) | ~80-100ms | Medium | Second option |
| N. Virginia (us-east-1) | ~250-300ms | Lowest | Not recommended |

**Why Mumbai?**
- Closest AWS region to Nepal (~1,500 km)
- Lowest latency for Nepali users
- Good pricing
- All required services available

---

## Recommended Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │           AWS Cloud                  │
                                    │         (ap-south-1 Mumbai)          │
┌──────────────┐                    │                                     │
│   Nepali     │                    │  ┌─────────────┐                    │
│   Users      │                    │  │  CloudFront │ (CDN - Edge Nepal) │
│  (Browser)   │───────────────────────│    (CDN)    │                    │
└──────────────┘                    │  └──────┬──────┘                    │
                                    │         │                           │
┌──────────────┐                    │         ▼                           │
│   Android    │                    │  ┌─────────────┐                    │
│     App      │───────────────────────│     ALB     │ (Load Balancer)    │
└──────────────┘                    │  └──────┬──────┘                    │
                                    │         │                           │
┌──────────────┐                    │    ┌────┴────┐                      │
│    iOS       │                    │    ▼         ▼                      │
│    App       │────────────────────│ ┌─────┐  ┌─────┐                    │
└──────────────┘                    │ │ ECS │  │ ECS │  (Auto-scaling)    │
                                    │ │Task1│  │Task2│                    │
                                    │ └──┬──┘  └──┬──┘                    │
                                    │    │        │                       │
                                    │    └───┬────┘                       │
                                    │        ▼                            │
                                    │  ┌───────────┐                      │
                                    │  │    RDS    │ (PostgreSQL)         │
                                    │  │  Primary  │                      │
                                    │  └─────┬─────┘                      │
                                    │        │                            │
                                    │        ▼                            │
                                    │  ┌───────────┐                      │
                                    │  │    RDS    │ (Read Replica)       │
                                    │  │  Replica  │ (Optional - Scale)   │
                                    │  └───────────┘                      │
                                    │                                     │
                                    │  ┌───────────┐                      │
                                    │  │    S3     │ (Images/Files)       │
                                    │  └───────────┘                      │
                                    │                                     │
                                    │  ┌───────────┐                      │
                                    │  │ElastiCache│ (Redis - Optional)   │
                                    │  └───────────┘                      │
                                    │                                     │
                                    └─────────────────────────────────────┘
```

---

## Service Specifications

### Phase 1: Launch (0-50k daily users)

| Service | Specification | Purpose |
|---------|---------------|---------|
| **ECS Fargate** | 2 tasks × (0.5 vCPU, 1GB RAM) | Next.js Web App |
| **ECS Fargate** | 2 tasks × (0.5 vCPU, 1GB RAM) | Express API |
| **RDS PostgreSQL** | db.t3.small (2 vCPU, 2GB RAM) | Database |
| **S3** | Standard, 100GB | Image storage |
| **CloudFront** | Standard distribution | CDN for static assets |
| **ALB** | Application Load Balancer | Traffic distribution |
| **Route 53** | Hosted zone | DNS management |
| **ACM** | SSL Certificate | HTTPS (Free) |

### Phase 2: Growth (50k-100k daily users)

| Service | Upgrade To | When |
|---------|------------|------|
| **ECS Fargate** | 4 tasks × (1 vCPU, 2GB RAM) | CPU > 70% sustained |
| **RDS PostgreSQL** | db.t3.medium (2 vCPU, 4GB RAM) | DB CPU > 70% |
| **ElastiCache Redis** | cache.t3.micro | Add caching for speed |
| **RDS Read Replica** | db.t3.small | High read traffic |

### Phase 3: Scale (100k+ daily users)

| Service | Upgrade To | When |
|---------|------------|------|
| **ECS Fargate** | 6-10 tasks (auto-scaling) | Traffic spikes |
| **RDS PostgreSQL** | db.t3.large (2 vCPU, 8GB RAM) | DB queries slow |
| **ElastiCache Redis** | cache.t3.small | Session management |
| **Multiple Read Replicas** | 2-3 replicas | High read traffic |

---

## Cost Estimation (Monthly - USD)

### Phase 1: Launch (~$150-200/month)

| Service | Specification | Cost/Month |
|---------|---------------|------------|
| ECS Fargate (Web) | 2 × (0.5 vCPU, 1GB) | ~$30 |
| ECS Fargate (API) | 2 × (0.5 vCPU, 1GB) | ~$30 |
| RDS PostgreSQL | db.t3.small | ~$30 |
| ALB | Load Balancer | ~$20 |
| S3 | 100GB + transfers | ~$10 |
| CloudFront | CDN | ~$10-20 |
| Route 53 | DNS | ~$1 |
| **Total** | | **~$130-150** |

### Phase 2: Growth (~$300-400/month)

| Service | Specification | Cost/Month |
|---------|---------------|------------|
| ECS Fargate (Web) | 4 × (1 vCPU, 2GB) | ~$100 |
| ECS Fargate (API) | 4 × (1 vCPU, 2GB) | ~$100 |
| RDS PostgreSQL | db.t3.medium | ~$60 |
| ElastiCache | cache.t3.micro | ~$15 |
| ALB | Load Balancer | ~$25 |
| S3 | 200GB + transfers | ~$20 |
| CloudFront | CDN | ~$30 |
| **Total** | | **~$350-400** |

### Phase 3: Scale (~$600-1000/month)

| Service | Specification | Cost/Month |
|---------|---------------|------------|
| ECS Fargate | Auto-scaling (6-10 tasks) | ~$300-400 |
| RDS PostgreSQL | db.t3.large + replica | ~$150 |
| ElastiCache | cache.t3.small | ~$30 |
| ALB | Load Balancer | ~$30 |
| S3 | 500GB + transfers | ~$40 |
| CloudFront | CDN (high traffic) | ~$50-100 |
| **Total** | | **~$600-800** |

### Cost in NPR (Approximate)

| Phase | USD | NPR (@ 133 rate) |
|-------|-----|------------------|
| Launch | $150 | ~₹20,000 |
| Growth | $350 | ~₹46,000 |
| Scale | $700 | ~₹93,000 |

---

## Scaling Strategy

### Auto-Scaling Rules

```yaml
# ECS Auto-Scaling Policy
Web App:
  Min Tasks: 2
  Max Tasks: 10
  Scale Up:   CPU > 70% for 2 minutes
  Scale Down: CPU < 30% for 5 minutes

API:
  Min Tasks: 2
  Max Tasks: 10
  Scale Up:   CPU > 70% for 2 minutes
  Scale Down: CPU < 30% for 5 minutes

Database:
  Alert: CPU > 80% for 5 minutes → Consider upgrade
  Alert: Storage > 80% → Increase storage
  Alert: Connections > 80% → Add read replica
```

### When to Upgrade

| Metric | Threshold | Action |
|--------|-----------|--------|
| ECS CPU | > 70% sustained | Add more tasks |
| ECS Memory | > 80% | Increase task memory |
| RDS CPU | > 70% sustained | Upgrade instance |
| RDS Connections | > 80% max | Add read replica |
| RDS Storage | > 80% | Enable auto-scaling |
| Response Time | > 500ms | Add caching (Redis) |

---

## Setup Instructions

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com
2. Create account (credit card required)
3. Enable MFA for root account
4. Create IAM user for daily use

### Step 2: Set Region

```bash
# AWS CLI
aws configure set region ap-south-1
```

### Step 3: Create VPC & Networking

```bash
# Using AWS CLI or Console
# Create VPC with:
# - 2 public subnets (for ALB)
# - 2 private subnets (for ECS, RDS)
# - NAT Gateway (for private subnet internet access)
```

### Step 4: Create RDS PostgreSQL

```bash
# AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier thulobazaar-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name thulobazaar-db-subnet \
  --backup-retention-period 7 \
  --multi-az false \
  --publicly-accessible false
```

### Step 5: Create S3 Bucket

```bash
aws s3 mb s3://thulobazaar-images --region ap-south-1

# Enable public access for images (or use CloudFront)
aws s3api put-bucket-policy --bucket thulobazaar-images --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::thulobazaar-images/*"
  }]
}'
```

### Step 6: Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name thulobazaar --capacity-providers FARGATE
```

### Step 7: Create ECR Repository (Docker Images)

```bash
aws ecr create-repository --repository-name thulobazaar-web
aws ecr create-repository --repository-name thulobazaar-api
```

### Step 8: Deploy Application

```bash
# Build and push Docker images
docker build -t thulobazaar-web ./apps/web
docker tag thulobazaar-web:latest YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/thulobazaar-web:latest
docker push YOUR_ACCOUNT.dkr.ecr.ap-south-1.amazonaws.com/thulobazaar-web:latest

# Create ECS Task Definition and Service
# (Use AWS Console for easier setup)
```

### Step 9: Setup CloudFront

1. Create CloudFront distribution
2. Origin: ALB or S3
3. Enable caching for static assets
4. SSL certificate from ACM

### Step 10: Configure DNS (Route 53)

1. Create hosted zone for your domain
2. Update nameservers at your registrar
3. Create A record pointing to CloudFront

---

## Mobile App Backend Considerations

### API Endpoints for Mobile Apps

Both Android and iOS apps will use the same Express API:

```
https://api.thulobazaar.com/api/
├── /auth          # Login, Register, OAuth
├── /ads           # CRUD for ads
├── /users         # User profiles
├── /shops         # Shop management
├── /categories    # Categories list
├── /search        # Search functionality
└── /notifications # Push notifications
```

### Push Notifications

| Service | Purpose | Cost |
|---------|---------|------|
| **AWS SNS** | Push to both iOS & Android | ~$1 per million |
| **Firebase FCM** | Alternative (free tier) | Free up to limit |

### Mobile-Specific Optimizations

1. **API Response Caching**: Cache category lists, locations
2. **Image Optimization**: Serve different sizes for mobile
3. **Pagination**: Limit items per request (20-50)
4. **Offline Support**: Cache essential data locally

---

## Security Configuration

### Security Groups

```
ALB Security Group:
  Inbound:  443 (HTTPS) from 0.0.0.0/0
  Outbound: All to ECS Security Group

ECS Security Group:
  Inbound:  3333, 5000 from ALB Security Group
  Outbound: All (for external APIs, S3)

RDS Security Group:
  Inbound:  5432 from ECS Security Group only
  Outbound: None needed
```

### Environment Variables (Secrets Manager)

Store sensitive data in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name thulobazaar/production \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "NEXTAUTH_SECRET": "...",
    "JWT_SECRET": "..."
  }'
```

---

## Monitoring & Alerts

### CloudWatch Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| High CPU (ECS) | CPUUtilization | > 80% | Email + Scale |
| High CPU (RDS) | CPUUtilization | > 80% | Email |
| High Memory | MemoryUtilization | > 85% | Email |
| 5xx Errors | HTTPCode_Target_5XX | > 10/min | Email |
| Slow Response | TargetResponseTime | > 2s | Email |

### Recommended Monitoring Tools

| Tool | Purpose | Cost |
|------|---------|------|
| CloudWatch | AWS native monitoring | Included |
| Sentry | Error tracking | Free tier |
| UptimeRobot | Uptime monitoring | Free |

---

## Backup Strategy

### Database Backups

```
Automated Backups:
  Retention: 7 days
  Window: 3:00-4:00 AM NPT (off-peak)

Manual Snapshots:
  Before major updates
  Monthly archive snapshot
```

### S3 Versioning

```bash
# Enable versioning for image bucket
aws s3api put-bucket-versioning \
  --bucket thulobazaar-images \
  --versioning-configuration Status=Enabled
```

---

## Checklist Before Launch

- [ ] RDS PostgreSQL created and configured
- [ ] S3 bucket created with proper permissions
- [ ] ECS cluster and services running
- [ ] ALB configured with health checks
- [ ] CloudFront distribution active
- [ ] SSL certificate issued and attached
- [ ] DNS configured in Route 53
- [ ] Environment variables set in ECS
- [ ] CloudWatch alarms configured
- [ ] Backup retention enabled
- [ ] Security groups properly configured
- [ ] Test all endpoints from Nepal (use VPN or friend)

---

## Quick Reference Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster thulobazaar --services web api

# View RDS status
aws rds describe-db-instances --db-instance-identifier thulobazaar-db

# Check CloudWatch logs
aws logs tail /ecs/thulobazaar-web --follow

# Scale ECS service manually
aws ecs update-service --cluster thulobazaar --service web --desired-count 4

# Force new deployment
aws ecs update-service --cluster thulobazaar --service web --force-new-deployment
```

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com
- **AWS Support**: Basic (free) or Developer ($29/month)
- **Cost Explorer**: Monitor spending in AWS Console

---

*Last updated: December 2024*
