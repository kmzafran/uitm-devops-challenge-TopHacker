import { useState, useCallback, useEffect } from 'react'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import type { Property } from '@/types/property'

/**
 * Custom hook for property view logging
 */
export const usePropertyView = () => {
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logView = useCallback(async (propertyId: string): Promise<Property | null> => {
    if (isLogging) return null // Prevent duplicate calls

    setIsLogging(true)
    setError(null)

    try {
      const response = await PropertiesApiClient.logPropertyView(propertyId)
      
      if (response.success && response.data.property) {
        return response.data.property
      }
      
      setError('Failed to log property view')
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log property view'
      setError(errorMessage)
      console.error('Property view logging error:', err)
      return null
    } finally {
      setIsLogging(false)
    }
  }, [isLogging])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    logView,
    isLogging,
    error,
    clearError,
  }
}

/**
 * Hook that automatically logs a property view when the component mounts
 */
export const useAutoPropertyView = (propertyId: string | null) => {
  const { logView, isLogging, error } = usePropertyView()
  const [hasLogged, setHasLogged] = useState(false)

  // Automatically log view when propertyId is available and not already logged
  useEffect(() => {
    if (propertyId && !hasLogged && !isLogging) {
      logView(propertyId).then(() => {
        setHasLogged(true)
      })
    }
  }, [propertyId, hasLogged, isLogging, logView])

  return {
    isLogging,
    error,
    hasLogged,
  }
}