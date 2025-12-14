'use client'

import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React, { ChangeEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import ButtonFilled from '@/components/ButtonFilled'
import InputEmail from '@/components/InputEmail'
import InputName from '@/components/InputName'
import InputDate from '@/components/InputDate'
import InputPassword from '@/components/InputPassword'
import InputPhone from '@/components/InputPhone'
import useAuthStore from '@/stores/authStore'
import BoxError from '@/components/BoxError'

interface ModalSignUpProps {
  isModal?: boolean
}

function ModalSignUp({ isModal = true }: ModalSignUpProps) {
  const {
    firstName,
    lastName,
    birthdate,
    email,
    phone,
    signUpPassword,
    isLoading,
    error,
    setFirstName,
    setLastName,
    setBirthdate,
    setEmail,
    setPhone,
    setSignUpPassword,
    isSignUpFormValid,
    submitSignUp,
  } = useAuthStore()
  const router = useRouter()

  const handleBackButton = () => {
    router.back()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitSignUp()
  }

  const containerContent = (
    <div className={clsx([
      isModal ? 'shadow-xl' : 'border border-slate-400',
      'bg-white rounded-3xl max-w-md w-full p-8',
    ])}>
      {/* Header */}
      <div className="text-center mb-6 relative">
        <ArrowLeft onClick={handleBackButton} size={20}
                   className="absolute left-0 top-1 text-slate-800 cursor-pointer hover:text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Finish sign up
        </h2>
        <div className="w-full h-px bg-slate-200 mt-4"></div>
      </div>

      {/* Content */}
      <div className="mb-8">
        {/* Alert box - only show when there's an error */}
        {error && (
          <div className="mb-6">
            <BoxError errorTitle={'Let\'s try that again'} errorDescription={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Legal name Section */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-3">
              Legal name
            </label>
            <InputName
              firstName={firstName}
              lastName={lastName}
              onFirstNameChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              onLastNameChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Make sure this matches the name on your government ID. If you go by another name, you can add a preferred
              first name.
            </p>
          </div>

          {/* Date of birth Section */}
          <div>
            <label htmlFor="birth" className="block text-sm font-medium text-slate-900 mb-3">
              Date of birth
            </label>
            <InputDate
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              To sign up, you need to be at least 18. Your birthday won&apos;t be shared with other people who use
              Rentverse.
            </p>
          </div>

          {/* Contact info Section */}
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-slate-900 mb-3">
              Contact info
            </label>
            <div className="space-y-4">
              <InputEmail
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="me@email.com"
                required
              />
              <InputPhone
                value={phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="Phone number"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We&apos;ll email you rent confirmations and receipts. We may also contact you via phone for important updates.
            </p>
          </div>

          {/* Password Section */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-3">
              Password
            </label>
            <InputPassword
              value={signUpPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSignUpPassword(e.target.value)}
              placeholder="Password"
              required
              showStrengthIndicator={true}
            />
          </div>

          {/* Terms and Conditions */}
          <div className="text-xs text-slate-600 leading-relaxed">
            By selecting Agree and continue, I agree to Rentverse&apos;s{' '}
            <a href="#" className="text-teal-600 hover:underline">Terms of Service</a>,{' '}
            <a href="#" className="text-teal-600 hover:underline">Payments Terms of Service</a>, and{' '}
            <a href="#" className="text-teal-600 hover:underline">Nondiscrimination Policy</a>{' '}
            and acknowledge the{' '}
            <a href="#" className="text-teal-600 hover:underline">Privacy Policy</a>.
          </div>

          {/* Submit Button */}
          <ButtonFilled
            type="submit"
            disabled={!isSignUpFormValid() || isLoading}
          >
            {isLoading ? 'Loading...' : 'Agree and continue'}
          </ButtonFilled>
        </form>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        {containerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      {containerContent}
    </div>
  )
}

export default ModalSignUp
