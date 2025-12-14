'use client'

import { useState, useEffect, useRef } from 'react'
import { usePropertyListingStore } from '@/stores/propertyListingStore'

function AddListingStepThreeLegal() {
  const { data, updateData } = usePropertyListingStore()
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(data.maintenanceIncluded || '')
  const [landlordType, setLandlordType] = useState(data.landlordType || '')
  const isUpdatingFromUser = useRef(false)

  // Sync local state with store
  useEffect(() => {
    if (!isUpdatingFromUser.current) {
      if (data.maintenanceIncluded !== maintenanceIncluded) {
        setMaintenanceIncluded(data.maintenanceIncluded || '')
      }
      if (data.landlordType !== landlordType) {
        setLandlordType(data.landlordType || '')
      }
    }
  }, [data.maintenanceIncluded, data.landlordType, maintenanceIncluded, landlordType])

  // Initialize store with current values if they exist
  useEffect(() => {
    if (maintenanceIncluded && !data.maintenanceIncluded) {
      updateData({ maintenanceIncluded })
    }
    if (landlordType && !data.landlordType) {
      updateData({ landlordType })
    }
  }, [maintenanceIncluded, landlordType, data.maintenanceIncluded, data.landlordType, updateData])

  const maintenanceOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ]

  const landlordOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'company', label: 'Company' },
    { value: 'partnership', label: 'Partnership firm' },
  ]

  const handleMaintenanceSelect = (value: string) => {
    setMaintenanceIncluded(value)
    isUpdatingFromUser.current = true
    updateData({ maintenanceIncluded: value })
    setTimeout(() => {
      isUpdatingFromUser.current = false
    }, 100)
  }

  const handleLandlordSelect = (value: string) => {
    setLandlordType(value)
    isUpdatingFromUser.current = true
    updateData({ landlordType: value })
    setTimeout(() => {
      isUpdatingFromUser.current = false
    }, 100)
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-serif text-slate-900">
            Set your legal clause
          </h2>
          <p className="text-lg text-slate-600">
            Make sure you make wise decision for legal terms
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-slate-900">
              Is Maintenance Included in the rent?
            </label>
            <div className="grid grid-cols-2 gap-4">
              {maintenanceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleMaintenanceSelect(option.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    maintenanceIncluded === option.value
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        maintenanceIncluded === option.value
                          ? 'border-slate-900 bg-slate-900'
                          : 'border-slate-300'
                      }`}
                    >
                      {maintenanceIncluded === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-medium transition-colors">
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-slate-900">
              Select type of landlord
            </label>
            <div className="grid grid-cols-2 gap-4">
              {landlordOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLandlordSelect(option.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    landlordType === option.value
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        landlordType === option.value
                          ? 'border-slate-900 bg-slate-900'
                          : 'border-slate-300'
                      }`}
                    >
                      {landlordType === option.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="font-medium transition-colors">
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

export default AddListingStepThreeLegal
