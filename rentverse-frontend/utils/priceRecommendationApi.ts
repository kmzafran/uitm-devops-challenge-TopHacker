/**
 * AI Pricing Service
 * Calls the Rentverse AI API for price recommendations
 */

import type { PropertyListingData } from '@/stores/propertyListingStore'

export interface PriceRecommendationRequest {
  area: number
  bathrooms: number
  bedrooms: number
  furnished: string // "Yes" or "No"
  location: string
  property_type: string
}

export interface PriceRecommendationResponse {
  currency: string
  predicted_price: number
  price_range: {
    max: number
    min: number
  }
  status: string
}

/**
 * Map property listing data to AI API request format
 */
export function mapPropertyDataToAIRequest(data: PropertyListingData): PriceRecommendationRequest {
  return {
    area: data.areaSqm || 0,
    bathrooms: data.bathrooms || 1,
    bedrooms: data.bedrooms || 1,
    furnished: data.amenities.includes('furnished') ? 'Yes' : 'No',
    location: (data.city && data.state) ? `${data.city}, ${data.state}` : 'Unknown',
    property_type: data.propertyType || 'APARTMENT'
  }
}

import { createAiServiceApiUrl } from './apiConfig'

/**
 * Get AI-powered price recommendation for a property
 */
export async function getPriceRecommendation(
  propertyData: PriceRecommendationRequest
): Promise<PriceRecommendationResponse> {
  try {
    const response = await fetch(createAiServiceApiUrl('classify/price'), {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data: PriceRecommendationResponse = await response.json()
    
    if (data.status !== 'success') {
      throw new Error('API returned unsuccessful status')
    }

    return data
  } catch (error) {
    console.error('Price recommendation API error:', error)
    throw error
  }
}