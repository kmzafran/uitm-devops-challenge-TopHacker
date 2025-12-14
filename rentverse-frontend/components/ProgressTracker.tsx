'use client'

import { Check, Lock } from 'lucide-react'
import clsx from 'clsx'
import { usePropertyListingStore } from '@/stores/propertyListingStore'

interface ProgressTrackerProps {
  className?: string
}

function ProgressTracker({ className }: ProgressTrackerProps) {
  const { currentStep, steps, goToStep, canAccessStep } = usePropertyListingStore()
  
  // Group steps by their main sections
  const stepGroups = [
    {
      title: 'About your place',
      steps: steps.slice(0, 7), // intro to property-details
      color: 'bg-blue-500',
    },
    {
      title: 'Make it stand out',
      steps: steps.slice(7, 12), // step-two-intro to description
      color: 'bg-green-500',
    },
    {
      title: 'Finish and publish',
      steps: steps.slice(12), // step-three-intro to pricing
      color: 'bg-purple-500',
    },
  ]

  const overallProgress = (steps.filter(step => step.isCompleted).length / steps.length) * 100

  return (
    <div className={clsx('bg-white border border-slate-200 rounded-lg p-6', className)}>
      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
          <span className="text-sm text-slate-600">
            {Math.round(overallProgress)}% complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Step Groups */}
      <div className="space-y-6">
        {stepGroups.map((group) => {
          const groupId = `group-${group.title.replace(/\s+/g, '-').toLowerCase()}`
          
          return (
            <div key={groupId} className="space-y-3">
              <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <div className={clsx('w-3 h-3 rounded-full', group.color)} />
                {group.title}
              </h4>
              
              <div className="space-y-2 ml-5">
                {group.steps.map((step, stepIndex) => {
                  // Calculate global step index
                  const getGlobalIndex = (groupTitle: string, localIndex: number) => {
                    switch (groupTitle) {
                      case 'About your place':
                        return localIndex
                      case 'Make it stand out':
                        return localIndex + 7
                      case 'Finish and publish':
                        return localIndex + 12
                      default:
                        return localIndex
                    }
                  }
                  
                  const globalIndex = getGlobalIndex(group.title, stepIndex)
                  const isCurrentStep = globalIndex === currentStep
                  const isAccessible = canAccessStep(globalIndex)
                  const isCompleted = step.isCompleted
                  
                  // Render step indicator content
                  const renderStepIndicator = () => {
                    if (isCompleted) {
                      return <Check size={14} />
                    }
                    if (!isAccessible) {
                      return <Lock size={12} />
                    }
                    return <span className="text-xs font-medium">{globalIndex + 1}</span>
                  }
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => isAccessible ? goToStep(globalIndex) : undefined}
                      disabled={!isAccessible}
                      className={clsx(
                        'w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left',
                        isCurrentStep && 'bg-teal-50 border-l-4 border-teal-500',
                        isAccessible && !isCurrentStep && 'hover:bg-slate-50',
                        !isAccessible && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {/* Step indicator */}
                      <div className={clsx(
                        'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                        isCompleted && 'bg-green-500 text-white',
                        isCurrentStep && !isCompleted && 'bg-teal-500 text-white',
                        !isCompleted && !isCurrentStep && isAccessible && 'bg-slate-200 text-slate-600',
                        !isAccessible && 'bg-slate-100 text-slate-400'
                      )}>
                        {renderStepIndicator()}
                      </div>
                      
                      {/* Step title */}
                      <span className={clsx(
                        'text-sm',
                        isCurrentStep && 'font-medium text-teal-700',
                        isCompleted && 'text-green-700',
                        !isCompleted && !isCurrentStep && isAccessible && 'text-slate-600',
                        !isAccessible && 'text-slate-400'
                      )}>
                        {step.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressTracker