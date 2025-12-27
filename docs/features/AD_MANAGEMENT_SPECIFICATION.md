# Ad Management System - Complete Specification

**Last Updated:** December 11, 2024
**Status:** Ready for Implementation
**Page:** `/en/editor/ad-management`

---

## 📋 Overview

Unified ad management interface for editors to review, moderate, and manage all classified ads. Supports complete workflow from submission to approval/rejection with user feedback loop.

---

## 🎯 Actions by Ad State

| Ad State | Available Actions |
|----------|-------------------|
| **Pending** | ✅ Approve, ❌ Reject, ⏸️ Suspend, 🗑️ Delete, ❌ Delete Forever |
| **Approved** | ❌ Reject, ⏸️ Suspend, 🗑️ Delete, ❌ Delete Forever |
| **Rejected** | ✅ Approve, 🗑️ Delete, ❌ Delete Forever |
| **Suspended** | ✅ Approve, ▶️ Unsuspend, 🗑️ Delete, ❌ Delete Forever |
| **Deleted** | ♻️ Restore (brings back to approved), ❌ Delete Forever |

---

## 📑 Tab Order

**Order:** Pending → Approved → Rejected → Suspended → Deleted → All

```
[⏳ Pending] [✅ Approved] [❌ Rejected] [⏸️ Suspended] [🗑️ Deleted] [📊 All]
```

**Rationale:** Workflow-based order (new items first, completed items last)

---

## 🔄 User Workflow - Rejection & Resubmission

### Step 1: Editor Rejects Ad
```
Editor sees pending ad with issues
↓
Clicks "Reject" button
↓
Modal opens: Enter rejection reason
Example: "Please change category from 'Vehicles' to 'Mobile Phones'
         and remove image #3 (car picture)"
↓
Ad status: pending → rejected
User notified via dashboard
```

### Step 2: User Views Rejection
```
User logs in to dashboard
↓
Sees rejected ad with RED background
┌─────────────────────────────────────────────────┐
│ 🚫 REJECTED ADS                                 │
├─────────────────────────────────────────────────┤
│ iPhone 15 - NPR 50,000               [🔴 REJECTED] │
│                                                 │
│ 📝 Rejection Reason:                            │
│ "Please change category from 'Vehicles' to     │
│  'Mobile Phones' and remove image #3 (car pic)"│
│                                                 │
│ 📜 Rejection History: 2 previous rejections    │
│                                                 │
│ [📝 Edit & Resubmit] [🗑️ Delete]               │
└─────────────────────────────────────────────────┘
```

### Step 3: User Edits & Resubmits
```
User clicks "Edit & Resubmit"
↓
Edit page opens with rejection reason visible at top
↓
User fixes issues:
  - Changes category
  - Removes unwanted image
  - Updates any other fields
↓
User clicks "Resubmit for Review"
↓
Ad status: rejected → pending
Editor notified (appears in pending queue again)
```

### Step 4: Editor Reviews Again
```
Editor sees ad in pending queue
Badge shows: [📝 Resubmitted]
↓
View rejection history:
  "Dec 10: Wrong category → Fixed by user"
↓
Verify fixes are correct
↓
Approve ✅ or Reject again ❌ (with new reason)
```

---

## 📜 Rejection History Feature

### Display Format
```
📜 Review History:
┌─────────────────────────────────────────────────┐
│ Dec 11, 2024 10:30 AM - ❌ Rejected             │
│ By: Editor John (editor@thulobazaar.com)       │
│ Reason: "Wrong category - should be Mobiles"   │
│                                                 │
│ Dec 10, 2024 03:15 PM - ❌ Rejected             │
│ By: Editor Sarah (sarah@thulobazaar.com)       │
│ Reason: "Remove image #3 - unrelated product"  │
│                                                 │
│ Dec 10, 2024 02:00 PM - 📝 Resubmitted          │
│ By: User (user@example.com)                    │
│ Changes: "Fixed category, removed image"       │
│                                                 │
│ Dec 9, 2024 05:00 PM - ⏳ Submitted             │
│ By: User (user@example.com)                    │
└─────────────────────────────────────────────────┘
```

