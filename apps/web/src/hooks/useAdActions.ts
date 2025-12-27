import { useState } from 'react';
import {
  approveAd,
  rejectAd,
  deleteAd,
  suspendAd,
  unsuspendAd,
  permanentDeleteAd,
  restoreAd,
} from '@/lib/editorApi';

export function useAdActions(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async (adId: number) => {
    if (!confirm('Are you sure you want to approve this ad?')) return;

    try {
      setLoading(true);
      const response = await approveAd(adId);

      if (response.success) {
        alert('Ad approved successfully!');
        onSuccess?.();
      } else {
        alert('Failed to approve ad');
      }
    } catch (error) {
      console.error('Error approving ad:', error);
      alert('Error approving ad');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (adId: number, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      const response = await rejectAd(adId, reason);

      if (response.success) {
        alert('Ad rejected successfully!');
        onSuccess?.();
      } else {
        alert('Failed to reject ad');
      }
    } catch (error) {
      console.error('Error rejecting ad:', error);
      alert('Error rejecting ad');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (adId: number, reason: string, duration?: number) => {
    if (!reason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }

    try {
      setLoading(true);
      const response = await suspendAd(adId, reason, duration);

      if (response.success) {
        alert('Ad suspended successfully!');
        onSuccess?.();
      } else {
        alert('Failed to suspend ad: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error suspending ad:', error);
      alert('Error suspending ad');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async (adId: number) => {
    if (!confirm('Are you sure you want to unsuspend this ad?')) return;

    try {
      setLoading(true);
      const response = await unsuspendAd(adId);

      if (response.success) {
        alert('Ad unsuspended successfully!');
        onSuccess?.();
      } else {
        alert('Failed to unsuspend ad');
      }
    } catch (error) {
      console.error('Error unsuspending ad:', error);
      alert('Error unsuspending ad');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (adId: number) => {
    if (!confirm('Are you sure you want to restore this ad?')) return;

    try {
      setLoading(true);
      const response = await restoreAd(adId);

      if (response.success) {
        alert('Ad restored successfully!');
        onSuccess?.();
      } else {
        alert('Failed to restore ad');
      }
    } catch (error) {
      console.error('Error restoring ad:', error);
      alert('Error restoring ad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adId: number) => {
    if (!confirm('Are you sure you want to soft delete this ad? It can be restored later.')) return;

    try {
      setLoading(true);
      const response = await deleteAd(adId, 'Deleted by editor');

      if (response.success) {
        alert('Ad deleted successfully!');
        onSuccess?.();
      } else {
        alert('Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (adId: number, reason?: string) => {
    try {
      setLoading(true);
      const response = await permanentDeleteAd(adId, reason);

      if (response.success) {
        alert('Ad permanently deleted!');
        onSuccess?.();
      } else {
        alert('Failed to permanently delete ad');
      }
    } catch (error) {
      console.error('Error permanently deleting ad:', error);
      alert('Error permanently deleting ad');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleApprove,
    handleReject,
    handleSuspend,
    handleUnsuspend,
    handleRestore,
    handleDelete,
    handlePermanentDelete,
  };
}
