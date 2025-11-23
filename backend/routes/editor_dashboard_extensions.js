// Additional editor endpoints for dashboard
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { requireEditor } = require('../middleware/editorAuth');
const { catchAsync } = require('../middleware/errorHandler');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireEditor);

// Get user reports count (reports about problematic users)
router.get('/user-reports/count', catchAsync(async (req, res) => {
  // Count users with issues: suspended or rejected verifications
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM users
    WHERE (is_suspended = true AND (suspended_until IS NULL OR suspended_until > NOW()))
       OR (business_verification_status = 'rejected')
  `);

  res.json({
    success: true,
    data: {
      count: parseInt(result.rows[0].count)
    }
  });
}));

// Get urgent notifications/alerts count
router.get('/notifications/count', catchAsync(async (req, res) => {
  // Count various urgent items that need attention
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM ad_reports WHERE status = 'pending' AND reason IN ('scam', 'fraud')) as urgent_reports,
      (SELECT COUNT(*) FROM ads WHERE status = 'pending' AND created_at < NOW() - INTERVAL '3 days') as old_pending_ads,
      (SELECT COUNT(*) FROM users WHERE business_verification_status = 'pending' AND created_at < NOW() - INTERVAL '7 days') as old_verifications
  `);

  const row = result.rows[0];
  const totalNotifications = parseInt(row.urgent_reports || 0) +
                             parseInt(row.old_pending_ads || 0) +
                             parseInt(row.old_verifications || 0);

  res.json({
    success: true,
    data: {
      count: totalNotifications,
      breakdown: {
        urgentReports: parseInt(row.urgent_reports || 0),
        oldPendingAds: parseInt(row.old_pending_ads || 0),
        oldVerifications: parseInt(row.old_verifications || 0)
      }
    }
  });
}));

