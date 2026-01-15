import { useApp } from '@/contexts/AppContext';

/**
 * Hook to check if the current user is an admin
 * @returns true if user role is 'admin', false otherwise
 */
export function useIsAdmin(): boolean {
  const { user } = useApp();
  return user?.profile?.role === 'admin';
}
