'use client'

import React, { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

type Step = {
  label: string
}

type StepHeaderProps = {
  currentStep: number
  steps: Step[]
}

const StepHeader: React.FC<StepHeaderProps> = ({ currentStep, steps }) => {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  // Scroll to current step when mounted or changed
  useEffect(() => {
    const el = stepRefs.current[currentStep - 1]
    el?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [currentStep])

  return (
    <div className="overflow-x-auto scrollbar-hide w-full">
      <div className="flex items-center justify-start gap-4 px-4 md:justify-center scroll-px-4 scroll-smooth snap-x">
        {steps.map((step, index) => {
          const stepIndex = index + 1
          const isCompleted = stepIndex < currentStep
          const isCurrent = stepIndex === currentStep
          const isUpcoming = stepIndex > currentStep

          return (
            <div
              key={index}
              ref={(el) => {
                stepRefs.current[index] = el
              }}
              className="flex items-center snap-center min-w-fit"
            >
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full
                    border-2 transition-all
                    ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                    ${isCurrent ? 'border-green-600 text-green-600 bg-white' : ''}
                    ${isUpcoming ? 'bg-white border-gray-300 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? <Check size={20} /> : stepIndex}
                </div>
                <div className="text-[10px] md:text-xs text-center mt-1 w-16 md:w-24 text-wrap">
                  {step.label}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div
                  className={`h-1 w-6 md:w-10 mx-1 md:mx-2 ${stepIndex < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StepHeader
