/**
 * Messages Page Route
 * Accessible at /en/messages, /np/messages, etc.
 */

import { Suspense } from 'react';
import MessagesPage from '@/components/messages/MessagesPage';

export const metadata = {
  title: 'Messages | Thulobazaar',
  description: 'Real-time messaging system',
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}
