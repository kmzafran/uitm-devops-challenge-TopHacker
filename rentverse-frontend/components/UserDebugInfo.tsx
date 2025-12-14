'use client'

import React, { useEffect, useState } from 'react'
import useCurrentUser from '@/hooks/useCurrentUser'

/**
 * Debug component to verify user data is properly loaded
 * This should only be used in development
 */
function UserDebugInfo(): React.ReactNode {
  const { user, isAuthenticated } = useCurrentUser()
  const [updateCount, setUpdateCount] = useState(0)

  // Track when user data changes
  useEffect(() => {
    if (user) {
      setUpdateCount(prev => prev + 1)
      console.log('[DEBUG] User data updated:', user)
    }
  }, [user])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 text-sm max-w-sm z-50">
        <h3 className="font-semibold text-red-800">Debug: No User</h3>
        <p className="text-red-700">User is not authenticated</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 text-sm max-w-sm z-50">
      <h3 className="font-semibold text-blue-800 mb-2">Debug: User Data (Updates: {updateCount})</h3>
      <div className="space-y-1 text-blue-700">
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>First Name:</strong> &quot;{user.firstName}&quot; {user.firstName ? '✅' : '❌'}</p>
        <p><strong>Last Name:</strong> &quot;{user.lastName}&quot; {user.lastName ? '✅' : '❌'}</p>
        <p><strong>Name:</strong> &quot;{user.name}&quot; {user.name ? '✅' : '❌'}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
        <p><strong>Birth Date:</strong> {user.dateOfBirth || 'N/A'}</p>
      </div>
      <div className="mt-2 pt-2 border-t border-blue-200">
        <p className="text-xs text-blue-600">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default UserDebugInfo