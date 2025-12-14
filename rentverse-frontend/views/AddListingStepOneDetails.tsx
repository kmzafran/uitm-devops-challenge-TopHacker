'use client'

import { useState } from 'react'

function AddListingStepOneDetails() {
  const [selectedFurnishing, setSelectedFurnishing] = useState('')

  const furnishingOptions = [
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'fully-furnished', label: 'Fully furnished' },
    { value: 'partly-furnished', label: 'Partly furnished' },
    { value: 'negotiable', label: 'Negotiable' },
  ]

  const handleFurnishingSelect = (value: string) => {
    setSelectedFurnishing(value)
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-3xl font-serif text-slate-900">
            Add more details
          </h2>
          <p className="text-lg text-slate-600">
            Enhance your list with additional information
          </p>
        </div>

        {/* Furnishing Options */}
        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-slate-900">
              How is your house available?
            </label>

            {/* Furnishing Selection Grid */}
            <div className="grid grid-cols-2 gap-4">
              {furnishingOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFurnishingSelect(option.value)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${selectedFurnishing === option.value
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }
                  `}
                >
                  {/* Radio button indicator */}
                  <div className="flex items-center space-x-3">
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                        ${selectedFurnishing === option.value
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300'
                      }
                      `}
                    >
                      {selectedFurnishing === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span
                      className={`
                        font-medium transition-colors
                        ${selectedFurnishing === option.value
                        ? 'text-slate-900'
                        : 'text-slate-700'
                      }
                      `}
                    >
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddListingStepOneDetails