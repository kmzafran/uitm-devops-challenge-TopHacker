'use client'

import { useEffect } from 'react'
import useAuthStore from '@/stores/authStore'

function AuthInitializer(): null {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    initializeAuth()
  }, [initializeAuth])

  // This component doesn't render anything
  return null
}

export default AuthInitializer