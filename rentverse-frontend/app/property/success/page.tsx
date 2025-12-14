'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import ButtonFilled from '@/components/ButtonFilled'
import ButtonSecondary from '@/components/ButtonSecondary'

function PropertySubmissionSuccess() {
  const router = useRouter()

  useEffect(() => {
    // Optional: Auto-redirect after a delay
    const timer = setTimeout(() => {
      // router.push('/dashboard')
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [router])

  const handleViewProperty = () => {
    // Navigate to the property listing or dashboard
    router.push('/property/all')
  }

  const handleCreateAnother = () => {
    // Navigate back to create new property
    router.push('/property/new')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Check size={32} className="text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Property Listed Successfully!
        </h1>
        
        <p className="text-slate-600 mb-8">
          Congratulations! Your property has been submitted and is now live on Rentverse. 
          Potential tenants can now discover and contact you about your listing.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <ButtonFilled onClick={handleViewProperty} className="w-full">
            View My Properties
          </ButtonFilled>
          
          <ButtonSecondary 
            onClick={handleCreateAnother} 
            className="w-full" 
            label="Create Another Listing"
          />
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>What&apos;s Next?</strong><br />
            You&apos;ll receive email notifications when someone shows interest in your property. 
            You can manage your listings from your dashboard anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PropertySubmissionSuccess