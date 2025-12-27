# Testing Mock Payment & Promotion System

## Step-by-Step Testing Guide

This guide will walk you through testing the complete mock payment and ad promotion flow.

---

## Prerequisites

1. **Backend server running**: `npm run dev` (in backend folder)
2. **Database running**: PostgreSQL on port 5432
3. **User logged in**: You need a valid JWT token
4. **Active ad**: You need an ad ID to promote

---

## Step 1: Get Your JWT Token

First, log in to get your authentication token:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Save the token** - you'll need it for all subsequent requests!

---

## Step 2: Get an Active Ad ID

List your ads to get an ad ID to promote:

```bash
curl -X GET http://localhost:5000/api/ads/my-ads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "ads": [
    {
      "id": 123,
      "title": "Sample Ad",
      "status": "active",
      ...
    }
  ]
}
```

**Save the ad ID** (e.g., 123) - you'll promote this ad!

---

## Step 3: Check Promotion Pricing

View available promotion types and pricing:

```javascript
// Pricing Structure (from promotionService.js)
{
  featured: {
    3: { individual: 500, business: 350 },
    7: { individual: 1000, business: 700 },
    15: { individual: 1800, business: 1080 }
  },
  urgent: {
    3: { individual: 300, business: 210 },
    7: { individual: 600, business: 420 },
    15: { individual: 1000, business: 600 }
  },
  sticky: {
    3: { individual: 150, business: 105 },
    7: { individual: 300, business: 210 },
    15: { individual: 500, business: 300 }
  }
}
```

**Promotion Types:**
- 🌟 **Featured**: Shows on homepage, search page, and category
- 🔥 **Urgent**: Top of subcategory (priority over sticky)
- 📌 **Sticky/Bump**: Top of subcategory (standard)

**Duration Options**: 3, 7, or 15 days

---

## Step 4: Initiate Mock Payment

Start a payment for ad promotion:

```bash
curl -X POST http://localhost:5000/api/mock-payment/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "paymentType": "ad_promotion",
    "relatedId": 123,
    "metadata": {
      "adId": 123,
      "promotionType": "featured",
      "durationDays": 7
    }
  }'
```

**Parameters:**
- `amount`: Payment amount (must match pricing table)
- `paymentType`: "ad_promotion"
- `relatedId`: Your ad ID
- `metadata.adId`: Your ad ID (same as relatedId)
- `metadata.promotionType`: "featured", "urgent", or "sticky"
- `metadata.durationDays`: 3, 7, or 15

**Expected Response:**
```json
{
  "success": true,
  "paymentTransactionId": 1,
  "transactionId": "MOCK_1234567890_xyz789",
  "paymentUrl": "/mock-payment?txnId=MOCK_1234567890_xyz789&amount=1000...",
  "amount": 1000,
  "productName": "Ad Promotion - featured (7 days)",
  "gateway": "mock",
  "message": "🎭 MOCK PAYMENT: Payment initiated. Use /success or /failure endpoint to complete."
}
```

**Save the transactionId** - you need it for the next step!

---

## Step 5: Complete Payment (Success)

Simulate successful payment callback:

```bash
curl -X GET "http://localhost:5000/api/mock-payment/success?txnId=MOCK_1234567890_xyz789&amount=1000"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "🎉 Payment verified successfully!",
  "transactionId": "MOCK_1234567890_xyz789",
  "amount": 1000,
  "paymentType": "ad_promotion",
  "verifiedAt": "2025-10-09T...",
  "promotionActivated": true
}
```

**What happens behind the scenes:**
1. ✅ Payment is marked as "verified" in payment_transactions table
2. ✅ Promotion is activated in ad_promotions table
3. ✅ Ad is updated with promotion flags (is_featured = true, featured_until = date)
4. ✅ User's ad is now promoted!

---

## Step 6: Verify in Database

Check that everything worked:

### Check Payment Transaction

```bash
PGPASSWORD=postgres psql -U elw -d thulobazaar -c "
  SELECT id, user_id, payment_type, amount, status, verified_at
  FROM payment_transactions
  WHERE transaction_id = 'MOCK_1234567890_xyz789';
"
```

**Expected:**
- status: "verified"
- verified_at: timestamp

### Check Ad Promotion Record

```bash
PGPASSWORD=postgres psql -U elw -d thulobazaar -c "
  SELECT id, ad_id, promotion_type, duration_days, price_paid,
         starts_at, expires_at, is_active
  FROM ad_promotions
  WHERE ad_id = 123
  ORDER BY starts_at DESC
  LIMIT 1;
"
```

**Expected:**
- promotion_type: "featured"
- duration_days: 7
- is_active: true
- expires_at: 7 days from now

### Check Ad Flags

```bash
PGPASSWORD=postgres psql -U elw -d thulobazaar -c "
  SELECT id, title, is_featured, featured_until, promoted_at
  FROM ads
  WHERE id = 123;
"
```

**Expected:**
- is_featured: true
- featured_until: 7 days from now
- promoted_at: current timestamp

---

## Step 7: Test Payment Failure (Optional)

Simulate failed payment:

```bash
# Step 1: Initiate payment (same as Step 4)
curl -X POST http://localhost:5000/api/mock-payment/initiate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Step 2: Fail the payment
curl -X GET "http://localhost:5000/api/mock-payment/failure?txnId=MOCK_NEW_TXN_ID&reason=User+cancelled"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "❌ Payment failed",
  "transactionId": "MOCK_NEW_TXN_ID",
  "reason": "User cancelled"
}
```

**Verify:** Payment status should be "failed" in database, and promotion should NOT be activated.

---

## Step 8: Check Payment Status

Get status of any transaction:

```bash
curl -X GET http://localhost:5000/api/mock-payment/status/MOCK_1234567890_xyz789 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "payment": {
    "id": 1,
    "transactionId": "MOCK_1234567890_xyz789",
    "paymentType": "ad_promotion",
    "amount": 1000,
    "status": "verified",
    "createdAt": "2025-10-09T...",
    "verifiedAt": "2025-10-09T...",
    "metadata": {
      "adId": 123,
      "promotionType": "featured",
      "durationDays": 7
    }
  }
}
```

---

## Testing Different Promotion Types

### Test Featured Promotion (7 days, individual)

```bash
curl -X POST http://localhost:5000/api/mock-payment/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "paymentType": "ad_promotion",
    "relatedId": YOUR_AD_ID,
    "metadata": {
      "adId": YOUR_AD_ID,
      "promotionType": "featured",
      "durationDays": 7
    }
  }'
```

### Test Urgent Promotion (3 days, individual)

```bash
curl -X POST http://localhost:5000/api/mock-payment/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300,
    "paymentType": "ad_promotion",
    "relatedId": YOUR_AD_ID,
    "metadata": {
      "adId": YOUR_AD_ID,
      "promotionType": "urgent",
      "durationDays": 3
    }
  }'
```

### Test Sticky Promotion (15 days, individual)

```bash
curl -X POST http://localhost:5000/api/mock-payment/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "paymentType": "ad_promotion",
    "relatedId": YOUR_AD_ID,
    "metadata": {
      "adId": YOUR_AD_ID,
      "promotionType": "sticky",
      "durationDays": 15
    }
  }'
```

---

## Common Issues & Troubleshooting

### Issue: "Invalid amount" error

**Cause:** Amount doesn't match pricing table

**Solution:** Check pricing in Step 3 and use correct amount for promotion type + duration

### Issue: "Ad not found" or "Unauthorized"

**Cause:** Ad doesn't belong to user or doesn't exist

**Solution:** Use `GET /api/ads/my-ads` to get your own ad IDs

### Issue: "Cannot promote inactive ad"

**Cause:** Ad status is not "active"

**Solution:** Activate the ad first before promoting

### Issue: Payment verified but promotion not activated

**Cause:** Error in promotionService.js

**Solution:** Check backend logs for error details

---

## Success Checklist

After successful testing, you should see:

- ✅ Payment transaction created with status "pending"
- ✅ Payment verified and status changed to "verified"
- ✅ Ad promotion record created in ad_promotions table
- ✅ Ad flags updated (is_featured/is_urgent/is_sticky = true)
- ✅ Expiry dates set correctly (featured_until/urgent_until/sticky_until)
- ✅ Backend logs show success messages

---

## Next Steps

Once mock payment testing is complete:

1. **Frontend Integration**: Create UI for users to select promotion type and duration
2. **Real Payment Gateway**: Replace mock with eSewa/Khalti integration
3. **Cron Job**: Set up automatic expiry of promotions
4. **Admin Panel**: View all promotions and revenue
5. **Analytics**: Track promotion performance

---

## API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/mock-payment/initiate` | Start payment transaction |
| GET | `/api/mock-payment/success` | Simulate successful payment |
| GET | `/api/mock-payment/failure` | Simulate failed payment |
| POST | `/api/mock-payment/verify` | Verify payment status |
| GET | `/api/mock-payment/status/:txnId` | Get transaction details |

---

**Happy Testing! 🎉**
