'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getVerifications,
  approveBusinessVerification,
  rejectBusinessVerification,
} from '@/lib/editorApi';
import type { BusinessVerification, TabStatus } from './types';

export function useBusinessVerificationPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<BusinessVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<BusinessVerification | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');

  const handleLogout = useCallback(async () => {
    await logout();
    router.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  const loadVerifications = useCallback(async () => {
    try {
      setLoading(true);
      // Search is server-side (all records), committed only on an explicit submit
      const response = await getVerifications(activeTab, 'business', undefined, undefined, undefined, searchTerm || undefined);

      if (response.success && Array.isArray(response.data)) {
        const businessVerifications = response.data.map((v: any) => ({
          id: v.id,
          userId: v.userId,
          email: v.email || '',
          fullName: v.fullName || '',
          businessName: v.businessName || '',
          businessLicense: v.businessLicenseDocument,
          documentType: v.documentType,
          documentNumber: v.documentNumber,
          paymentReference: v.paymentReference,
          paymentAmount: v.paymentAmount,
          paymentStatus: v.paymentStatus,
          durationDays: v.durationDays,
          status: v.status,
          submittedAt: v.createdAt,
          type: v.type,
          shopSlug: v.shopSlug,
          rejectionReason: v.rejectionReason,
          reviewedAt: v.reviewedAt,
          reviewedByName: v.reviewedByName,
          reviewedByRole: v.reviewedByRole,
        }));
        setVerifications(businessVerifications);
      } else {
        setVerifications([]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
    loadVerifications();
  }, [authLoading, staff, isEditor, lang, router, loadVerifications]);

  const handleApprove = async (verificationId: number) => {
    if (!confirm('Are you sure you want to approve this business verification?')) return;

    try {
      setActionLoading(true);
      const response = await approveBusinessVerification(verificationId);

      if (response.success) {
        alert('Business verification approved successfully!');
        loadVerifications();
        setSelectedVerification(null);
      } else {
        alert('Failed to approve verification');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      alert('Error approving verification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const response = await rejectBusinessVerification(selectedVerification.id, rejectReason);

      if (response.success) {
        alert('Business verification rejected successfully!');
        setShowRejectModal(false);
        setRejectReason('');
        loadVerifications();
        setSelectedVerification(null);
      } else {
        alert('Failed to reject verification');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      alert('Error rejecting verification');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (verification: BusinessVerification) => {
    setSelectedVerification(verification);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedVerification(null);
  };

  return {
    staff,
    authLoading,
    loading,
    verifications,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedVerification,
    showRejectModal,
    rejectReason,
    setRejectReason,
    actionLoading,
    handleLogout,
    handleApprove,
    handleReject,
    openRejectModal,
    closeRejectModal,
  };
}
