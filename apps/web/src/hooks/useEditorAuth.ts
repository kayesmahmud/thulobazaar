import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

/**
 * Custom hook to handle editor authentication and redirects
 * @param lang - Language code for routing
 * @returns Auth state and logout handler
 */
export function useEditorAuth(lang: string) {
  const router = useRouter();
  const { staff, isLoading: authLoading, isEditor, logout } = useStaffAuth();

  const handleLogout = useCallback(async () => {
    await logout();
    router?.push(`/${lang}/editor/login`);
  }, [logout, router, lang]);

  useEffect(() => {
    if (authLoading) return;
    if (!staff || !isEditor) {
      router?.push(`/${lang}/editor/login`);
      return;
    }
  }, [authLoading, staff, isEditor, lang, router]);

  return {
    staff,
    authLoading,
    isEditor,
    handleLogout,
  };
}
