'use client'

import { useState, useEffect, useRef } from 'react'
import { usePropertyListingStore } from '@/stores/propertyListingStore'

function AddListingStepTwoTitle() {
  const { data, updateData } = usePropertyListingStore()
  const [title, setTitle] = useState(data.title || '')
  const maxLength = 50
  const isValid = title.trim().length > 0
  const isUpdatingFromUser = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle user input
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    isUpdatingFromUser.current = true
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Debounced store update
    debounceTimeoutRef.current = setTimeout(() => {
      updateData({ title: newTitle.trim() })
      isUpdatingFromUser.current = false
    }, 300)
  }

  // Sync with store data changes (from other sources)
  useEffect(() => {
    if (!isUpdatingFromUser.current && data.title !== title) {
      setTitle(data.title || '')
    }
  }, [data.title, title])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 mt-10">
      <div className="space-y-3">
        <h2 className="text-2xl font-serif text-slate-900">
          Now, let&apos;s give your house a title
        </h2>
        <p className="text-base text-slate-500 leading-relaxed">
          Short titles work best. Have fun with it you can always change it later.
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={title}
          onChange={handleTitleChange}
          maxLength={maxLength}
          className={`w-full px-4 py-4 text-base border rounded-xl bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-colors ${
            isValid 
              ? 'border-green-200 focus:ring-green-500' 
              : 'border-slate-200 focus:ring-teal-500'
          }`}
          rows={3}
          placeholder="Enter your property title..."
        />
        <div className="flex justify-between items-center">
          <div className="text-sm text-slate-400">
            {title.length}/{maxLength}
          </div>
          {isValid && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Valid title
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddListingStepTwoTitle
