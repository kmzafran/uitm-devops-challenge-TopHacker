import { useState, useEffect, useCallback } from 'react'
import type { Property } from '@/types/property'
import { FavoritesApiClient } from '@/utils/favoritesApiClient'

export const useFavorites = (page: number = 1, limit: number = 10) => {
  const [favorites, setFavorites] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })

  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Fetching favorites from API...')
      const response = await FavoritesApiClient.getFavorites(page, limit)
      
      if (response.success && response.data) {
        setFavorites(response.data.favorites)
        setPagination(response.data.pagination)
        console.log('✅ Successfully loaded favorites:', response.data.favorites.length)
      } else {
        throw new Error('Failed to fetch favorites - invalid response format')
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
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
          errorMessage = 'Favorites not found'
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error - please try again later'
        }
      }
      
      setError(errorMessage)
      setFavorites([]) // Clear favorites on error
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  const addToFavorites = async (propertyId: string) => {
    try {
      await FavoritesApiClient.addToFavorites(propertyId)
      // Refresh the favorites list
      await fetchFavorites()
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  const removeFromFavorites = async (propertyId: string) => {
    try {
      await FavoritesApiClient.removeFromFavorites(propertyId)
      // Remove from local state immediately for better UX
      setFavorites(prev => prev.filter(fav => fav.id !== propertyId))
    } catch (error) {
      console.error('Error removing from favorites:', error)
      // Refresh the list in case of error to ensure consistency
      await fetchFavorites()
      throw error
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favorites,
    isLoading,
    error,
    pagination,
    fetchFavorites,
    addToFavorites,
    removeFromFavorites
  }
}