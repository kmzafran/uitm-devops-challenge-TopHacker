'use client'

interface NavbarStepperBottomProps {
  level: number
  progress: number
  isLastStep?: boolean
  isBackHidden?: boolean
  onBack?: () => void
  onNext?: () => void
  onFinish?: () => void
}

function NavbarStepperBottom({
                               level,
                               progress,
                               isLastStep = false,
                               isBackHidden = false,
                               onBack = () => {
                               },
                               onNext = () => {
                               },
                               onFinish,
                             }: NavbarStepperBottomProps) {
  // Calculate overall progress based on level and current progress
  const totalSteps = 3
  const overallProgress = ((level - 1) / totalSteps) * 100 + (progress / totalSteps)

  const handleNextClick = () => {
    if (isLastStep && onFinish) {
      onFinish()
    } else if (onNext) {
      onNext()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-200">
        <div
          className="h-full bg-teal-600 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(overallProgress, 100)}%` }}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Back button */}
        <div className="flex-1">
          {!isBackHidden && (
            <button
              onClick={onBack}
              className="text-slate-900 hover:text-slate-700 font-medium transition-colors"
            >
              Back
            </button>
          )}
        </div>

        {/* Next/Finish button */}
        <div className="flex-1 flex justify-end">
          <button
            onClick={handleNextClick}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NavbarStepperBottom