import React from 'react'
import { usePropertyView, useAutoPropertyView } from '@/hooks/usePropertyView'

interface PropertyViewTrackerProps {
  propertyId: string
  children: React.ReactNode
}

/**
 * Component that automatically logs property views when mounted
 */
export const PropertyViewTracker: React.FC<PropertyViewTrackerProps> = ({ 
  propertyId, 
  children 
}) => {
  const { isLogging, error, hasLogged } = useAutoPropertyView(propertyId)

  // Optional: Show loading state or error state
  if (error) {
    console.warn('Failed to log property view:', error)
  }

  return (
    <div>
      {children}
      {/* Optional: Show debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          View logged: {hasLogged ? 'Yes' : 'No'} | Logging: {isLogging ? 'Yes' : 'No'}
          {error && <div className="text-red-500">Error: {error}</div>}
        </div>
      )}
    </div>
  )
}

/**
 * Example component showing manual view logging
 */
export const PropertyViewButton: React.FC<{ propertyId: string }> = ({ propertyId }) => {
  const { logView, isLogging, error } = usePropertyView()
  // Alternative: Use the store directly
  // const logPropertyView = usePropertiesStore(state => state.logPropertyView)

  const handleLogView = async () => {
    // Option 1: Using the hook
    const result = await logView(propertyId)
    
    // Option 2: Using the store directly (alternative approach)
    // const result = await logPropertyView(propertyId)
    
    if (result) {
      console.log('View logged successfully:', result.viewCount)
    }
  }

  return (
    <button
      onClick={handleLogView}
      disabled={isLogging}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {isLogging ? 'Logging...' : 'Log View'}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </button>
  )
}

export default PropertyViewTracker