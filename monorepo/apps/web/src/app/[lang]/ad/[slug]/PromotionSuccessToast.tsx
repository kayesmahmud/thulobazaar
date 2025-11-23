'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/Toast';

interface PromotionSuccessToastProps {
  promoted: boolean;
  txnId?: string;
}

export default function PromotionSuccessToast({ promoted, txnId }: PromotionSuccessToastProps) {
  const { success } = useToast();

  useEffect(() => {
    if (promoted) {
      success(
        txnId
          ? `Promotion Activated Successfully! Transaction ID: ${txnId}`
          : 'Promotion Activated Successfully!'
      );
    }
  }, [promoted, txnId, success]);

  return null;
}
