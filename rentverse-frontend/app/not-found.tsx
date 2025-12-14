'use client'

import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import ButtonFilled from '@/components/ButtonFilled'
import ButtonSecondary from '@/components/ButtonSecondary'
import ContentWrapper from '@/components/ContentWrapper'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <ContentWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-teal-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-16 h-16 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.1-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
          </div>

          {/* 404 Content */}
          <div className="text-center max-w-lg">
            <div className="mb-6">
              <h1 className="text-8xl md:text-9xl font-serif text-teal-600 mb-2">404</h1>
              <h2 className="text-2xl md:text-3xl font-serif text-slate-800 mb-4">
                Page Not Found
              </h2>
            </div>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
              Let&apos;s get you back to finding your perfect rental property.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/" className="min-w-[160px]">
                <ButtonFilled className="w-full flex items-center justify-center gap-2">
                  <Home size={20} />
                  Go Home
                </ButtonFilled>
              </Link>

              <Link href="/property/all" className="min-w-[160px]">
                <ButtonSecondary
                  iconLeft={<Search size={20} />}
                  label="Browse Properties"
                  className="w-full"
                />
              </Link>
            </div>

            {/* Popular Links */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="text-lg font-medium text-slate-800 mb-4">
                Popular Pages
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <Link
                  href="/property/all"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  All Properties
                </Link>
                <Link
                  href="/property"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  Search Properties
                </Link>
                <Link
                  href="/wishlist"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  Wishlist
                </Link>
                <Link
                  href="/account"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  My Account
                </Link>
                <Link
                  href="/auth"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/"
                  className="text-teal-600 hover:text-teal-700 font-medium transition-colors p-2 rounded hover:bg-teal-50"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Background Pattern */}
          <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full opacity-20"></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-slate-100 rounded-full opacity-10"></div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  )
}
