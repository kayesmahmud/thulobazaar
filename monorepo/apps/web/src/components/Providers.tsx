'use client';

import { SessionProvider } from 'next-auth/react';
import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { StaffAuthProvider } from '@/contexts/StaffAuthContext';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <UserAuthProvider>
        <StaffAuthProvider>
          {children}
        </StaffAuthProvider>
      </UserAuthProvider>
    </SessionProvider>
  );
}
