/**
 * SendMessageButton - Create conversation from ad detail page
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { messagingApi } from '@/lib/messagingApi';

interface SendMessageButtonProps {
  sellerId: number;
  adId: number;
  adTitle: string;
  lang: string;
}

export default function SendMessageButton({ sellerId, adId, adTitle, lang }: SendMessageButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!session) {
      // Redirect to login
      router.push(`/${lang}/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Following best practice: Log first, then access (complete_claude_guide.md Rule #2)
    console.log('🔍 Full session object:', session);
    console.log('🔍 Session keys:', Object.keys(session));
    console.log('🔍 Session.user:', session.user);

    // Try different possible token locations
    const token = (session as any).backendToken || (session as any).token || (session as any).accessToken;
    const currentUserId = session.user?.id;

    if (!token) {
      console.error('❌ No token found in session. Available keys:', Object.keys(session));
      setError('Authentication token not found. Please login again.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check if trying to message yourself
    if (String(currentUserId) === String(sellerId)) {
      setError('You cannot send a message to yourself');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create or get existing conversation
      const response = await messagingApi.createConversation(token, {
        participantIds: [sellerId],
        type: 'direct',
        adId: adId,
      });

      // Redirect to messages page with the conversation selected
      router.push(`/${lang}/messages?conversation=${response.data.id}`);
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      setError(err.message || 'Failed to start conversation');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleSendMessage}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: loading ? '#9ca3af' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = '#5a67d8';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = '#667eea';
          }
        }}
      >
        {loading ? '⏳ Creating conversation...' : '✉️ Send Message'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}
