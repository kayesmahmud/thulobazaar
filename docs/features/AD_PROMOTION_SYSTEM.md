# 🚀 Ad Promotion System - ThuLoBazaar

## Overview

ThuLoBazaar offers a **3-tier ad promotion system** to help sellers increase visibility and sell faster. Each tier provides different levels of exposure with corresponding pricing.

---

## 📊 Promotion Tiers (Ranked by Visibility)

### 🏆 Tier 1: FEATURED ADS (Highest Visibility)
**Purpose:** Maximum exposure across the entire platform

**Visibility:**
- ✅ **Homepage** - Shown in "Featured Ads" carousel/section
- ✅ **Search Results Page** - Displayed at the very top (above all other ads)
- ✅ **Category Pages** - Highlighted section at the top
- ✅ **All Subcategories** - Featured badge visible everywhere

**Visual Indicators:**
- 🌟 Gold "FEATURED" badge on ad thumbnail
- ⭐ Yellow/gold highlight border
- 📍 "Featured" label in prominent position

**Target Audience:** High-value items, businesses, sellers who want maximum exposure

**Database Field:** `is_featured = TRUE`, `featured_expires_at`

---

### 🔥 Tier 2: URGENT SALE ADS (High Visibility)
**Purpose:** Quick sales for time-sensitive items

**Visibility:**
- ✅ **Subcategory Listings** - Placed at the top, ABOVE sticky/bump ads
- ✅ **Search Results** - Shown near top (below featured, above sticky)
- ❌ **NOT shown on homepage** (unless also Featured)

**Visual Indicators:**
- 🔴 Red "URGENT" badge on ad thumbnail
- ⏰ Red border or highlight
- 🚨 "Urgent Sale" label

**Sorting Order in Subcategory:**
```
1. Featured Ads (if in this category)
2. Urgent Sale Ads ← TIER 2
3. Sticky/Bump Ads ← TIER 3
4. Regular Ads
```

**Target Audience:** Sellers who need quick sales, clearance items, time-sensitive offers

**Database Field:** `is_urgent = TRUE`, `urgent_expires_at`

---

### 📌 Tier 3: STICKY/BUMP UP ADS (Standard Visibility)
**Purpose:** Stay at top of subcategory listings

**Visibility:**
- ✅ **Subcategory Listings** - Stays at top of category (below Featured and Urgent)
- ❌ **NOT shown on homepage**
- ❌ **NOT prioritized in search** (only in subcategory)

**Visual Indicators:**
- 📌 Blue "STICKY" or "BUMPED" badge (optional)
- 🔵 Light blue highlight (subtle)
- 📍 "Promoted" label

**Sorting Order in Subcategory:**
```
1. Featured Ads (if in this category)
2. Urgent Sale Ads
3. Sticky/Bump Ads ← TIER 3
4. Regular Ads
```

**Target Audience:** Sellers who want consistent category visibility without premium pricing

**Database Field:** `is_sticky = TRUE` OR `is_bumped = TRUE`, `sticky_expires_at`

**Note:** In the current implementation:
- `is_sticky` - Keeps ad at top for duration
- `is_bumped` - One-time refresh to top (can be same as sticky, or separate quick boost)

---

## 💰 Pricing Structure

### Individual Sellers (Unverified)
| Promotion Type | 3 Days | 7 Days | 15 Days |
|----------------|--------|--------|---------|
| **Featured** | NPR 1,000 | NPR 2,000 | NPR 3,500 |
| **Urgent** | NPR 500 | NPR 1,000 | NPR 1,750 |
| **Sticky/Bump** | NPR 100 | NPR 200 | NPR 350 |

### Business Verified Sellers (Gold Badge) - 30-40% Discount
| Promotion Type | 3 Days | 7 Days | 15 Days | Discount |
|----------------|--------|--------|---------|----------|
| **Featured** | NPR 600 | NPR 1,200 | NPR 2,100 | 40% OFF |
| **Urgent** | NPR 300 | NPR 600 | NPR 1,050 | 40% OFF |
| **Sticky/Bump** | NPR 70 | NPR 140 | NPR 245 | 30% OFF |

**Savings:** Verified businesses save **30-40% on all promotions**!

