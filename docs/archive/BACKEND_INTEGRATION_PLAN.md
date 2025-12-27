# Editor Dashboard - Backend Integration Plan

## Current Status Analysis

### ✅ Existing Backend API Endpoints (Ready to Use)

#### 1. Dashboard Statistics
**Endpoint:** `GET /api/editor/stats`
**Returns:**
- `totalAds` - Total number of ads
- `pendingAds` - Ads waiting for review
- `activeAds` - Approved and live ads
- `rejectedAds` - Rejected ads count
- `pendingVerifications` - Total pending verifications (business + individual)

**Frontend Location:** `/apps/web/src/app/[lang]/editor/dashboard/page.tsx:43-54`
**Current Status:** ❌ Using mock data
**Integration Difficulty:** 🟢 Easy

---

#### 2. Activity Logs
**Endpoint:** `GET /api/editor/activity-logs`
**Query Params:** `adminId`, `actionType`, `targetType`, `page`, `limit`
**Returns:**
- Array of activities with timestamps
- Admin name/email who performed action
- Action type and target details
- IP address

**Frontend Location:** `/apps/web/src/app/[lang]/editor/dashboard/page.tsx:56-78`
**Current Status:** ❌ Using mock data
**Integration Difficulty:** 🟢 Easy

---

#### 3. Pending Verifications
**Endpoint:** `GET /api/editor/verifications`
**Returns:**
- Combined list of business and individual verification requests
- Sorted by creation date
- Includes user details

**Frontend Use:** Badge counts in sidebar/quick actions
**Current Status:** ❌ Using hardcoded badge values
**Integration Difficulty:** 🟢 Easy

---

#### 4. Ads Management
**Endpoint:** `GET /api/editor/ads`
**Query Params:** `status`, `category`, `location`, `search`, `page`, `limit`
**Returns:**
- Paginated list of ads
- Filter by status (pending/approved/rejected)
- Search functionality

**Frontend Use:** Badge counts for pending ads
**Current Status:** ❌ Using hardcoded values
**Integration Difficulty:** 🟢 Easy

---

#### 5. User Management
**Endpoint:** `GET /api/editor/users`
**Returns:** List of users with filters

---

### ❌ Missing Backend Endpoints (Need to Create)

#### 1. My Work Reports Today ⚠️ HIGH PRIORITY
**Needed Endpoint:** `GET /api/editor/my-work-today`
**Should Return:**
```json
{
  "success": true,
  "data": {
    "adsApprovedToday": 48,
    "adsRejectedToday": 18,
    "adsEditedToday": 18,
    "businessVerificationsToday": 15,
    "individualVerificationsToday": 5
  }
}
```

**Frontend Location:** `/apps/web/src/app/[lang]/editor/dashboard/page.tsx:306-322`
**Current Status:** ❌ Hardcoded values
**Integration Difficulty:** 🟡 Medium (requires new endpoint)

**SQL Query Needed:**
```sql
SELECT
  -- Count ads approved today by this editor
  (SELECT COUNT(*) FROM ads
   WHERE reviewed_by = $editorId
   AND status = 'approved'
   AND DATE(reviewed_at) = CURRENT_DATE) as ads_approved_today,

  -- Count ads rejected today by this editor
  (SELECT COUNT(*) FROM ads
   WHERE reviewed_by = $editorId
   AND status = 'rejected'
   AND DATE(reviewed_at) = CURRENT_DATE) as ads_rejected_today,

  -- Count ads edited today by this editor (from activity logs)
  (SELECT COUNT(*) FROM admin_activity_logs
   WHERE admin_id = $editorId
   AND action_type = 'edit_ad'
   AND DATE(created_at) = CURRENT_DATE) as ads_edited_today,

  -- Count business verifications approved today
  (SELECT COUNT(*) FROM business_verification_requests
   WHERE reviewed_by = $editorId
   AND status = 'approved'
   AND DATE(reviewed_at) = CURRENT_DATE) as business_verifications_today,

  -- Count individual verifications approved today
  (SELECT COUNT(*) FROM individual_verification_requests
   WHERE reviewed_by = $editorId
   AND status = 'approved'
   AND DATE(reviewed_at) = CURRENT_DATE) as individual_verifications_today
```

---

#### 2. Notification Count
**Needed Endpoint:** `GET /api/editor/notifications/count`
**Should Return:**
```json
{
  "success": true,
  "data": {
    "count": 8
  }
}
```

**Frontend Location:** Header component - notification bell
**Current Status:** ❌ Hardcoded value (8)
**Integration Difficulty:** 🟡 Medium (requires notification system)

---

#### 3. System Alerts
**Needed Endpoint:** `GET /api/editor/alerts`
**Should Return:**
```json
{
  "success": true,
  "data": {
    "message": "5 urgent reports need attention",
    "type": "warning"
  }
}
```

**Frontend Location:** Header component - system alert banner
**Current Status:** ❌ Hardcoded
**Integration Difficulty:** 🟡 Medium

---