### Storage Requirements
- Store each status change as history entry
- Include: timestamp, actor (user/editor), action, reason/notes
- Display chronologically (newest first)
- Visible to both user and editor

---

## 🎨 UI Components

### 1. Tab Bar
```typescript
const tabs = [
  { key: 'pending', label: '⏳ Pending', color: 'yellow' },
  { key: 'approved', label: '✅ Approved', color: 'green' },
  { key: 'rejected', label: '❌ Rejected', color: 'red' },
  { key: 'suspended', label: '⏸️ Suspended', color: 'orange' },
  { key: 'deleted', label: '🗑️ Deleted', color: 'gray' },
  { key: 'all', label: '📊 All', color: 'blue' },
];
```

### 2. Action Buttons (Contextual)
```typescript
function getActionButtons(ad: Ad) {
  if (ad.deletedAt) {
    return ['restore', 'deletePermanent'];
  }

  switch (ad.status) {
    case 'pending':
      return ['approve', 'reject', 'suspend', 'delete', 'deletePermanent'];
    case 'approved':
      return ['reject', 'suspend', 'delete', 'deletePermanent'];
    case 'rejected':
      return ['approve', 'delete', 'deletePermanent'];
    case 'suspended':
      return ['approve', 'unsuspend', 'delete', 'deletePermanent'];
    default:
      return [];
  }
}
```

### 3. Modals

#### Reject Modal
```
┌──────────────────────────────────────┐
│ ❌ Reject Ad                          │
├──────────────────────────────────────┤
│ Ad: iPhone 15 - NPR 50,000          │
│                                      │
│ Rejection Reason: *                 │
│ ┌────────────────────────────────┐  │
│ │ Please specify why this ad is  │  │
│ │ being rejected...              │  │
│ │                                │  │
│ └────────────────────────────────┘  │
│                                      │
│ Common Reasons:                      │
│ ☐ Wrong category                    │
│ ☐ Inappropriate content             │
│ ☐ Spam                              │
│ ☐ Poor quality images               │
│ ☐ Incomplete information            │
│                                      │
│ [Cancel] [Confirm Rejection]         │
└──────────────────────────────────────┘
```

#### Suspend Modal
```
┌──────────────────────────────────────┐
│ ⏸️ Suspend Ad                         │
├──────────────────────────────────────┤
│ Ad: iPhone 15 - NPR 50,000          │
│                                      │
│ Suspension Reason: *                │
│ ┌────────────────────────────────┐  │
│ │ Why is this ad being suspended?│  │
│ │                                │  │
│ └────────────────────────────────┘  │
│                                      │
│ Suspension Duration:                │
│ ○ Until manually unsuspended        │
│ ○ 7 days                            │
│ ○ 30 days                           │
│ ○ Custom: [___] days                │
│                                      │
│ [Cancel] [Confirm Suspension]        │
└──────────────────────────────────────┘
```

#### Delete Forever Modal
```
┌──────────────────────────────────────┐
│ ⚠️ PERMANENT DELETE - CANNOT UNDO!   │
├──────────────────────────────────────┤
│ Ad: iPhone 15 - NPR 50,000          │
│                                      │
│ ⚠️ This will:                        │
│ • Delete all ad data                │
│ • Delete all images                 │
│ • Cannot be restored                │
│                                      │
│ Reason (for audit log):             │
│ ┌────────────────────────────────┐  │
│ │ Optional reason...             │  │
│ └────────────────────────────────┘  │
│                                      │
│ Type "DELETE" to confirm:           │
│ [____________]                       │
│                                      │
│ [Cancel] [DELETE FOREVER]            │
└──────────────────────────────────────┘
```

---

## 🔧 API Endpoints

### Get Ads (Updated)
```
GET /api/editor/ads?status={status}&includeDeleted={false|true|only}

Parameters:
- status: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
- includeDeleted: 'false' | 'true' | 'only'
  - 'false': Only non-deleted ads (default)
  - 'true': Include deleted ads
  - 'only': Only deleted ads
- limit: number (default: 20)
- offset: number (default: 0)

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "iPhone 15",
      "status": "pending",
      "statusReason": "Wrong category",
      "deletedAt": null,
      "reviewHistory": [
        {
          "date": "2024-12-11T10:30:00Z",
          "action": "rejected",
          "by": "editor@example.com",
          "reason": "Wrong category"
        }
      ],
      ...
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Approve Ad
```
PUT /api/editor/ads/:id/approve

