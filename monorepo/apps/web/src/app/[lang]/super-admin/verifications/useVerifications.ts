'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { Verification, SuspendedUser, VerificationStats } from './types';

export function useVerifications() {
  const [pendingVerifications, setPendingVerifications] = useState<Verification[]>([]);
  const [verifiedBusiness, setVerifiedBusiness] = useState<Verification[]>([]);
  const [verifiedIndividual, setVerifiedIndividual] = useState<Verification[]>([]);
  const [suspendedRejected, setSuspendedRejected] = useState<SuspendedUser[]>([]);
  const [verificationStats, setVerificationStats] = useState<VerificationStats>({
    pending: 0,
    verifiedBusiness: 0,
    verifiedIndividual: 0,
    suspendedRejected: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchVerificationStats = async () => {
    const res = await fetch('/api/super-admin/verification-stats', {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
    return res.json();
  };

  const fetchVerifiedList = async (type: 'business' | 'individual', searchQuery: string) => {
    const query = searchQuery ? `?type=${type}&search=${encodeURIComponent(searchQuery)}` : `?type=${type}`;
    const res = await fetch(`/api/super-admin/verification-list${query}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`List fetch failed: ${res.status}`);
    return res.json();
  };

  const loadData = useCallback(async (searchQuery: string = '') => {
    try {
      setLoading(true);
      console.log('🔍 Loading verification data...');

      const results = await Promise.allSettled([
        fetchVerificationStats(),
        apiClient.getVerificationsByStatus('pending', 'all'),
        fetchVerifiedList('business', searchQuery),
        fetchVerifiedList('individual', searchQuery),
        apiClient.getSuspendedRejectedUsers({ limit: 100 }),
      ]);

      // Handle verification stats
      if (results[0].status === 'fulfilled') {
        const statsRes = results[0].value as any;
        if (statsRes?.success && statsRes.data) {
          setVerificationStats(statsRes.data);
        }
      } else {
        console.error('❌ Verification stats error:', results[0].reason);
      }

      // Handle pending verifications
      if (results[1].status === 'fulfilled') {
        const pendingRes = results[1].value;
        console.log('✅ Pending:', pendingRes);
        if (pendingRes.success && pendingRes.data) {
          setPendingVerifications(pendingRes.data.map((item: any) => ({
            ...item,
            type: item.business_name ? 'business' : 'individual',
          })));
        }
      } else {
        console.error('❌ Pending error:', results[1].reason);
      }

      // Handle business verifications
      if (results[2].status === 'fulfilled') {
        const businessRes = results[2].value as any;
        console.log('✅ Business:', businessRes);
        if (businessRes?.success && businessRes.data) {
          setVerifiedBusiness(
            businessRes.data.map((item: any) => ({
              ...item,
              type: 'business',
            }))
          );
        }
      } else {
        console.error('❌ Business error:', results[2].reason);
      }

      // Handle individual verifications
      if (results[3].status === 'fulfilled') {
        const individualRes = results[3].value as any;
        console.log('✅ Individual:', individualRes);
        if (individualRes?.success && individualRes.data) {
          setVerifiedIndividual(
            individualRes.data.map((item: any) => ({
              ...item,
              type: 'individual',
            }))
          );
        }
      } else {
        console.error('❌ Individual error:', results[3].reason);
      }

      // Handle suspended/rejected users
      if (results[4].status === 'fulfilled') {
        const suspendedRes = results[4].value;
        console.log('✅ Suspended:', suspendedRes);
        if (suspendedRes.success && suspendedRes.data) {
          setSuspendedRejected(suspendedRes.data);
        }
      } else {
        console.error('❌ Suspended error:', results[4].reason);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error loading verifications:', error);
      setLoading(false);
    }
  }, []);

  return {
    pendingVerifications,
    verifiedBusiness,
    verifiedIndividual,
    suspendedRejected,
    verificationStats,
    loading,
    loadData,
  };
}