#### 4. Pending Tasks
**Needed Endpoint:** `GET /api/editor/pending-tasks`
**Should Return:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "scam_report",
      "title": "Urgent: Scam Report",
      "description": "User reported potential scam ad",
      "priority": "high",
      "createdAt": "2024-01-01T10:00:00Z",
      "category": "Electronics"
    }
  ]
}
```

**Frontend Location:** `/apps/web/src/app/[lang]/editor/dashboard/page.tsx:422-483`
**Current Status:** ❌ Hardcoded tasks
**Integration Difficulty:** 🟡 Medium

---

#### 5. Last Login Time
**Needed Endpoint:** `GET /api/editor/profile` or include in auth context
**Should Return:**
```json
{
  "success": true,
  "data": {
    "lastLoginAt": "2024-01-01T09:00:00Z"
  }
}
```

**Frontend Location:** `/apps/web/src/app/[lang]/editor/dashboard/page.tsx:332`
**Current Status:** ❌ Hardcoded "09:00AM"
**Integration Difficulty:** 🟢 Easy (can add to users table)

---

## Integration Priority Roadmap

### Phase 1: Quick Wins (Can Do Now)
1. ✅ Connect Dashboard Stats (`/api/editor/stats`)
2. ✅ Connect Activity Logs (`/api/editor/activity-logs`)
3. ✅ Connect Verifications for badge counts (`/api/editor/verifications`)
4. ✅ Connect Ads endpoint for badge counts (`/api/editor/ads`)

**Estimated Time:** 1-2 hours
**Impact:** High - Real data in stats cards and badges

---

### Phase 2: Create New Endpoints (Requires Backend Work)
1. 🔨 Create `/api/editor/my-work-today` endpoint
2. 🔨 Add `last_login_at` field to users table and update on login
3. 🔨 Create `/api/editor/notifications/count` endpoint
4. 🔨 Create `/api/editor/alerts` endpoint
5. 🔨 Create `/api/editor/pending-tasks` endpoint

**Estimated Time:** 3-4 hours
**Impact:** High - Complete real-time dashboard

---

### Phase 3: Real-time Updates (Optional Enhancement)
1. 📡 WebSocket or polling for live updates
2. 📡 Real-time notification system
3. 📡 Live activity feed

**Estimated Time:** 4-6 hours
**Impact:** Medium - Better UX

---

## Code Changes Required

### Frontend Changes

#### 1. Create API Service (`/apps/web/src/lib/editorApi.ts`)
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getEditorStats(token: string) {
  const response = await fetch(`${API_BASE}/api/editor/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function getEditorActivityLogs(token: string, page = 1, limit = 10) {
  const response = await fetch(
    `${API_BASE}/api/editor/activity-logs?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
}

export async function getMyWorkToday(token: string) {
  const response = await fetch(`${API_BASE}/api/editor/my-work-today`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// ... more functions
```

#### 2. Update Dashboard Page
Replace mock data in `loadDashboardData()` function with actual API calls.

---

### Backend Changes

#### 1. Create New Route: My Work Today
**File:** `/backend/routes/editor.js`

```javascript
// GET /api/editor/my-work-today
router.get('/my-work-today', catchAsync(async (req, res) => {
  const editorId = req.user.userId;

  const stats = await pool.query(`
    SELECT
      -- Ads approved today
      (SELECT COUNT(*) FROM ads
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as ads_approved_today,

      -- Ads rejected today
      (SELECT COUNT(*) FROM ads
       WHERE reviewed_by = $1
       AND status = 'rejected'
       AND DATE(reviewed_at) = CURRENT_DATE) as ads_rejected_today,

      -- Ads edited today (from activity logs)
      (SELECT COUNT(*) FROM admin_activity_logs
       WHERE admin_id = $1
       AND action_type = 'edit_ad'
       AND DATE(created_at) = CURRENT_DATE) as ads_edited_today,

      -- Business verifications today
      (SELECT COUNT(*) FROM business_verification_requests
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as business_verifications_today,

      -- Individual verifications today
      (SELECT COUNT(*) FROM individual_verification_requests
       WHERE reviewed_by = $1
       AND status = 'approved'
       AND DATE(reviewed_at) = CURRENT_DATE) as individual_verifications_today
  `, [editorId]);

  const result = stats.rows[0];

  res.json({
    success: true,
    data: {
      adsApprovedToday: parseInt(result.ads_approved_today),
      adsRejectedToday: parseInt(result.ads_rejected_today),
      adsEditedToday: parseInt(result.ads_edited_today),
      businessVerificationsToday: parseInt(result.business_verifications_today),
      individualVerificationsToday: parseInt(result.individual_verifications_today)
    }
  });
}));
```

#### 2. Add Last Login Tracking
**File:** `/backend/routes/adminAuth.js` (or auth route)

```javascript
// On successful login, update last_login_at
await pool.query(
  'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
  [user.id]
);
```

**Migration Needed:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
```

---

## Summary

### Can Connect Immediately (Existing APIs):
✅ Dashboard Stats
✅ Activity Logs
✅ Verification Counts
✅ Pending Ads Counts

### Need New Backend Endpoints:
❌ My Work Reports Today (High Priority)
❌ Notification Count
❌ System Alerts
❌ Pending Tasks
❌ Last Login Time

### Recommended Next Steps:
1. **Start with Phase 1** - Connect existing APIs (2 hours)
2. **Create "My Work Today" endpoint** - Most visible impact (1 hour)
3. **Add last login tracking** - Easy win (30 mins)
4. **Build remaining endpoints** as needed (3 hours)

**Total Estimated Time:** 6-7 hours for complete integration