Response:
{
  "success": true,
  "message": "Ad approved successfully",
  "data": { ... }
}
```

### Reject Ad
```
PUT /api/editor/ads/:id/reject

Body:
{
  "reason": "Please change category to 'Mobiles' and remove image #3"
}

Response:
{
  "success": true,
  "message": "Ad rejected successfully",
  "data": { ... }
}
```

### Suspend Ad
```
POST /api/editor/ads/:id/suspend

Body:
{
  "reason": "Spam content detected",
  "duration": 7 // days, optional
}

Response:
{
  "success": true,
  "message": "Ad suspended successfully",
  "data": { ... }
}
```

### Unsuspend Ad
```
POST /api/editor/ads/:id/unsuspend

Response:
{
  "success": true,
  "message": "Ad unsuspended successfully",
  "data": { ... }
}
```

### Soft Delete Ad
```
DELETE /api/editor/ads/:id

Body:
{
  "reason": "Violates terms of service"
}

Response:
{
  "success": true,
  "message": "Ad deleted successfully (can be restored)",
  "data": { ... }
}
```

### Restore Ad
```
POST /api/editor/ads/:id/restore

Response:
{
  "success": true,
  "message": "Ad restored successfully",
  "data": { ... }
}
```

### Permanent Delete
```
DELETE /api/editor/ads/:id/permanent

Body:
{
  "reason": "Illegal content" // optional, for audit log
}