// Get system alerts for dashboard
router.get('/system-alerts', catchAsync(async (req, res) => {
  // Check for various urgent conditions
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM ad_reports WHERE status = 'pending' AND reason IN ('scam', 'fraud')) as scam_reports,
      (SELECT COUNT(*) FROM ads WHERE status = 'pending' AND created_at < NOW() - INTERVAL '2 days') as old_pending_ads,
      (SELECT COUNT(*) FROM users WHERE business_verification_status = 'pending' AND created_at < NOW() - INTERVAL '5 days') as old_verifications
  `);

  const row = result.rows[0];
  const alerts = [];

  // Add alerts based on conditions
  const scamCount = parseInt(row.scam_reports || 0);
  const oldAdsCount = parseInt(row.old_pending_ads || 0);
  const oldVerificationsCount = parseInt(row.old_verifications || 0);

  if (scamCount > 0) {
    alerts.push({
      message: `${scamCount} scam/fraud ${scamCount === 1 ? 'report' : 'reports'} need immediate attention`,
      type: 'danger',
      count: scamCount
    });
  }

  if (oldAdsCount > 0) {
    alerts.push({
      message: `${oldAdsCount} ${oldAdsCount === 1 ? 'ad has' : 'ads have'} been pending for 2+ days`,
      type: 'warning',
      count: oldAdsCount
    });
  }

  if (oldVerificationsCount > 0) {
    alerts.push({
      message: `${oldVerificationsCount} ${oldVerificationsCount === 1 ? 'verification' : 'verifications'} pending for 5+ days`,
      type: 'warning',
      count: oldVerificationsCount
    });
  }

  res.json({
    success: true,
    data: alerts.length > 0 ? alerts[0] : null // Return most urgent alert
  });
}));

// Get average response time
router.get('/avg-response-time', catchAsync(async (req, res) => {
  // Calculate average time between submission and review for items reviewed in last 30 days
  const result = await pool.query(`
    SELECT
      -- Average response time for ads (in hours)
      (SELECT EXTRACT(EPOCH FROM AVG(reviewed_at - created_at)) / 3600
       FROM ads
       WHERE reviewed_at IS NOT NULL
         AND reviewed_at >= NOW() - INTERVAL '30 days') as ads_avg_hours,

      -- Average response time for business verifications (in hours)
      (SELECT EXTRACT(EPOCH FROM AVG(
        CASE
          WHEN business_verification_status IN ('approved', 'rejected')
          THEN updated_at - created_at
        END
      )) / 3600
       FROM users
       WHERE business_verification_status IN ('approved', 'rejected')
         AND updated_at >= NOW() - INTERVAL '30 days') as verification_avg_hours
  `);

  const row = result.rows[0];
  const adsAvg = parseFloat(row.ads_avg_hours || 0);
  const verificationAvg = parseFloat(row.verification_avg_hours || 0);

  // Calculate combined average (weighted by volume)
  const combinedAvg = (adsAvg + verificationAvg) / 2;

  // Format to human-readable string
  let formattedTime = 'N/A';
  if (combinedAvg > 0) {
    if (combinedAvg < 1) {
      formattedTime = `${Math.round(combinedAvg * 60)}m`;
    } else if (combinedAvg < 24) {
      formattedTime = `${combinedAvg.toFixed(1)}h`;
    } else {
      formattedTime = `${(combinedAvg / 24).toFixed(1)}d`;
    }
  }

  res.json({
    success: true,
    data: {
      avgResponseTime: formattedTime,
      breakdown: {
        adsAvgHours: adsAvg,
        verificationAvgHours: verificationAvg,
        combinedAvgHours: combinedAvg
      }
    }
  });
}));

// Get trends (percentage changes)
router.get('/trends', catchAsync(async (req, res) => {
  // Compare current pending counts with counts from 7 days ago
  const result = await pool.query(`
    SELECT
      -- Current pending ads count
      (SELECT COUNT(*) FROM ads WHERE status = 'pending') as current_pending_ads,

      -- Pending ads count 7 days ago (ads that were pending at that time)
      (SELECT COUNT(*) FROM ads
       WHERE status = 'pending'
         AND created_at <= NOW() - INTERVAL '7 days') as past_pending_ads,

      -- Current pending verifications count
      (SELECT COUNT(*) FROM users WHERE business_verification_status = 'pending') as current_pending_verifications,

      -- Pending verifications count 7 days ago
      (SELECT COUNT(*) FROM users
       WHERE business_verification_status = 'pending'
         AND created_at <= NOW() - INTERVAL '7 days') as past_pending_verifications
  `);

  const row = result.rows[0];
  const currentPendingAds = parseInt(row.current_pending_ads || 0);
  const pastPendingAds = parseInt(row.past_pending_ads || 0);
  const currentPendingVerifications = parseInt(row.current_pending_verifications || 0);
  const pastPendingVerifications = parseInt(row.past_pending_verifications || 0);

  // Calculate percentage changes
  let pendingAdsChange = 0;
  if (pastPendingAds > 0) {
    pendingAdsChange = ((currentPendingAds - pastPendingAds) / pastPendingAds) * 100;
  } else if (currentPendingAds > 0) {
    pendingAdsChange = 100; // New items, 100% increase
  }

  let verificationsChange = 0;
  if (pastPendingVerifications > 0) {
    verificationsChange = ((currentPendingVerifications - pastPendingVerifications) / pastPendingVerifications) * 100;
  } else if (currentPendingVerifications > 0) {
    verificationsChange = 100;
  }

  // Format as strings with +/- sign
  const formatChange = (change) => {
    if (change === 0) return '0%';
    const sign = change > 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  };

  res.json({
    success: true,
    data: {
      pendingChange: formatChange(pendingAdsChange),
      verificationsChange: formatChange(verificationsChange),
      breakdown: {
        currentPendingAds,
        pastPendingAds,
        pendingAdsChangePercent: pendingAdsChange,
        currentPendingVerifications,
        pastPendingVerifications,
        verificationsChangePercent: verificationsChange
      }
    }
  });
}));

// Get support chat count (unresolved messages/tickets)
router.get('/support-chat/count', catchAsync(async (req, res) => {
  // For now, we'll count pending ad reports that might need support response
  // In the future, this can be replaced with actual support chat/ticket system
  const result = await pool.query(`
    SELECT COUNT(*) as count
    FROM ad_reports
    WHERE status = 'pending'
      AND (admin_notes IS NULL OR admin_notes = '')
  `);

  res.json({
    success: true,
    data: {
      count: parseInt(result.rows[0].count || 0)
    }
  });
}));

// Get user reports trend (new reports today)
router.get('/user-reports/trend', catchAsync(async (req, res) => {
  // Count user reports created today (suspended users or rejected verifications)
  const result = await pool.query(`
    SELECT
      -- Users suspended today
      (SELECT COUNT(*) FROM users
       WHERE is_suspended = true
         AND updated_at >= CURRENT_DATE) as suspended_today,

      -- Business verifications rejected today
      (SELECT COUNT(*) FROM users
       WHERE business_verification_status = 'rejected'
         AND updated_at >= CURRENT_DATE) as rejected_today
  `);

  const row = result.rows[0];
  const suspendedToday = parseInt(row.suspended_today || 0);
  const rejectedToday = parseInt(row.rejected_today || 0);
  const totalNewToday = suspendedToday + rejectedToday;

  res.json({
    success: true,
    data: {
      newToday: totalNewToday,
      formattedText: totalNewToday > 0 ? `${totalNewToday} new today` : 'No new reports',
      breakdown: {
        suspendedToday,
        rejectedToday
      }
    }
  });
}));

// Get average response time trend (improvement percentage)
router.get('/avg-response-time/trend', catchAsync(async (req, res) => {
  // Compare current 7-day avg response time with previous 7-day period
  const result = await pool.query(`
    SELECT
      -- Current period (last 7 days) average response time in hours
      (SELECT EXTRACT(EPOCH FROM AVG(reviewed_at - created_at)) / 3600
       FROM ads
       WHERE reviewed_at IS NOT NULL
         AND reviewed_at >= NOW() - INTERVAL '7 days') as current_avg_hours,

      -- Previous period (7-14 days ago) average response time in hours
      (SELECT EXTRACT(EPOCH FROM AVG(reviewed_at - created_at)) / 3600
       FROM ads
       WHERE reviewed_at IS NOT NULL
         AND reviewed_at >= NOW() - INTERVAL '14 days'
         AND reviewed_at < NOW() - INTERVAL '7 days') as previous_avg_hours
  `);

  const row = result.rows[0];
  const currentAvg = parseFloat(row.current_avg_hours || 0);
  const previousAvg = parseFloat(row.previous_avg_hours || 0);

  let improvementPercent = 0;
  let formattedText = 'No change';

  if (previousAvg > 0 && currentAvg > 0) {
    // Calculate improvement (negative means faster response time = better)
    improvementPercent = ((currentAvg - previousAvg) / previousAvg) * 100;

    if (improvementPercent < -5) {
      formattedText = `Improved ${Math.abs(Math.round(improvementPercent))}%`;
    } else if (improvementPercent > 5) {
      formattedText = `Slower by ${Math.round(improvementPercent)}%`;
    } else {
      formattedText = 'Stable';
    }
  }

  res.json({
    success: true,
    data: {
      improvementPercent: Math.round(improvementPercent),
      formattedText,
      isImproved: improvementPercent < 0, // Negative is good (faster response)
      breakdown: {
        currentAvgHours: currentAvg,
        previousAvgHours: previousAvg
      }
    }
  });
}));

// Get list of problematic users (user reports)
router.get('/user-reports/list', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, type = 'all', search = '' } = req.query;
  const offset = (page - 1) * limit;

  // Build WHERE clause based on filters
  let whereConditions = [];
  let params = [];
  let paramCount = 1;

  // Filter by type
  if (type === 'suspended') {
    whereConditions.push(`u.is_suspended = true`);
    whereConditions.push(`(u.suspended_until IS NULL OR u.suspended_until > NOW())`);
  } else if (type === 'rejected') {
    whereConditions.push(`u.business_verification_status = 'rejected'`);
  } else {
    // 'all' - show both suspended and rejected
    whereConditions.push(`(
      (u.is_suspended = true AND (u.suspended_until IS NULL OR u.suspended_until > NOW()))
      OR u.business_verification_status = 'rejected'
    )`);
  }

  // Search filter
  if (search) {
    whereConditions.push(`(
      u.full_name ILIKE $${paramCount} OR
      u.email ILIKE $${paramCount} OR
      u.phone ILIKE $${paramCount}
    )`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total count
  const countResult = await pool.query(`
    SELECT COUNT(*) as total
    FROM users u
    ${whereClause}
  `, params);

  const totalCount = parseInt(countResult.rows[0].total);

  // Get paginated results
  params.push(limit);
  params.push(offset);

  const result = await pool.query(`
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.is_suspended,
      u.suspended_at,
      u.suspended_until,
      u.suspension_reason,
      u.business_verification_status,
      u.business_verification_reason,
      u.created_at,
      u.shop_slug,
      suspender.full_name as suspended_by_name,
      (SELECT COUNT(*) FROM ads WHERE user_id = u.id AND deleted_at IS NULL) as ad_count
    FROM users u
    LEFT JOIN users suspender ON u.suspended_by = suspender.id
    ${whereClause}
    ORDER BY
      CASE
        WHEN u.is_suspended THEN u.suspended_at
        WHEN u.business_verification_status = 'rejected' THEN u.updated_at
        ELSE u.created_at
      END DESC
    LIMIT $${paramCount} OFFSET $${paramCount + 1}
  `, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}));

module.exports = router;