---

## 🎯 Use Cases & Recommendations

### When to Use FEATURED:
- ✅ High-value items (cars, property, expensive electronics)
- ✅ Business liquidation sales
- ✅ New product launches
- ✅ Grand opening promotions
- ✅ Items with broad appeal (not niche)

### When to Use URGENT:
- ✅ Time-sensitive sales (moving out, closing business)
- ✅ Clearance items
- ✅ Seasonal sales
- ✅ Quick cash needs
- ✅ Price-reduced items

### When to Use STICKY/BUMP:
- ✅ Consistent visibility in specific category
- ✅ Budget-friendly promotion
- ✅ Testing the market
- ✅ Niche items with specific audience
- ✅ Regular inventory refresh

---

## 📈 Visibility Comparison

### Ad Placement Examples

**Homepage:**
```
┌─────────────────────────────────────┐
│  🌟 FEATURED ADS CAROUSEL           │
│  [Featured Ad 1] [Featured Ad 2]    │
└─────────────────────────────────────┘
│  Categories...                       │
│  Latest Ads...                       │
│  (Urgent and Sticky NOT shown here)  │
```

**Search Results:**
```
┌─────────────────────────────────────┐
│  🌟 FEATURED ADS (if match search)  │
│  [Featured Ad 1]                     │
│  [Featured Ad 2]                     │
├─────────────────────────────────────┤
│  🔥 URGENT ADS (if match)            │
│  [Urgent Ad 1]                       │
│  [Urgent Ad 2]                       │
├─────────────────────────────────────┤
│  📌 STICKY ADS (if match)            │
│  [Sticky Ad 1]                       │
├─────────────────────────────────────┤
│  Regular Search Results...           │
└─────────────────────────────────────┘
```

**Subcategory Page (e.g., "Mobile Phones > Smartphones"):**
```
┌─────────────────────────────────────┐
│  🌟 FEATURED (in this category)     │
│  [Featured iPhone]                   │
├─────────────────────────────────────┤
│  🔥 URGENT SALE                      │
│  [Urgent Samsung] [Urgent Xiaomi]    │
├─────────────────────────────────────┤
│  📌 STICKY/BUMPED                    │
│  [Sticky OnePlus] [Sticky Oppo]      │
├─────────────────────────────────────┤
│  Regular Ads (newest first)          │
│  [Regular ad 1]                      │
│  [Regular ad 2]                      │
└─────────────────────────────────────┘
```

---

## 🗄️ Database Structure

### Ads Table Fields:
```sql
-- Featured promotion
is_featured BOOLEAN DEFAULT FALSE,
featured_expires_at TIMESTAMP,

-- Urgent promotion
is_urgent BOOLEAN DEFAULT FALSE,
urgent_expires_at TIMESTAMP,

-- Sticky/Bump promotion
is_sticky BOOLEAN DEFAULT FALSE,
sticky_expires_at TIMESTAMP,
is_bumped BOOLEAN DEFAULT FALSE,
bump_expires_at TIMESTAMP,

-- Promotion tracking
total_promotions INTEGER DEFAULT 0,
last_promoted_at TIMESTAMP
```

