'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import {
  getVerifications,
  approveIndividualVerification,
  rejectIndividualVerification,
} from '@/lib/editorApi';
import type { IndividualVerification, TabStatus } from './types';

export function useIndividualVerificationPage(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const [verifications, setVerifications] = useState<IndividualVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<IndividualVerification | null>(null);
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
      const response = await getVerifications(activeTab, 'individual');

      if (response.success && Array.isArray(response.data)) {
        const individualVerifications = response.data.map((v: any) => ({
          id: v.id,
          userId: v.userId,
          email: v.email || '',
          fullName: v.fullName || '',
          verifiedSellerName: v.verifiedSellerName,
          phone: v.phone,
          location: v.location,
          status: v.status,
          submittedAt: v.createdAt,
          type: v.type,
          shopSlug: v.shopSlug,
          durationDays: v.durationDays,
          paymentAmount: v.paymentAmount,
          paymentReference: v.paymentReference,
          paymentStatus: v.paymentStatus,
          idDocumentType: v.idDocumentType,
          idDocumentNumber: v.idDocumentNumber,
          idDocumentFront: v.idDocumentFront,
          idDocumentBack: v.idDocumentBack,
          selfieWithId: v.selfieWithId,
          rejectionReason: v.rejectionReason,
        }));
        setVerifications(individualVerifications);
      } else {
        setVerifications([]);
      }
    } catch (error) {
      console.error('Error loading verifications:', error);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router.push(`/${lang}/editor/login`);
      return;
    }
    loadVerifications();
  }, [authLoading, staff, isEditor, lang, router, loadVerifications]);

  const handleApprove = async (verificationId: number) => {
    if (!confirm('Are you sure you want to approve this individual verification?')) return;

    try {
      setActionLoading(true);
      const response = await approveIndividualVerification(verificationId);

      if (response.success) {
        alert('Individual verification approved successfully!');
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
      const response = await rejectIndividualVerification(selectedVerification.id, rejectReason);

      if (response.success) {
        alert('Individual verification rejected successfully!');
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

  const filteredVerifications = verifications.filter((v) =>
    searchTerm
      ? v.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.verifiedSellerName?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  const openRejectModal = (verification: IndividualVerification) => {
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
    verifications: filteredVerifications,
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
