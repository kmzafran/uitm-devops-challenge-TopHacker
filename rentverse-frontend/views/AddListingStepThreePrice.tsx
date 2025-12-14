'use client'

import { useState, useEffect, useRef } from 'react'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import { getPriceRecommendation, type PriceRecommendationRequest } from '@/utils/priceRecommendationApi'

function AddListingStepThreePrice() {
  const { data, updateData } = usePropertyListingStore()
  const [price, setPrice] = useState(data.price || 1500)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false)
  const isUpdatingFromUser = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sync local state with store, but prevent loops
  useEffect(() => {
    if (!isUpdatingFromUser.current && data.price !== undefined && data.price !== price) {
      setPrice(data.price)
    }
  }, [data.price, price])

  // Initialize store with default price if not set
  useEffect(() => {
    if (!data.price && price > 0) {
      updateData({ price })
    }
  }, [data.price, price, updateData])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handlePriceClick = () => {
    setIsEditing(true)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseInt(e.target.value) || 0
    setPrice(newPrice)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Update store with debounced approach
    isUpdatingFromUser.current = true
    timeoutRef.current = setTimeout(() => {
      updateData({ price: newPrice })
      isUpdatingFromUser.current = false
    }, 300)
  }

  const handlePriceBlur = () => {
    setIsEditing(false)
    // Ensure final update to store
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    updateData({ price })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      updateData({ price })
    }
  }

  const handleGetRecommendation = async () => {
    setIsLoadingRecommendation(true)
    
    try {
      // Map property type to API format
      let apiPropertyType = 'Condominium'
      if (data.propertyType === 'apartment') apiPropertyType = 'Apartment'
      else if (data.propertyType === 'house') apiPropertyType = 'House'
      
      // Prepare property data for API call
      const propertyData: PriceRecommendationRequest = {
        area: data.areaSqm || 1200,
        bathrooms: data.bathrooms || 2,
        bedrooms: data.bedrooms || 3,
        furnished: data.amenities?.some(amenity => 
          amenity.toLowerCase().includes('furnished')
        ) ? "Yes" : "No",
        location: [data.district, data.city, data.state].filter(Boolean).join(', ') || "Kuala Lumpur",
        property_type: apiPropertyType
      }

      const response = await getPriceRecommendation(propertyData)
      
      // Update the price with AI recommendation
      const recommendedPrice = response.predicted_price
      setPrice(recommendedPrice)
      updateData({ price: recommendedPrice })
      
      console.log('AI Price Recommendation:', response)
      
    } catch (error) {
      console.error('Failed to get price recommendation:', error)
      alert('Failed to get price recommendation. Please try again.')
    } finally {
      setIsLoadingRecommendation(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="space-y-12">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-serif text-slate-900">
            Now, set a rent price
          </h2>
          <p className="text-lg text-slate-500">
            You can edit the price later
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            {isEditing ? (
              <div className="flex items-center">
                <span className="text-6xl font-serif text-slate-900">RM</span>
                <input
                  type="number"
                  value={price}
                  onChange={handlePriceChange}
                  onBlur={handlePriceBlur}
                  onKeyPress={handleKeyPress}
                  className="text-6xl font-serif text-slate-900 bg-transparent border-none outline-none text-center w-48"
                  autoFocus
                />
              </div>
            ) : (
              <div
                className="flex items-center cursor-pointer hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors"
                onClick={handlePriceClick}
              >
                <span className="text-6xl font-serif text-slate-900">
                  RM {price.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-base text-slate-400">
            Click to edit the price
          </p>
        </div>

        <div className="flex justify-center">
          <button 
            className="flex items-center space-x-3 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-colors duration-200"
            onClick={handleGetRecommendation}
            disabled={isLoadingRecommendation}
          >
            <span className="font-medium">
              {isLoadingRecommendation ? 'Getting recommendation...' : 'Get recommendation price'}
            </span>
            <div className="px-3 py-1 bg-white text-teal-600 rounded-full text-sm font-bold">
              RevAI
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddListingStepThreePrice
