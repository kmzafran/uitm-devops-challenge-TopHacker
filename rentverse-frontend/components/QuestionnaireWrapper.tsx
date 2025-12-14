import React from 'react'
import NavBarTop from '@/components/NavBarTop'
import NavbarStepperBottom from '@/components/NavbarStepperBottom'

interface QuestionnaireWrapperProps {
  children: React.ReactNode
}

function QuestionnaireWrapper(props: QuestionnaireWrapperProps) {
  const { children } = props
  return (
    <>
      <NavBarTop isQuestionnaire={true} />
      <div className="mx-auto w-full max-w-6xl min-h-screen flex items-start justify-center pt-20">
        {children}
      </div>
      <NavbarStepperBottom level={2} progress={20} />
    </>
  )
}

export default QuestionnaireWrapper
