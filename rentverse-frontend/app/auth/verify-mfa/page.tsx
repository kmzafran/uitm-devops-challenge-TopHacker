'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/stores/authStore'
import ButtonFilled from '@/components/ButtonFilled'
import BoxError from '@/components/BoxError'

const VerifyMfaPage = () => {
  const router = useRouter()
  const {
    otp,
    setOtp,
    submitOtp,
    isLoading,
    error,
    mfaRequired,
    isLoggedIn,
  } = useAuthStore()

  useEffect(() => {
    // If the user is already logged in or MFA is not required, redirect to home
    if (isLoggedIn) {
      router.push('/')
    }
    // If the page is accessed directly without the MFA step, redirect
    if (!mfaRequired && !isLoggedIn) {
        // We can redirect to login or home, home is probably better
        router.push('/')
    }
  }, [isLoggedIn, mfaRequired, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitOtp()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-sm text-slate-600">
            A verification code has been sent to your email. Please enter the code below.
          </p>
          <div className="w-full h-px bg-slate-200 mt-4"></div>
        </div>

        <div className="mb-8">
          {error && (
            <div className="mb-6">
              <BoxError errorTitle={'Verification Failed'} errorDescription={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-900 mb-3">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <ButtonFilled
              type="submit"
              disabled={isLoading || otp.length < 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </ButtonFilled>
          </form>
        </div>
      </div>
    </div>
  )
}

export default VerifyMfaPage
