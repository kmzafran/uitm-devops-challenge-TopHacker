'use client'

import useAuthStore from '@/stores/authStore'

/**
 * Hook to get current authenticated user data
 * Returns user object and helper functions
 */
export function useCurrentUser() {
  const { user, isLoggedIn, isLoading, refreshUserData } = useAuthStore()

  return {
    user,
    isLoggedIn,
    isLoading,
    refreshUserData,
    isAuthenticated: isLoggedIn && !!user,
  }
}

export default useCurrentUser