'use client'

import React from 'react'
import useCurrentUser from '@/hooks/useCurrentUser'

/**
 * Example component showing how to use the current user data
 * This can be used in profile pages or anywhere user data is needed
 */
function UserProfileExample(): React.ReactNode {
  const { user, isAuthenticated, refreshUserData } = useCurrentUser()

  const handleRefreshProfile = async () => {
    const success = await refreshUserData()
    if (success) {
      console.log('Profile refreshed successfully')
    } else {
      console.log('Failed to refresh profile')
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Please log in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">User Profile</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name:</label>
          <p className="text-gray-900">
            {user.firstName} {user.lastName}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        
        {user.birthdate && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Birth Date:</label>
            <p className="text-gray-900">{user.birthdate}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">User ID:</label>
          <p className="text-gray-500 text-sm font-mono">{user.id}</p>
        </div>
      </div>
      
      <button
        onClick={handleRefreshProfile}
        className="mt-4 w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors"
      >
        Refresh Profile Data
      </button>
    </div>
  )
}

export default UserProfileExample