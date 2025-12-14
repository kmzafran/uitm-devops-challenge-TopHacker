import { useState, useEffect } from 'react'
import type { PropertyTypeDetail } from '@/types/property'
import { PropertyTypesApiClient } from '@/utils/propertyTypesApiClient'

// Icon mapping for property types
const getPropertyTypeIcon = (code: string): string => {
  const iconMap: Record<string, string> = {
    'APARTMENT': '🏠',
    'CONDOMINIUM': '🏬',
    'HOUSE': '🏡',
    'TOWNHOUSE': '🏘️',
    'VILLA': '🏰',
    'PENTHOUSE': '🏙️',
    'STUDIO': '🏢',
  }
  return iconMap[code] || '🏢'
}

// Transform backend property type to frontend format
const transformPropertyType = (propertyType: PropertyTypeDetail) => ({
  icon: propertyType.icon || getPropertyTypeIcon(propertyType.code), // Use API icon or fallback
  name: propertyType.name,
  description: propertyType.description || '',
  id: propertyType.id,
  code: propertyType.code,
})

export const usePropertyTypes = () => {
  const [propertyTypes, setPropertyTypes] = useState<Array<{
    icon: string
    name: string
    description: string
    id: string
    code: string
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching property types from API...')
        const response = await PropertyTypesApiClient.getPropertyTypes()
        
        if (response.success && response.data) {
          const transformedTypes = response.data
            .filter((type: PropertyTypeDetail) => type.isActive !== false) // Only include active types
            .map(transformPropertyType)
          
          setPropertyTypes(transformedTypes)
          console.log('✅ Successfully loaded property types:', transformedTypes.length)
        } else {
          throw new Error('Failed to fetch property types - invalid response format')
        }
      } catch (err) {
        console.error('Error fetching property types:', err)
        let errorMessage = 'Unknown error'
        
        if (err instanceof Error) {
          errorMessage = err.message
          
          // Provide more helpful error messages
          if (err.message.includes('Failed to fetch') || err.message.includes('Unable to connect')) {
            errorMessage = 'Network error - check your internet connection'
          } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            errorMessage = 'Authentication required - please log in'
          } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
            errorMessage = 'Access denied - insufficient permissions'
          } else if (err.message.includes('404')) {
            errorMessage = 'API endpoint not found - check backend configuration'
          } else if (err.message.includes('500')) {
            errorMessage = 'Server error - please try again later'
          }
        }
        
        setError(errorMessage)
        
        // Fallback to static data on error
        console.log('🏠 Using fallback property types due to API error')
        setPropertyTypes([
          { icon: '�', name: 'Apartment', description: 'High-rise residential unit in apartment building', id: 'fallback-1', code: 'APARTMENT' },
          { icon: '�️', name: 'Condominium', description: 'Luxury residential unit with premium facilities and amenities', id: 'fallback-2', code: 'CONDOMINIUM' },
          { icon: '�', name: 'House', description: 'Standalone landed residential property', id: 'fallback-3', code: 'HOUSE' },
          { icon: '�', name: 'Penthouse', description: 'Luxury apartment on the top floor with premium amenities', id: 'fallback-4', code: 'PENTHOUSE' },
          { icon: '�', name: 'Studio', description: 'Open-concept single room residential unit', id: 'fallback-5', code: 'STUDIO' },
          { icon: '�️', name: 'Townhouse', description: 'Multi-level landed property in planned development', id: 'fallback-6', code: 'TOWNHOUSE' },
          { icon: '�', name: 'Villa', description: 'Luxurious single-family home with extensive grounds', id: 'fallback-7', code: 'VILLA' },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyTypes()
  }, [])

  return { propertyTypes, isLoading, error }
}

// Hook for search components that includes "Property" option
export const usePropertyTypesForSearch = () => {
  const { propertyTypes, isLoading, error } = usePropertyTypes()
  
  const searchPropertyTypes = [
    { icon: '🏢', name: 'Property', description: 'All types of properties', id: 'all', code: 'ALL' },
    ...propertyTypes
  ]
  
  return { propertyTypes: searchPropertyTypes, isLoading, error }
}