Response:
{
  "success": true,
  "message": "Ad permanently deleted. This action cannot be undone.",
  "data": {
    "id": 1,
    "title": "..."
  }
}
```

---

## 🗄️ Database Schema

### Existing Fields (ads table)
```sql
- id
- title
- status ('pending' | 'approved' | 'rejected' | 'suspended')
- status_reason (rejection/suspension reason)
- reviewed_by (editor user_id)
- reviewed_at (timestamp)
- deleted_at (soft delete timestamp)
- deleted_by (who deleted it)
- deletion_reason
```

### New Table: ad_review_history
```sql
CREATE TABLE ad_review_history (
  id SERIAL PRIMARY KEY,
  ad_id INT NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'submitted', 'approved', 'rejected', 'suspended', 'unsuspended', 'deleted', 'restored'
  actor_id INT NOT NULL REFERENCES users(id),
  actor_type VARCHAR(20) NOT NULL, -- 'user', 'editor', 'admin'
  reason TEXT, -- rejection/suspension reason
  notes TEXT, -- additional notes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ad_review_history_ad_id ON ad_review_history(ad_id);
```

---

## 📱 User Dashboard Updates

### My Ads Page - Add Rejected Section
```typescript
// Add to user dashboard
<section className="rejected-ads">
  <h2>🚫 Rejected Ads</h2>
  {rejectedAds.map(ad => (
    <div key={ad.id} className="ad-card rejected">
      <div className="ad-header">
        <h3>{ad.title}</h3>
        <span className="status-badge rejected">REJECTED</span>
      </div>

      <div className="rejection-reason">
        <strong>📝 Rejection Reason:</strong>
        <p>{ad.statusReason}</p>
      </div>

      <div className="rejection-history">
        <button onClick={() => toggleHistory(ad.id)}>
          📜 View Rejection History ({ad.reviewHistory.length})
        </button>
      </div>

      <div className="actions">
        <button onClick={() => editAndResubmit(ad.id)}>
          📝 Edit & Resubmit
        </button>
        <button onClick={() => deleteAd(ad.id)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  ))}
</section>
```

### Edit Page - Show Rejection Reason
```typescript
// At top of edit form
{ad.status === 'rejected' && (
  <div className="rejection-notice">
    <h3>⚠️ This ad was rejected. Please fix the following issues:</h3>
    <div className="reason-box">
      {ad.statusReason}
    </div>

    <details>
      <summary>📜 View Full Rejection History</summary>
      <ul>
        {ad.reviewHistory.map(entry => (
          <li key={entry.id}>
            <strong>{formatDate(entry.createdAt)}</strong> -
            {entry.action} by {entry.actorEmail}
            {entry.reason && <p>Reason: {entry.reason}</p>}
          </li>
        ))}
      </ul>
    </details>
  </div>
)}
```

---

## 🎯 Implementation Checklist

### Phase 1: Backend Updates
- [ ] Update GET /api/editor/ads to support new filters
- [ ] Add includeDeleted='only' support
- [ ] Create ad_review_history table
- [ ] Add logging to all status change endpoints
- [ ] Add POST /api/editor/ads/:id/unsuspend endpoint
- [ ] Update rejection endpoint to log history
- [ ] Add suspension duration support (optional)

### Phase 2: Editor Dashboard
- [ ] Update ad-management page with 6 tabs
- [ ] Reorder tabs: Pending → Approved → Rejected → Suspended → Deleted → All
- [ ] Add contextual action buttons based on ad state
- [ ] Create Suspend modal with reason
- [ ] Update Delete Forever modal with confirmation
- [ ] Show rejection history in ad details
- [ ] Add "Resubmitted" badge for resubmitted ads
- [ ] Add filters and search functionality

### Phase 3: User Dashboard
- [ ] Add "Rejected Ads" section
- [ ] Style rejected ads with red background
- [ ] Display rejection reason prominently
- [ ] Add "Edit & Resubmit" button
- [ ] Show rejection history (expandable)
- [ ] Update edit page to show rejection notice at top

### Phase 4: Notifications
- [ ] Email user when ad is rejected (with reason)
- [ ] Email user when ad is approved
- [ ] Email user when ad is suspended
- [ ] In-app notifications for all status changes

### Phase 5: Testing
- [ ] Test complete rejection → edit → resubmit → approve flow
- [ ] Test all action buttons for each status
- [ ] Test rejection history display
- [ ] Test permanent delete confirmation
- [ ] Test suspension with duration
- [ ] Test filters and search

---

## 🔐 Permissions

| Action | Editor | Super Admin | Notes |
|--------|--------|-------------|-------|
| View all ads | ✅ | ✅ | |
| Approve ad | ✅ | ✅ | |
| Reject ad | ✅ | ✅ | Must provide reason |
| Suspend ad | ✅ | ✅ | Must provide reason |
| Unsuspend ad | ✅ | ✅ | |
| Soft delete | ✅ | ✅ | Can be restored |
| Permanent delete | ⚠️ | ✅ | Super admin only (configurable) |
| Restore ad | ✅ | ✅ | |

---

## 📊 Analytics & Metrics

Track these metrics:
- Rejection rate by category
- Average time to approve
- Most common rejection reasons
- Resubmission success rate
- Editor activity (approvals/rejections per day)

---

## 🎨 Design Notes

### Color Coding
- **Pending:** Yellow/Orange (#FFA500)
- **Approved:** Green (#22C55E)
- **Rejected:** Red (#EF4444)
- **Suspended:** Orange (#F97316)
- **Deleted:** Gray (#6B7280)

### Icons
- ⏳ Pending
- ✅ Approved
- ❌ Rejected
- ⏸️ Suspended
- 🗑️ Deleted
- 📊 All
- 📝 Edit/Resubmit
- ♻️ Restore
- 👁️ View
- 📜 History

---

## 🚀 Future Enhancements (Optional)

1. **Bulk Actions:** Approve/reject multiple ads at once
2. **Templates:** Pre-written rejection reasons
3. **Auto-suspend:** Automatic suspension based on reports
4. **Appeals:** Users can appeal rejections
5. **Collaboration:** Multiple editors can comment on ads
6. **AI Assistance:** Auto-detect wrong categories/spam
7. **Scheduled Publishing:** Approve but publish later
8. **Ad Quality Score:** Rate ads and show to editors

---

## 📝 Notes

- Keep rejection reasons clear and actionable
- Show empathy in rejection messages
- Make it easy for users to fix and resubmit
- Track all actions for accountability
- Balance speed with quality in moderation

---

**End of Specification**
