# AWS Lambda Guide for ThuluBazaar

> When and how to use AWS Lambda in your architecture

---

## Table of Contents

1. [Lambda vs ECS Decision Guide](#lambda-vs-ecs-decision-guide)
2. [Recommended Architecture](#recommended-architecture)
3. [Lambda Use Cases](#lambda-use-cases)
4. [Implementation Examples](#implementation-examples)
5. [Cost Comparison](#cost-comparison)
6. [Setup Instructions](#setup-instructions)

---

## Lambda vs ECS Decision Guide

### Quick Decision Matrix

| Workload Type | Use Lambda? | Use ECS? | Why |
|---------------|-------------|----------|-----|
| Main Web App (Next.js) | ❌ No | ✅ Yes | Needs persistent connections, SSR |
| Main API (Express) | ❌ No | ✅ Yes | Steady traffic, WebSockets |
| Image Processing | ✅ Yes | ❌ No | Sporadic, CPU-intensive |
| Email Sending | ✅ Yes | ❌ No | Event-triggered |
| Push Notifications | ✅ Yes | ❌ No | Event-triggered |
| Scheduled Reports | ✅ Yes | ❌ No | Runs periodically |
| PDF Generation | ✅ Yes | ❌ No | On-demand, memory-intensive |
| Search Indexing | ✅ Yes | ❌ No | Background task |
| Database Cleanup | ✅ Yes | ❌ No | Scheduled task |

### Lambda Pros & Cons

**Pros:**
- ✅ Pay only when code runs (per millisecond)
- ✅ Auto-scales to any load (1 to 10,000+ concurrent)
- ✅ Zero server management
- ✅ Perfect for sporadic workloads
- ✅ Built-in retry and error handling

**Cons:**
- ❌ Cold starts (1-3 seconds first request)
- ❌ 15-minute max execution time
- ❌ No persistent connections (WebSockets)
- ❌ Limited to 10GB memory
- ❌ More complex deployment

### ECS Fargate Pros & Cons

**Pros:**
- ✅ No cold starts
- ✅ Unlimited execution time
- ✅ WebSocket support
- ✅ Predictable performance
- ✅ Easier local development

**Cons:**
- ❌ Pay even when idle
- ❌ Manual scaling configuration
- ❌ More expensive for sporadic tasks

---

## Recommended Architecture

### Hybrid Approach (Best of Both)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (Mumbai)                           │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    ALWAYS RUNNING (ECS)                      │    │
│  │                                                              │    │
│  │   ┌─────────────┐         ┌─────────────┐                   │    │
│  │   │  Next.js    │         │  Express    │                   │    │
│  │   │  Web App    │         │    API      │                   │    │
│  │   │  (ECS)      │         │   (ECS)     │                   │    │
│  │   └─────────────┘         └──────┬──────┘                   │    │
│  │                                  │                          │    │
│  └──────────────────────────────────┼──────────────────────────┘    │
│                                     │                               │
│                                     │ Triggers                      │
│                                     ▼                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    ON-DEMAND (Lambda)                        │    │
│  │                                                              │    │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐              │    │
│  │   │  Image    │  │   Email   │  │   Push    │              │    │
│  │   │ Processor │  │  Sender   │  │  Notifs   │              │    │
│  │   └───────────┘  └───────────┘  └───────────┘              │    │
│  │                                                              │    │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐              │    │
│  │   │   PDF     │  │  Search   │  │ Scheduled │              │    │
│  │   │ Generator │  │  Indexer  │  │   Tasks   │              │    │
│  │   └───────────┘  └───────────┘  └───────────┘              │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    STORAGE & DATA                            │    │
│  │                                                              │    │
│  │   ┌───────────┐  ┌───────────┐  ┌───────────┐              │    │
│  │   │    RDS    │  │    S3     │  │    SQS    │              │    │
│  │   │ PostgreSQL│  │  Images   │  │  Queues   │              │    │
│  │   └───────────┘  └───────────┘  └───────────┘              │    │
│  │                                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Examples

**Image Upload Flow:**
```
User uploads image
       ↓
ECS API receives file → Stores raw in S3
       ↓
S3 triggers Lambda (image-processor)
       ↓
Lambda processes: resize, compress, WebP
       ↓
Lambda saves processed images to S3
       ↓
Lambda updates database with URLs
```

**New Ad Posted Flow:**
```
User posts new ad
       ↓
ECS API saves to database
       ↓
API sends message to SQS queue
       ↓
Lambda (search-indexer) triggered
       ↓
Lambda indexes ad for search
       ↓
Lambda (notification-sender) triggered
       ↓
Lambda sends push to followers
```

---

## Lambda Use Cases

### 1. Image Processing Lambda

**Purpose:** Resize, compress, and convert images to WebP

**Trigger:** S3 upload event

**Benefits:**
- Process images in parallel (upload 10 images = 10 Lambdas)
- No impact on main API performance
- Pay only when processing

```
S3 Bucket (raw uploads)
         ↓
    S3 Event Trigger
         ↓
    Lambda Function
         ↓
    ┌────┴────┐
    ↓         ↓
 Original  Thumbnail
 (1920px)  (400px)
    ↓         ↓
S3 Bucket (processed)
```

### 2. Email Sending Lambda

**Purpose:** Send transactional emails (welcome, password reset, notifications)

**Trigger:** SQS queue message

**Benefits:**
- Decoupled from main API
- Retry on failure automatically
- Handle email bounces

```
API posts email job to SQS
         ↓
    SQS Queue
         ↓
    Lambda Function
         ↓
    Amazon SES
         ↓
    User receives email
```

### 3. Push Notification Lambda

**Purpose:** Send push notifications to mobile apps

**Trigger:** SQS queue or EventBridge

**Benefits:**
- Batch processing
- Different logic for iOS/Android
- Track delivery status

### 4. Scheduled Tasks Lambda

**Purpose:** Daily/weekly maintenance tasks

**Trigger:** EventBridge (CloudWatch Events) schedule

**Examples:**
- Delete expired ads
- Generate daily reports
- Clean up orphan images
- Send weekly digest emails

```
EventBridge Rule (cron)
         ↓
    Lambda Function
         ↓
    Database cleanup
```

### 5. PDF Generation Lambda

**Purpose:** Generate invoices, reports, receipts

**Trigger:** API Gateway or SQS

**Benefits:**
- Memory-intensive task offloaded
- Puppeteer/Chrome runs in Lambda
- Store PDFs in S3

---

## Implementation Examples

### Image Processor Lambda

```typescript
// lambda/image-processor/index.ts

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3 = new S3Client({ region: 'ap-south-1' });
const PROCESSED_BUCKET = 'thulobazaar-images-processed';

interface S3Event {
  Records: Array<{
    s3: {
      bucket: { name: string };
      object: { key: string };
    };
  }>;
}

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    console.log(`Processing: ${bucket}/${key}`);

    // Get original image from S3
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(getCommand);
    const buffer = Buffer.from(await response.Body!.transformToByteArray());

    // Process sizes
    const sizes = [
      { name: 'thumb', width: 400, height: 400, quality: 75 },
      { name: 'medium', width: 800, height: 800, quality: 80 },
      { name: 'large', width: 1920, height: 1920, quality: 85 },
    ];

    for (const size of sizes) {
      const processed = await sharp(buffer)
        .resize(size.width, size.height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: size.quality })
        .toBuffer();

      // Save to processed bucket
      const newKey = key.replace(/\.[^.]+$/, `-${size.name}.webp`);
      await s3.send(new PutObjectCommand({
        Bucket: PROCESSED_BUCKET,
        Key: newKey,
        Body: processed,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000',
      }));

      console.log(`Saved: ${newKey} (${processed.length} bytes)`);
    }
  }

  return { statusCode: 200, body: 'Processed successfully' };
};
```

### Email Sender Lambda

```typescript
// lambda/email-sender/index.ts

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { SQSEvent } from 'aws-lambda';

const ses = new SESClient({ region: 'ap-south-1' });

interface EmailJob {
  to: string;
  subject: string;
  template: 'welcome' | 'password-reset' | 'ad-approved' | 'new-message';
  data: Record<string, string>;
}

const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  welcome: (data) => `
    <h1>Welcome to ThuluBazaar, ${data.name}!</h1>
    <p>Start buying and selling today.</p>
  `,
  'password-reset': (data) => `
    <h1>Reset Your Password</h1>
    <p>Click here to reset: ${data.resetLink}</p>
  `,
  'ad-approved': (data) => `
    <h1>Your Ad is Live!</h1>
    <p>Your ad "${data.adTitle}" has been approved.</p>
  `,
  'new-message': (data) => `
    <h1>New Message</h1>
    <p>${data.senderName} sent you a message about "${data.adTitle}"</p>
  `,
};

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const job: EmailJob = JSON.parse(record.body);

    const htmlBody = TEMPLATES[job.template](job.data);

    await ses.send(new SendEmailCommand({
      Source: 'ThuluBazaar <noreply@thulobazaar.com>',
      Destination: { ToAddresses: [job.to] },
      Message: {
        Subject: { Data: job.subject },
        Body: { Html: { Data: htmlBody } },
      },
    }));

    console.log(`Email sent to ${job.to}`);
  }

  return { statusCode: 200 };
};
```

### Scheduled Cleanup Lambda

```typescript
// lambda/scheduled-cleanup/index.ts

import { PrismaClient } from '@prisma/client';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const s3 = new S3Client({ region: 'ap-south-1' });

export const handler = async () => {
  console.log('Running daily cleanup...');

  // 1. Delete expired ads (older than 90 days)
  const expiredAds = await prisma.ads.findMany({
    where: {
      created_at: {
        lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
      status: 'expired',
    },
    select: { id: true, images: true },
  });

  for (const ad of expiredAds) {
    // Delete images from S3
    for (const image of ad.images as string[]) {
      await s3.send(new DeleteObjectCommand({
        Bucket: 'thulobazaar-images',
        Key: image,
      }));
    }

    // Delete ad record
    await prisma.ads.delete({ where: { id: ad.id } });
  }

  console.log(`Deleted ${expiredAds.length} expired ads`);

  // 2. Delete unverified users (older than 7 days)
  const unverifiedUsers = await prisma.users.deleteMany({
    where: {
      email_verified: false,
      created_at: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`Deleted ${unverifiedUsers.count} unverified users`);

  // 3. Clean orphan images
  // ... additional cleanup logic

  await prisma.$disconnect();

  return {
    statusCode: 200,
    body: JSON.stringify({
      expiredAds: expiredAds.length,
      unverifiedUsers: unverifiedUsers.count,
    }),
  };
};
```

---

## Cost Comparison

### Scenario: 50,000 Daily Users

#### Image Processing

| Approach | Monthly Cost | Notes |
|----------|--------------|-------|
| **Lambda** | ~$5-10 | 5,000 images × $0.001 each |
| **ECS (dedicated)** | ~$30-50 | Always running processor |

**Lambda saves: ~$20-40/month**

#### Email Sending (10,000 emails/month)

| Approach | Monthly Cost | Notes |
|----------|--------------|-------|
| **Lambda + SES** | ~$2-3 | $0.0001/email + SES costs |
| **ECS + SES** | ~$15-20 | Server time + SES |

**Lambda saves: ~$12-17/month**

#### Scheduled Tasks

| Approach | Monthly Cost | Notes |
|----------|--------------|-------|
| **Lambda** | ~$0.50 | Runs 5 min/day |
| **ECS (dedicated)** | ~$15 | Minimum container |

**Lambda saves: ~$14/month**

### Total Potential Savings

| Component | ECS Only | Hybrid (ECS + Lambda) | Savings |
|-----------|----------|----------------------|---------|
| Web App | $60 | $60 | - |
| API | $60 | $60 | - |
| Image Processing | $40 | $8 | $32 |
| Email Sending | $20 | $3 | $17 |
| Scheduled Tasks | $15 | $1 | $14 |
| **Total** | **$195** | **$132** | **$63/month** |

---

## Setup Instructions

### 1. Create Lambda Functions

```bash
# Using AWS SAM (Serverless Application Model)
sam init --runtime nodejs18.x --name thulobazaar-lambdas

# Or using Serverless Framework
serverless create --template aws-nodejs-typescript
```

### 2. SAM Template Example

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs18.x
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        DATABASE_URL: '{{resolve:secretsmanager:thulobazaar/db:SecretString:url}}'

Resources:
  # Image Processor
  ImageProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: image-processor/index.handler
      MemorySize: 1024
      Timeout: 60
      Events:
        S3Event:
          Type: S3
          Properties:
            Bucket: !Ref RawImagesBucket
            Events: s3:ObjectCreated:*
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: uploads/

  # Email Sender
  EmailSenderFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: email-sender/index.handler
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt EmailQueue.Arn
            BatchSize: 10

  # Scheduled Cleanup
  ScheduledCleanupFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: scheduled-cleanup/index.handler
      Timeout: 300
      Events:
        DailySchedule:
          Type: Schedule
          Properties:
            Schedule: cron(0 3 * * ? *)  # 3 AM daily

  # SQS Queues
  EmailQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: thulobazaar-email-queue

  # S3 Buckets
  RawImagesBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: thulobazaar-images-raw

  ProcessedImagesBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: thulobazaar-images-processed
```

### 3. Deploy Lambdas

```bash
# Build and deploy
sam build
sam deploy --guided

# Or with Serverless Framework
serverless deploy
```

### 4. Connect ECS to Lambda

```typescript
// In your Express API
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'ap-south-1' });
const EMAIL_QUEUE_URL = process.env.EMAIL_QUEUE_URL;

// Send email via Lambda
export async function sendEmail(to: string, template: string, data: object) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: EMAIL_QUEUE_URL,
    MessageBody: JSON.stringify({ to, template, data }),
  }));
}

