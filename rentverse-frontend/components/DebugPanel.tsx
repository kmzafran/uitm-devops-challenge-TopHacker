'use client'

import { usePropertyListingStore } from '@/stores/propertyListingStore'

function DebugPanel() {
  const { currentStep, steps, data, validateCurrentStep } = usePropertyListingStore()
  
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const currentStepData = steps[currentStep]
  const isValid = validateCurrentStep()

  return (
    <div className="fixed bottom-20 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Current Step: {currentStep}</div>
        <div>Step ID: {currentStepData?.id}</div>
        <div>Step Title: {currentStepData?.title}</div>
        <div>Is Valid: {isValid ? '✅' : '❌'}</div>
        <div>Property Type: {data.propertyType || 'Not set'}</div>
        <div>Is Dirty: {usePropertyListingStore.getState().isDirty ? 'Yes' : 'No'}</div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer">Full Data</summary>
        <pre className="mt-1 text-xs overflow-auto max-h-32">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )
}

export default DebugPanel