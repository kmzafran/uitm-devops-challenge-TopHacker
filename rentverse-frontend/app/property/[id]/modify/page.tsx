'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ContentWrapper from '@/components/ContentWrapper'
import ButtonCircle from '@/components/ButtonCircle'
import { ArrowLeft } from 'lucide-react'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'
import useAuthStore from '@/stores/authStore'

interface Property {
  id: string
  title: string
  description: string
  price: string
  furnished: boolean
  isAvailable: boolean
  status: string
  ownerId: string
  propertyType: {
    id: string
    code: string
    name: string
  }
  owner?: {
    id: string
    name: string
    email: string
  }
  images: string[]
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  currencyCode: string
  bedrooms: number
  bathrooms: number
  areaSqm: number
}

interface PropertyResponse {
  success: boolean
  message: string
  data: {
    property: Property
  }
}

function ModifyPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { propertyTypes, isLoading: isLoadingTypes } = usePropertyTypes()
  const { isLoggedIn, user } = useAuthStore()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)
  // Form state - Initialize with empty values, will be populated from API
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    price: '',
    furnished: false,
    isAvailable: true,
    status: 'APPROVED'
  })

  // Fetch property data and pre-fill form
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId || propertyId === 'undefined' || propertyId === 'null') {
        setError('Property ID not found in URL')
        setIsLoading(false)
        return
      }

      // Don't redirect immediately - just return if not logged in
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      // Wait for user data to load before proceeding
      if (!user) {
        console.log('[AUTH] User data not yet loaded, waiting...')
        setIsLoading(false)
        return
      }

      try {
        console.log('[PROPERTY] Fetching property with ID:', propertyId)
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch(`https://rentverse-be.jokoyuliyanto.my.id/api/properties/${propertyId}`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch property: ${response.status}`)
        }

        const data: PropertyResponse = await response.json()
        
        if (data.success && data.data.property) {
          const propertyData = data.data.property
          console.log('[PROPERTY] Successfully loaded property:', propertyData)
          
          // Check if the current user is the owner of this property
          if (user && propertyData.ownerId !== user.id) {
            console.log('[AUTH] User is not the owner of this property:', {
              currentUserId: user.id,
              propertyOwnerId: propertyData.ownerId
            })
            setIsUnauthorized(true)
            setError('You are not authorized to modify this property. Only the property owner can make changes.')
            return
          }
          
          setProperty(propertyData)
          
          // Pre-fill form data with fetched property data - ensure all fields are properly set
          const newFormData = {
            title: propertyData.title || '',
            description: propertyData.description || '',
            propertyType: propertyData.propertyType?.name || '',
            price: propertyData.price?.toString() || '',
            furnished: Boolean(propertyData.furnished),
            isAvailable: propertyData.isAvailable ?? true,
            status: propertyData.status || 'APPROVED'
          }
          
          setFormData(newFormData)
          
          console.log('[PROPERTY] Form pre-filled with:', newFormData)
          console.log('[PROPERTY] Original property data:', {
            title: propertyData.title,
            description: propertyData.description,
            propertyType: propertyData.propertyType,
            price: propertyData.price,
            furnished: propertyData.furnished,
            isAvailable: propertyData.isAvailable,
            status: propertyData.status
          })
        } else {
          setError('Failed to load property')
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError(err instanceof Error ? err.message : 'Failed to load property')
      } finally {
        setIsLoading(false)
      }
    }

    console.log('[EFFECT] useEffect triggered, propertyId:', propertyId, 'isLoggedIn:', isLoggedIn, 'user:', user)
    fetchProperty()
  }, [propertyId, isLoggedIn, user])

  const handleBack = () => {
    router.back()
  }

  const handleSave = async () => {
    if (!isLoggedIn) {
      setError('Please log in to save changes')
      return
    }

    // Additional security check: verify user owns this property
    if (!user || !property || property.ownerId !== user.id) {
      setError('You are not authorized to modify this property')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication token not found')
        return
      }

      // Only send changed fields
      const updateData: Partial<{
        title: string
        description: string
        price: number
        furnished: boolean
        isAvailable: boolean
        status: string
      }> = {}
      
      if (property) {
        if (formData.title !== property.title) updateData.title = formData.title
        if (formData.description !== property.description) updateData.description = formData.description
        if (formData.price !== property.price) updateData.price = parseFloat(formData.price)
        if (formData.furnished !== property.furnished) updateData.furnished = formData.furnished
        if (formData.isAvailable !== property.isAvailable) updateData.isAvailable = formData.isAvailable
        if (formData.status !== property.status) updateData.status = formData.status
      }

      // If no changes, just go back
      if (Object.keys(updateData).length === 0) {
        router.back()
        return
      }

      const response = await fetch(`https://rentverse-be.jokoyuliyanto.my.id/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update property: ${response.status}`)
      }

      const data: PropertyResponse = await response.json()
      
      if (data.success) {
        // Success - redirect back to property details or list
        router.push(`/property/all`)
      } else {
        setError('Failed to update property')
      }
    } catch (err) {
      console.error('Error updating property:', err)
      setError(err instanceof Error ? err.message : 'Failed to update property')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!isLoggedIn) {
      setError('Please log in to delete property')
      return
    }

    // Additional security check: verify user owns this property
    if (!user || !property || property.ownerId !== user.id) {
      setError('You are not authorized to delete this property')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError('Authentication token not found')
        return
      }

      const response = await fetch(`https://rentverse-be.jokoyuliyanto.my.id/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete property: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Success - redirect to property list
        router.push(`/property/all`)
      } else {
        setError('Failed to delete property')
      }
    } catch (err) {
      console.error('Error deleting property:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete property')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'furnished' || field === 'isAvailable' 
        ? value === 'true' 
        : value,
    }))
  }

  return (
    <ContentWrapper>
      <div className="flex items-center space-x-3 mb-8">
        <ButtonCircle icon={<ArrowLeft />} onClick={handleBack} />
        <h1 className="text-2xl font-sans font-medium text-slate-900">
          Listing editor
        </h1>
      </div>

      {isLoading && (
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="space-y-4">
            <div className="text-slate-600">Loading property details...</div>
            <div className="text-sm text-slate-400">Preparing form with existing data...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Show unauthorized state */}
      {!isLoading && isUnauthorized && (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="space-y-6">
            <div className="text-6xl">🚫</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-600 mb-6">
                You can only modify properties that you own. This property belongs to another landlord.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/property/all')}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
                >
                  View All Properties
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-xl transition-colors duration-200"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show login required state */}
      {!isLoading && !error && !isLoggedIn && (
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="space-y-6">
            <div className="text-6xl">🔒</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h2>
              <p className="text-slate-600 mb-6">
                You need to be logged in to modify property listings.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && isLoggedIn && !isUnauthorized && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter property title"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="Enter property description"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700">
                Property type
              </label>
              <select
                id="propertyType"
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={isLoadingTypes}
              >
                <option value="">Select property type</option>
                {isLoadingTypes ? (
                  <option value="">Loading property types...</option>
                ) : (
                  propertyTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-3">
              <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                Price (MYR)
              </label>
              <input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter rental price"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Furnished
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="furnished"
                    checked={formData.furnished === true}
                    onChange={() => handleInputChange('furnished', 'true')}
                    className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="furnished"
                    checked={formData.furnished === false}
                    onChange={() => handleInputChange('furnished', 'false')}
                    className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">No</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Availability
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isAvailable"
                    checked={formData.isAvailable === true}
                    onChange={() => handleInputChange('isAvailable', 'true')}
                    className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="isAvailable"
                    checked={formData.isAvailable === false}
                    onChange={() => handleInputChange('isAvailable', 'false')}
                    className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-700">Not Available</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-end">
              <span className="text-sm text-slate-400">
                {formData.title.length}/100 characters
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-serif text-slate-900 mb-2">
                    {formData.title || 'Property Title'}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    {formData.description || 'Property description will appear here...'}
                  </p>
                </div>

                <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-slate-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500">Property photos will appear here</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                      {formData.propertyType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      formData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {formData.status}
                    </span>
                  </div>

                  {formData.price && (
                    <p className="text-2xl font-bold text-slate-900">
                      MYR {parseFloat(formData.price).toLocaleString()}
                      <span className="text-sm font-normal text-slate-500"> / month</span>
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span>Furnished: {formData.furnished ? 'Yes' : 'No'}</span>
                    <span>•</span>
                    <span>{formData.isAvailable ? 'Available' : 'Not Available'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200"
              >
                {isDeleting ? 'Deleting...' : 'Delete Property'}
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <div className="text-6xl">🗑️</div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete Property
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to delete this property? This action cannot be undone and all data associated with this property will be permanently removed.
              </p>
              <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                Property: <span className="font-medium">{property?.title}</span>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}

export default ModifyPropertyPage