### Ad Promotions Table (Transaction History):
```sql
CREATE TABLE ad_promotions (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES ads(id),
    user_id INTEGER REFERENCES users(id),
    promotion_type VARCHAR(20), -- 'featured', 'urgent', 'sticky', 'bump_up'
    duration_days INTEGER, -- 3, 7, 15
    price_paid DECIMAL(10,2),
    account_type VARCHAR(20), -- 'individual', 'business'
    payment_reference VARCHAR(255),
    payment_method VARCHAR(50), -- 'esewa', 'khalti'
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Promotion Pricing Table:
```sql
CREATE TABLE promotion_pricing (
    promotion_type VARCHAR(20), -- 'featured', 'urgent', 'sticky'
    duration_days INTEGER, -- 3, 7, 15
    account_type VARCHAR(20), -- 'individual', 'business'
    price DECIMAL(10,2),
    discount_percentage INTEGER, -- 0, 30, 40
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🔧 Implementation Details

### Backend - Promotion Query Order:
```sql
-- Get ads for a subcategory with proper promotion sorting
SELECT * FROM ads
WHERE category_id = $1
  AND status = 'approved'
  AND deleted_at IS NULL
ORDER BY
  -- 1. Featured ads first
  CASE WHEN is_featured = TRUE AND featured_expires_at > NOW() THEN 1 ELSE 4 END,

  -- 2. Urgent ads second
  CASE WHEN is_urgent = TRUE AND urgent_expires_at > NOW() THEN 2 ELSE 4 END,

  -- 3. Sticky ads third
  CASE WHEN is_sticky = TRUE AND sticky_expires_at > NOW() THEN 3 ELSE 4 END,

  -- 4. Then by created date (newest first)
  created_at DESC;
```

### Auto-Expire Function:
```sql
-- Function to expire old promotions (run via cron every hour)
CREATE OR REPLACE FUNCTION expire_old_promotions()
RETURNS void AS $$
BEGIN
    UPDATE ads
    SET is_featured = FALSE
    WHERE is_featured = TRUE AND featured_expires_at < CURRENT_TIMESTAMP;

    UPDATE ads
    SET is_urgent = FALSE
    WHERE is_urgent = TRUE AND urgent_expires_at < CURRENT_TIMESTAMP;

    UPDATE ads
    SET is_sticky = FALSE
    WHERE is_sticky = TRUE AND sticky_expires_at < CURRENT_TIMESTAMP;

    UPDATE ad_promotions
    SET is_active = FALSE
    WHERE is_active = TRUE AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

---

## 💡 Revenue Model

### Monthly Revenue Potential (Example):

**Scenario:** 1,000 active ads, 10% promoted

| Promotion Type | Avg Duration | Price (Ind) | Price (Biz) | Ads/Month | Revenue |
|----------------|--------------|-------------|-------------|-----------|---------|
| Featured | 7 days | 2,000 | 1,200 | 10 | NPR 15,000 |
| Urgent | 7 days | 1,000 | 600 | 30 | NPR 25,000 |
| Sticky | 7 days | 200 | 140 | 60 | NPR 10,000 |
| **TOTAL** | | | | **100** | **NPR 50,000** |

**Annual Revenue Potential:** NPR 600,000+ (from promotions alone)

---

## 📱 Frontend Components to Create

### 1. Promotion Selection Modal
**File:** `frontend/src/components/PromoteAdModal.jsx`

**Features:**
- Show all 3 tiers with descriptions
- Display pricing (with discount for verified business)
- Duration selector (3/7/15 days)
- Savings calculator
- Payment gateway selection

**UI:**
```jsx
<PromoteAdModal adId={ad.id}>
  <div className="promotion-tier tier-featured">
    <h3>🌟 FEATURED</h3>
    <p>Homepage + Search + Category</p>
    <PriceOptions
      regular={[1000, 2000, 3500]}
      business={[600, 1200, 2100]}
      userType={userType}
    />
  </div>

  <div className="promotion-tier tier-urgent">
    <h3>🔥 URGENT SALE</h3>
    <p>Top of Category (Fast Sale)</p>
    <PriceOptions
      regular={[500, 1000, 1750]}
      business={[300, 600, 1050]}
      userType={userType}
    />
  </div>

  <div className="promotion-tier tier-sticky">
    <h3>📌 STICKY/BUMP</h3>
    <p>Stay at Top of Category</p>
    <PriceOptions
      regular={[100, 200, 350]}
      business={[70, 140, 245]}
      userType={userType}
    />
  </div>
</PromoteAdModal>
```

### 2. Promotion Badge Component
**File:** `frontend/src/components/PromotionBadge.jsx`

```jsx
export const PromotionBadge = ({ ad }) => {
  if (ad.is_featured && new Date(ad.featured_expires_at) > new Date()) {
    return <span className="badge badge-featured">🌟 FEATURED</span>;
  }
  if (ad.is_urgent && new Date(ad.urgent_expires_at) > new Date()) {
    return <span className="badge badge-urgent">🔥 URGENT</span>;
  }
  if (ad.is_sticky && new Date(ad.sticky_expires_at) > new Date()) {
    return <span className="badge badge-sticky">📌 PROMOTED</span>;
  }
  return null;
};
```

### 3. Promote Button
**File:** Integrate into `AdDetail.jsx` and Dashboard

```jsx
{isOwner && (
  <button
    onClick={() => setShowPromoteModal(true)}
    className="btn btn-promote"
  >
    🚀 Promote This Ad
  </button>
)}
```

---

## ✅ Implementation Checklist

### Backend:
- [x] Database tables exist (`ads`, `ad_promotions`, `promotion_pricing`)
- [ ] Create `backend/routes/promotions.js`
  - [ ] `GET /api/promotions/pricing` - Get pricing for user type
  - [ ] `POST /api/promotions/purchase` - Purchase promotion (with payment)
  - [ ] `GET /api/promotions/my-promotions` - User's promotion history
  - [ ] `POST /api/promotions/expire-check` - Manual trigger for expiry
- [ ] Create `backend/services/promotionService.js`
  - [ ] `calculatePrice(type, duration, accountType)`
  - [ ] `activatePromotion(adId, type, duration)`
  - [ ] `expirePromotions()` - Auto-expire
- [ ] Update search/listing queries to respect promotion order
- [ ] Set up cron job to run `expire_old_promotions()` hourly

### Frontend:
- [ ] Create `PromoteAdModal.jsx` - Main promotion UI
- [ ] Create `PromotionBadge.jsx` - Visual indicators
- [ ] Create `PromotionPricing.jsx` - Pricing display component
- [ ] Update `AdCard.jsx` - Show promotion badges
- [ ] Update `AdDetail.jsx` - Add "Promote" button
- [ ] Update `Dashboard.jsx` - Show promotion status
- [ ] Create `PromotionHistory.jsx` - User's promotion history
- [ ] Update CSS for badge styling

### Payment Integration:
- [ ] Integrate with eSewa for promotion payments
- [ ] Integrate with Khalti for promotion payments
- [ ] Apply business discount automatically
- [ ] Generate payment receipts
- [ ] Handle payment failures gracefully

### Testing:
- [ ] Test promotion activation
- [ ] Test auto-expiry
- [ ] Test sorting order (featured > urgent > sticky > regular)
- [ ] Test pricing calculation
- [ ] Test business discount application
- [ ] Test payment flow

---

## 🎨 Badge Styling

### CSS:
```css
/* Featured Badge */
.badge-featured {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

/* Urgent Badge */
.badge-urgent {
  background: linear-gradient(135deg, #FF4444, #CC0000);
  color: white;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  animation: pulse 2s infinite;
}

/* Sticky Badge */
.badge-sticky {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* Card Highlighting */
.ad-card.is-featured {
  border: 3px solid #FFD700;
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.ad-card.is-urgent {
  border: 2px solid #FF4444;
  box-shadow: 0 2px 12px rgba(255, 68, 68, 0.2);
}

.ad-card.is-sticky {
  border: 2px solid #4A90E2;
  background: rgba(74, 144, 226, 0.02);
}

/* Pulse animation for urgent */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

## 📊 Analytics to Track

### Per Ad:
- Total promotion spend
- Promotion type history
- Views during promotion vs. normal
- Conversion rate (promotion vs. normal)
- ROI per promotion type

### Platform-Wide:
- Most popular promotion type
- Average promotion duration
- Total promotion revenue
- Promotion usage by category
- Verified business vs. individual promotion ratio

---

## 🚀 Future Enhancements

### Phase 2 Features:
- **Auto-Renew:** Automatically renew promotions before expiry
- **Combo Deals:** Bundle promotions for discount (e.g., Featured + Urgent)
- **Flash Promotions:** Limited-time 50% off promotions
- **Promotion Analytics:** Detailed ROI reports for sellers
- **A/B Testing:** Test different promotion types
- **Smart Suggestions:** AI suggests best promotion type based on item/category

---

**Last Updated:** 2025-10-09
**Status:** ✅ Database Ready, Frontend Pending
**Priority:** Week 1, Day 5 (After payment integration)

**Related Files:**
- `backend/migrations/004_business_and_promotions.sql` - Database schema
- `COMPLETE_IMPLEMENTATION_CHECKLIST.md` - Implementation plan
- `PROJECT_STATUS.md` - Overall project status
