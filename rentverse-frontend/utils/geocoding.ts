// Geocoding utilities for converting coordinates to address components
import { getAllStates, getDistrictsByState, getLocationsByDistrict } from '@/data/locations'
import { createMapTilerApiUrl } from './apiConfig'

export interface AddressComponents {
  district: string
  subdistrict: string
  state: string
  city: string
  streetAddress: string
  country: string
}

export interface GeocodeResult {
  success: boolean
  address?: AddressComponents
  error?: string
  distance?: number // Distance to closest match in kilometers
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Find the closest subdistrict by calculating distance to all known locations
 */
function findClosestLocation(targetLat: number, targetLng: number) {
  const allStates = getAllStates()
  let closestMatch = {
    state: '',
    district: '',
    subdistrict: '',
    distance: Infinity
  }

  // Iterate through all states, districts, and subdistricts
  allStates.forEach(state => {
    const districts = getDistrictsByState(state)
    
    districts.forEach(district => {
      const locations = getLocationsByDistrict(state, district)
      
      locations.forEach(location => {
        const distance = calculateDistance(
          targetLat, targetLng,
          location.latitude, location.longitude
        )
        
        if (distance < closestMatch.distance) {
          closestMatch = {
            state,
            district,
            subdistrict: location.name,
            distance
          }
        }
      })
    })
  })

  return closestMatch
}

/**
 * Reverse geocode coordinates to get address components using distance-based matching
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  try {
    // Find the closest location by distance
    const closestMatch = findClosestLocation(lat, lng)
    
    if (closestMatch.distance === Infinity) {
      return {
        success: false,
        error: 'No locations found in database'
      }
    }

    // Optional: Try to get street address from MapTiler API for additional context
    let streetAddress = ''
    try {
      const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY
      if (apiKey) {
        const response = await fetch(
          createMapTilerApiUrl(`geocoding/${lng},${lat}.json?key=${apiKey}&language=en`)
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.features && data.features.length > 0) {
            const feature = data.features[0]
            streetAddress = extractStreetAddress(feature.place_name_en || feature.place_name || '')
          }
        }
      }
    } catch (error) {
      // Street address lookup failed, but we can continue with location matching
      console.warn('Street address lookup failed:', error)
    }

    console.log('Distance-based location match:', {
      coordinates: { lat, lng },
      closest: {
        state: closestMatch.state,
        district: closestMatch.district,
        subdistrict: closestMatch.subdistrict,
        distance: `${closestMatch.distance.toFixed(2)}km`
      }
    })
    
    return {
      success: true,
      address: {
        state: closestMatch.state,
        district: closestMatch.district,
        subdistrict: closestMatch.subdistrict,
        city: closestMatch.district, // Use district as city fallback
        streetAddress,
        country: 'Malaysia' // Assuming based on the location data
      },
      distance: closestMatch.distance
    }
  } catch (error) {
    console.error('Distance-based geocoding error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error'
    }
  }
}

/**
 * Extract street address from full place name by removing administrative components
 */
function extractStreetAddress(placeName: string): string {
  // Remove common administrative suffixes and keep the street part
  const cleanAddress = placeName
    .split(',')[0] // Take first part before comma
    .trim()
  
  return cleanAddress
}

/**
 * Validate if coordinates are within Malaysia bounds (approximate)
 */
export function isValidMalaysiaCoordinates(lat: number, lng: number): boolean {
  // Malaysia bounds (approximate)
  const MALAYSIA_BOUNDS = {
    north: 7.5,
    south: 0.8,
    east: 119.5,
    west: 99.5
  }
  
  return lat >= MALAYSIA_BOUNDS.south && 
         lat <= MALAYSIA_BOUNDS.north && 
         lng >= MALAYSIA_BOUNDS.west && 
         lng <= MALAYSIA_BOUNDS.east
}

/**
 * Validate if coordinates are within Thailand bounds (approximate) 
 */
export function isValidThailandCoordinates(lat: number, lng: number): boolean {
  // Thailand bounds (approximate)
  const THAILAND_BOUNDS = {
    north: 20.5,
    south: 5.5,
    east: 105.5,
    west: 97.0
  }
  
  return lat >= THAILAND_BOUNDS.south && 
         lat <= THAILAND_BOUNDS.north && 
         lng >= THAILAND_BOUNDS.west && 
         lng <= THAILAND_BOUNDS.east
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}