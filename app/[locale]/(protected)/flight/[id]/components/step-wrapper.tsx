'use client'

import React, { useState, Children, ReactNode, useRef, useEffect } from 'react'
import StepHeader from './step-header'
import { StepContext } from './step-context'

type Step = {
  label: string
}

type StepWrapperProps = {
  steps: Step[]
  children: ReactNode
}

const StepWrapper: React.FC<StepWrapperProps> = ({ steps, children }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = steps.length
  const stepContainerRef = useRef<HTMLDivElement>(null)

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSave = (data: any) => {
    console.log('Saving data for step', currentStep + 1, data)
  }

  const CurrentComponent = Children.toArray(children)[currentStep]

  useEffect(() => {
    const container = stepContainerRef.current
    if (container) {
      const selectedStep = container.querySelector(`[data-step="${currentStep}"]`) as HTMLDivElement
      if (selectedStep) {
        container.scrollTo({
          left: selectedStep.offsetLeft - container.clientWidth / 2 + selectedStep.clientWidth / 2,
          behavior: 'smooth',
        })
      }
    }
  }, [currentStep])

  return (
    <StepContext.Provider value={{ currentStep, totalSteps, goToStep, goNext, goBack, onSave }}>
      <div className="space-y-6">
        <StepHeader currentStep={currentStep + 1} steps={steps} />
        {/* Current Step Component */}
        <div className="rounded-xl border p-6 shadow-sm bg-white max-w-5xl mx-auto">
          <div>{CurrentComponent}</div>
        </div>
      </div>
    </StepContext.Provider>
  )
}

export default StepWrapper
