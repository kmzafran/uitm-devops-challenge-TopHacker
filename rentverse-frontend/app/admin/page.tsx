'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import ContentWrapper from '@/components/ContentWrapper'
import { Plus, Filter, Clock, RefreshCw, Bot } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { createApiUrl } from '@/utils/apiConfig'

// Extended property type for UI with admin status
interface PropertyApproval {
  id: string
  propertyId: string
  reviewerId: string | null
  status: string
  notes: string | null
  reviewedAt: string | null
  createdAt: string
  property: {
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
    placeId: string | null
    projectName: string | null
    developer: string | null
    code: string
    status: string
    createdAt: string
    updatedAt: string
    ownerId: string
    propertyTypeId: string
    owner: {
      id: string
      email: string
      firstName: string
      lastName: string
      name: string
    }
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
  }
}

interface PendingApprovalsResponse {
  success: boolean
  data: {
    approvals: PropertyApproval[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

// User interface for admin check
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  dateOfBirth: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
}

interface AuthMeResponse {
  success: boolean
  data: {
    user: User
  }
}

function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingApprovals, setPendingApprovals] = useState<PropertyApproval[]>([])
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false)
  const [autoReviewEnabled, setAutoReviewEnabled] = useState(false)
  const [isTogglingAutoReview, setIsTogglingAutoReview] = useState(false)
  const [approvingProperties, setApprovingProperties] = useState<Set<string>>(new Set())
  const [rejectingProperties, setRejectingProperties] = useState<Set<string>>(new Set())
  const { isLoggedIn } = useAuthStore()

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!isLoggedIn) {
        setIsLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setError('Authentication token not found')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`)
        }

        const data: AuthMeResponse = await response.json()
        
        if (data.success) {
          setUser(data.data.user)
        } else {
          setError('Failed to load user data')
        }
      } catch (err) {
        console.error('Error checking admin role:', err)
        setError(err instanceof Error ? err.message : 'Failed to verify admin access')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminRole()
  }, [isLoggedIn])

  // Fetch pending approvals
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!user || user.role !== 'ADMIN') return

      try {
        setIsLoadingApprovals(true)
        const token = localStorage.getItem('authToken')
        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await fetch(createApiUrl('properties/pending-approval'), {
          method: 'GET',
          headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch pending approvals: ${response.status}`)
        }

        const data: PendingApprovalsResponse = await response.json()
        
        if (data.success) {
          setPendingApprovals(data.data.approvals)
        } else {
          setError('Failed to load pending approvals')
        }
      } catch (err) {
        console.error('Error fetching pending approvals:', err)
        setError(err instanceof Error ? err.message : 'Failed to load pending approvals')
      } finally {
        setIsLoadingApprovals(false)
      }
    }

    fetchPendingApprovals()
  }, [user])

  // Fetch auto review status
  useEffect(() => {
    const fetchAutoReviewStatus = async () => {
      if (!user || user.role !== 'ADMIN') return

      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch(createApiUrl('properties/auto-approve/status'), {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.status) {
            setAutoReviewEnabled(data.data.status.isEnabled)
          }
        }
      } catch (err) {
        console.error('Error fetching auto review status:', err)
        // Don't set error for this as it's not critical
      }
    }

    fetchAutoReviewStatus()
  }, [user])

  const formatPrice = (price: string, currency: string) => {
    const num = parseFloat(price)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'MYR' ? 'MYR' : 'USD',
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Verifying admin access...</p>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Show error state
  if (error || !user) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || 'Access denied'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Check if user has admin role
  if (user.role !== 'ADMIN') {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <Image
                src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png"
                alt="Access denied"
                width={240}
                height={240}
                className="w-60 h-60 object-contain"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                Access Denied
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                You don&apos;t have permission to access the admin panel. Only administrators can view this page.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Toggle auto review function
  const toggleAutoReview = async () => {
    try {
      setIsTogglingAutoReview(true)
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(createApiUrl('properties/auto-approve/toggle'), {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !autoReviewEnabled
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to toggle auto review: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setAutoReviewEnabled(data.data.status.isEnabled)
      } else {
        throw new Error('Failed to toggle auto review')
      }
    } catch (err) {
      console.error('Error toggling auto review:', err)
      setError(err instanceof Error ? err.message : 'Failed to toggle auto review')
    } finally {
      setIsTogglingAutoReview(false)
    }
  }

  // Approve property function
  const approveProperty = async (propertyId: string) => {
    try {
      setApprovingProperties(prev => new Set(prev).add(propertyId))
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}/approve`), {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Approved by admin'
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to approve property: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove the approved property from pending approvals
        setPendingApprovals(prev => prev.filter(approval => approval.propertyId !== propertyId))
        
        // Show success message (optional)
        console.log('Property approved successfully:', data.message)
      } else {
        throw new Error('Failed to approve property')
      }
    } catch (err) {
      console.error('Error approving property:', err)
      setError(err instanceof Error ? err.message : 'Failed to approve property')
    } finally {
      setApprovingProperties(prev => {
        const newSet = new Set(prev)
        newSet.delete(propertyId)
        return newSet
      })
    }
  }

  // Reject property function
  const rejectProperty = async (propertyId: string) => {
    try {
      setRejectingProperties(prev => new Set(prev).add(propertyId))
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(createApiUrl(`properties/${propertyId}/reject`), {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Rejected by admin'
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to reject property: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove the rejected property from pending approvals
        setPendingApprovals(prev => prev.filter(approval => approval.propertyId !== propertyId))
        
        // Show success message (optional)
        console.log('Property rejected successfully:', data.message)
      } else {
        throw new Error('Failed to reject property')
      }
    } catch (err) {
      console.error('Error rejecting property:', err)
      setError(err instanceof Error ? err.message : 'Failed to reject property')
    } finally {
      setRejectingProperties(prev => {
        const newSet = new Set(prev)
        newSet.delete(propertyId)
        return newSet
      })
    }
  }

  return (
    <ContentWrapper>
      {/* Statistics Dashboard */}
      <div className="mb-8">
        <h2 className="text-2xl font-sans font-bold text-slate-900 mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Pending */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Pending</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingApprovals.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Filter className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Awaiting Review */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Awaiting Review</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingApprovals.filter(approval => approval.status === 'PENDING').length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Submitted Today */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Submitted Today</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingApprovals.filter(approval => {
                    const today = new Date().toDateString()
                    const submittedDate = new Date(approval.createdAt).toDateString()
                    return today === submittedDate
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <Plus className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto Review Toggle */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Bot className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Auto review</h3>
                <p className="text-sm text-slate-500">Automatically review and approve properties using AI</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600 font-medium">
                {autoReviewEnabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={toggleAutoReview}
                disabled={isTogglingAutoReview}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                  autoReviewEnabled 
                    ? 'bg-teal-600' 
                    : 'bg-slate-300'
                } ${isTogglingAutoReview ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                    autoReviewEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="bg-teal-50 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-teal-700">RevAI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-sans font-medium text-slate-900">Properties Pending Approval</h3>
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors duration-200"
          >
            <RefreshCw size={16} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Loading State for Approvals */}
      {isLoadingApprovals && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
            <p className="text-slate-600">Loading pending approvals...</p>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      {!isLoadingApprovals && (
        <div className="space-y-6">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Property Image */}
                <div className="md:w-1/3">
                  <div className="relative h-48 md:h-full">
                    <Image
                      src={approval.property.images[0] || '/placeholder-property.jpg'}
                      alt={approval.property.title}
                      fill
                      className="object-cover"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        PENDING
                      </span>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex-1 p-6">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          {approval.property.title}
                        </h3>
                        <p className="text-slate-600 text-sm mb-2">
                          {approval.property.address}, {approval.property.city}, {approval.property.state}
                        </p>
                        <p className="text-slate-500 text-sm">
                          Code: {approval.property.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">
                          {formatPrice(approval.property.price, approval.property.currencyCode)}
                        </p>
                        <p className="text-sm text-slate-500">per month</p>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="flex items-center text-slate-600 space-x-4 mb-4">
                      <span>{approval.property.bedrooms} bedrooms</span>
                      <span>•</span>
                      <span>{approval.property.bathrooms} bathrooms</span>
                      <span>•</span>
                      <span>{approval.property.areaSqm} sqm</span>
                      <span>•</span>
                      <span>{approval.property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                    </div>

                    {/* Owner Info */}
                    <div className="mb-4">
                      <p className="text-sm text-slate-500">
                        <span className="font-medium">Owner:</span> {approval.property.owner.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        <span className="font-medium">Email:</span> {approval.property.owner.email}
                      </p>
                      <p className="text-sm text-slate-500">
                        <span className="font-medium">Type:</span> {approval.property.propertyType.name} {approval.property.propertyType.icon}
                      </p>
                    </div>

                    {/* Submission Date */}
                    <div className="mb-4">
                      <p className="text-sm text-slate-500">
                        <span className="font-medium">Submitted:</span> {formatDate(approval.createdAt)}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {approval.property.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex space-x-3">
                        <Link
                          href={`/property/${approval.property.id}`}
                          className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                        >
                          View Property
                        </Link>
                        <span className="text-slate-300">•</span>
                        <button className="text-sm text-slate-600 hover:text-slate-700 font-medium transition-colors">
                          View Details
                        </button>
                      </div>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => approveProperty(approval.property.id)}
                          disabled={approvingProperties.has(approval.property.id)}
                          className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm ${
                            approvingProperties.has(approval.property.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {approvingProperties.has(approval.property.id) ? 'Approving...' : 'Approve'}
                        </button>
                        <button 
                          onClick={() => rejectProperty(approval.property.id)}
                          disabled={rejectingProperties.has(approval.property.id)}
                          className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm ${
                            rejectingProperties.has(approval.property.id) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {rejectingProperties.has(approval.property.id) ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoadingApprovals && pendingApprovals.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="text-center space-y-6 max-w-md">
            <div className="flex justify-center">
              <Image
                src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758310328/rentverse-base/image_17_hsznyz.png"
                alt="No pending approvals"
                width={240}
                height={240}
                className="w-60 h-60 object-contain"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-sans font-medium text-slate-900">
                No pending approvals
              </h3>
              <p className="text-base text-slate-500 leading-relaxed">
                All properties have been reviewed. New submissions will appear here for approval.
              </p>
            </div>
          </div>
        </div>
      )}
    </ContentWrapper>
  )
}

export default AdminPage