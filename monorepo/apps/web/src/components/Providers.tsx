'use client';

import { SessionProvider } from 'next-auth/react';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { StaffAuthProvider } from '@/contexts/StaffAuthContext';
import { ToastProvider } from '@/components/Toast';
import { ReactNode, useEffect } from 'react';
import { initConsoleFilter } from '@/lib/consoleFilter';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    initConsoleFilter();
  }, []);

  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={300} // Check session every 5 minutes instead of constantly
      refetchOnWindowFocus={false} // Don't refetch when window regains focus
      refetchWhenOffline={false} // Don't try to refetch when offline
    >
      <UserAuthProvider>
        <StaffAuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </StaffAuthProvider>
      </UserAuthProvider>
    </SessionProvider>
  );
}
