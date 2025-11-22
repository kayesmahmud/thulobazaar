/**
 * ContactSellerButton Component
 * Allows users to start a conversation with an ad seller
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useBackendToken } from '@/hooks/useBackendToken';
import { messagingApi } from '@/lib/messagingApi';

interface ContactSellerButtonProps {
  sellerId: number;
  sellerName?: string;
  adId?: number;
  adTitle?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function ContactSellerButton({
  sellerId,
  sellerName,
  adId,
  adTitle,
  className = '',
  variant = 'primary',
}: ContactSellerButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { backendToken } = useBackendToken();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContactSeller = async () => {
    // Check if user is logged in
    if (!session) {
      router.push('/auth/signin?redirect=/messages');
      return;
    }

    // Check if trying to message themselves
    if (session.user?.id && parseInt(session.user.id) === sellerId) {
      setError('You cannot message yourself');
      return;
    }

    // Check if we have a backend token
    if (!backendToken) {
      setError('Please refresh the page and try again');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Start or get conversation
      const response = await messagingApi.startConversation(backendToken, {
        userId: sellerId,
        adId,
      });

      const conversationId = response.data.id;

      // Redirect to messages page with conversation selected
      router.push(`/messages?conversation=${conversationId}`);
    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      setError(err.message || 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  return (
    <div>
      <button
        onClick={handleContactSeller}
        disabled={loading}
        className={`
          px-6 py-3 rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
          ${buttonStyles[variant]}
          ${className}
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Starting conversation...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Contact {sellerName || 'Seller'}</span>
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