// Usage in route
router.post('/register', async (req, res) => {
  const user = await createUser(req.body);

  // Queue welcome email (Lambda will process)
  await sendEmail(user.email, 'welcome', { name: user.full_name });

  res.json({ success: true });
});
```

---

## Best Practices

### 1. Cold Start Optimization

```typescript
// Initialize outside handler (reused between invocations)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const handler = async (event) => {
  // prisma is already connected
  const users = await prisma.users.findMany();
  // Don't disconnect - reuse connection
};
```

### 2. Use Provisioned Concurrency for Critical Lambdas

```yaml
# For APIs that need instant response
ImageProcessorFunction:
  ProvisionedConcurrencyConfig:
    ProvisionedConcurrentExecutions: 5
```

### 3. Set Appropriate Timeouts

| Lambda Type | Recommended Timeout |
|-------------|-------------------|
| API Response | 10 seconds |
| Image Processing | 60 seconds |
| Email Sending | 30 seconds |
| Scheduled Tasks | 5 minutes |

### 4. Monitor with CloudWatch

```bash
# View Lambda logs
aws logs tail /aws/lambda/ImageProcessorFunction --follow

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ImageProcessorFunction \
  --start-time 2024-12-14T00:00:00Z \
  --end-time 2024-12-14T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## When NOT to Use Lambda

| Scenario | Why Not Lambda | Use Instead |
|----------|----------------|-------------|
| Main API | Cold starts hurt UX | ECS Fargate |
| WebSockets | No persistent connections | ECS/EC2 |
| Long processes (>15 min) | Timeout limit | ECS/EC2 |
| GPU workloads | Not available | EC2 with GPU |
| Predictable high traffic | More expensive | ECS Fargate |

---

## Quick Reference

### Lambda Pricing (ap-south-1 Mumbai)

| Resource | Price |
|----------|-------|
| Requests | $0.20 per 1M requests |
| Duration | $0.0000166667 per GB-second |
| Free Tier | 1M requests + 400,000 GB-seconds/month |

### Example Cost Calculation

```
Image Processor Lambda:
- 5,000 images/month
- 512MB memory
- 5 seconds average

Cost = (5,000 × $0.0000002) + (5,000 × 5 × 0.5 × $0.0000166667)
     = $0.001 + $0.21
     = $0.21/month (basically free!)
```

---

*Last updated: December 2024*
