'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RefreshCw } from 'lucide-react'
import ButtonFilled from '@/components/ButtonFilled'
import ButtonSecondary from '@/components/ButtonSecondary'
import ContentWrapper from '@/components/ContentWrapper'

export default function Error({
                                error,
                                reset,
                              }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-50">
      <ContentWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
          {/* Error Icon/Image */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-16 h-16 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          {/* Error Content */}
          <div className="text-center max-w-lg">
            <h1 className="text-4xl md:text-5xl font-serif text-slate-800 mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              We encountered an unexpected error while loading this page.
              Don&apos;t worry, our team has been notified and we&apos;re working to fix it.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
                <p className="text-sm text-red-700 font-mono break-words">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonFilled
                onClick={reset}
                className="flex items-center justify-center gap-2 min-w-[160px]"
              >
                <RefreshCw size={20} />
                Try Again
              </ButtonFilled>

              <Link href="/" className="min-w-[160px]">
                <ButtonSecondary
                  iconLeft={<Home size={20} />}
                  label="Go Home"
                  className="w-full"
                />
              </Link>
            </div>

            {/* Additional Help */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-lg font-medium text-slate-800 mb-4">
                Need immediate help?
              </h3>
              <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm">
                <Link
                  href="/"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Back to Home
                </Link>
                <Link
                  href="/property/all"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Browse Properties
                </Link>
                <Link
                  href="/auth"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Background Pattern */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full opacity-20"></div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  )
}
