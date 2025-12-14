import type { Property } from '@/types/property'
import { getApiUrl } from './apiConfig'

const BASE_URL = getApiUrl()

// Backend response property structure
interface BackendProperty {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  price: string
  currencyCode: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
  furnished: boolean
  isAvailable: boolean
  images: string[]
  latitude: number
  longitude: number
  placeId?: string | null
  projectName?: string | null
  developer?: string | null
  code: string
  status: string
  createdAt: string
  updatedAt: string
  ownerId: string
  propertyTypeId: string
  propertyType: {
    id: string
    code: string
    name: string
    description: string
    icon: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  owner: {
    id: string
    email: string
    firstName: string
    lastName: string
    name: string
  }
  amenities: Array<{
    propertyId: string
    amenityId: string
    amenity: {
      id: string
      name: string
      category: string
    }
  }>
  mapsUrl: string
  viewCount: number
  averageRating: number
  totalRatings: number
  isFavorited: boolean
  favoriteCount: number
}

export interface FavoritesResponse {
  success: boolean
  data: {
    favorites: Property[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

// Transform backend property to frontend Property format
function transformProperty(backendProperty: BackendProperty): Property {
  return {
    id: backendProperty.id,
    code: backendProperty.code,
    title: backendProperty.title,
    description: backendProperty.description,
    address: backendProperty.address,
    city: backendProperty.city,
    state: backendProperty.state,
    zipCode: backendProperty.zipCode,
    country: backendProperty.country,
    price: backendProperty.price,
    currencyCode: backendProperty.currencyCode,
    type: backendProperty.propertyType.code as 'APARTMENT' | 'HOUSE' | 'STUDIO' | 'CONDO' | 'VILLA' | 'ROOM', // Map the propertyType.code to type
    bedrooms: backendProperty.bedrooms,
    bathrooms: backendProperty.bathrooms,
    area: backendProperty.areaSqm,
    areaSqm: backendProperty.areaSqm,
    furnished: backendProperty.furnished,
    isAvailable: backendProperty.isAvailable,
    viewCount: backendProperty.viewCount,
    averageRating: backendProperty.averageRating,
    totalRatings: backendProperty.totalRatings,
    isFavorited: backendProperty.isFavorited,
    favoriteCount: backendProperty.favoriteCount,
    images: backendProperty.images,
    amenities: backendProperty.amenities.map(a => a.amenity.name), // Simplify amenities to string array
    latitude: backendProperty.latitude,
    longitude: backendProperty.longitude,
    placeId: backendProperty.placeId,
    projectName: backendProperty.projectName,
    developer: backendProperty.developer,
    status: backendProperty.status,
    createdAt: backendProperty.createdAt,
    updatedAt: backendProperty.updatedAt,
    ownerId: backendProperty.ownerId,
    propertyTypeId: backendProperty.propertyTypeId,
    owner: {
      ...backendProperty.owner,
      phone: '', // Add missing phone field with empty string as fallback
    },
    propertyType: backendProperty.propertyType,
    mapsUrl: backendProperty.mapsUrl,
  }
}

export class FavoritesApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  static async getFavorites(page: number = 1, limit: number = 10): Promise<FavoritesResponse> {
    const token = this.getAuthToken()
    
    const headers: Record<string, string> = {
      'accept': 'application/json',
    }
    
    // Add authorization header if token is available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      console.log('Fetching favorites from API...')
      console.log('URL:', `${BASE_URL}/properties/favorites?page=${page}&limit=${limit}`)

      const response = await fetch(`${BASE_URL}/properties/favorites?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers,
        mode: 'cors',
        cache: 'no-cache',
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Successfully fetched favorites:', data.data?.favorites?.length || 0, 'items')
      
      // Transform backend properties to frontend format
      const transformedData = {
        ...data,
        data: {
          ...data.data,
          favorites: data.data.favorites.map(transformProperty)
        }
      }
      
      return transformedData
    } catch (error) {
      console.error('Error fetching favorites:', error)
      throw error
    }
  }

  static async addToFavorites(propertyId: string): Promise<{ 
    success: boolean
    message: string
    data: {
      action: string
      isFavorited: boolean
      favoriteCount: number
    }
  }> {
    const token = this.getAuthToken()
    
    const headers: Record<string, string> = {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      console.log('Toggling favorite for property:', propertyId)
      const response = await fetch(`${BASE_URL}/properties/${propertyId}/favorite`, {
        method: 'POST',
        headers,
        mode: 'cors',
        body: '',
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Successfully toggled favorite:', data)
      return data
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  static async removeFromFavorites(propertyId: string): Promise<{ 
    success: boolean
    message: string
    data: {
      action: string
      isFavorited: boolean
      favoriteCount: number
    }
  }> {
    // Use the same POST endpoint - backend handles the toggle
    return this.addToFavorites(propertyId)
  }

  static async toggleFavorite(propertyId: string): Promise<{ 
    success: boolean
    message: string
    data: {
      action: string
      isFavorited: boolean
      favoriteCount: number
    }
  }> {
    // Since backend uses same endpoint for toggle, we just call the POST endpoint
    return this.addToFavorites(propertyId)
  }
}