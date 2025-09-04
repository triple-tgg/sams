'use client'

import React, { useState, Children, ReactNode, useRef, useEffect } from 'react'
import HorizontalStepper from './stepper/horizontal-stepper'
import { StepContext } from './step-context'


interface Step {
  label: string
  step: number // 1-based
}
type StepWrapperProps = {
  steps: Step[]
  children: ReactNode
}

const StepWrapper: React.FC<StepWrapperProps> = ({ steps, children }) => {
  // const [currentStep, setCurrentStep] = useState(1)
  const [currentStep, setCurrentStep] = useState(0)
  const [activeStep, setActiveStep] = React.useState(1)

  const totalSteps = steps.length
  const stepContainerRef = useRef<HTMLDivElement>(null)
  const clamp = (n: number) => Math.min(Math.max(n, 1), Math.max(totalSteps, 1))

  // const goToStep = (n: number) => setCurrentStep(clamp(n))
  // const goNext = () => setCurrentStep((s) => clamp(s + 1))
  // const goBack = () => setCurrentStep((s) => clamp(s - 1))

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
    <StepContext.Provider value={{ activeStep, currentStep, totalSteps, goToStep, goNext, goBack, onSave }}>
      <div className="space-y-6">
        <div className='flex justify-center'>
          <h1 className='text-3xl font-bold text-blue-600'>{steps[currentStep].label}</h1>
        </div>
        <HorizontalStepper steps={steps} activeStep={currentStep + 1} />
        {/* Current Step Component */}
        <div className="rounded-xl bordershadow-sm bg-white max-w-5xl mx-auto">
          <div>{CurrentComponent}</div>
        </div>
      </div>
    </StepContext.Provider>
  )
}

export default StepWrapper
