'use client';

/**
 * useUser — thin re-export of the global UserContext.
 *
 * All components continue to import from '@/hooks/useUser' unchanged.
 * Auth state now comes from the UserProvider in the root layout (singleton),
 * which means user is NEVER reset to null on page navigation.
 */

import { useUserFromContext, type UserContextValue } from '@/lib/UserContext';

export type UseUserReturn = UserContextValue;

export function useUser(): UseUserReturn {
    return useUserFromContext();
}
