import clsx from 'clsx'
import { Check } from 'lucide-react'
import React from 'react'

interface Step {
    label: string
    step: number
    description?: string
}

interface VerticalStepperProps {
    steps: Step[]
    activeStep: number
    title?: string
    status?: string
    onStepClick?: (stepIndex: number) => void
}

const VerticalStepper: React.FC<VerticalStepperProps> = ({ steps, activeStep, title = "New THF", status, onStepClick }) => {
    return (
        <div className="flex flex-col gap-6 py-6 px-4">
            <div className='px-2'>
                <div className='font-bold text-xl text-white'>{title}</div>
                <div className='text-blue-100 text-sm'>Technical Handling Form</div>
                {status && (
                    <span className='inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white capitalize'>
                        {status}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-4 mt-4">
                {steps.map((item, index) => {
                    const isActive = activeStep === item.step
                    const isCompleted = activeStep > item.step

                    return (
                        <div
                            key={item.step}
                            className={clsx(
                                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all",
                                isActive
                                    ? "bg-white/10 text-white"
                                    : "text-blue-100/70",
                                onStepClick && "cursor-pointer hover:bg-white/5"
                            )}
                            onClick={() => onStepClick?.(index)}
                        >
                            {/* Step Circle */}
                            <div
                                className={clsx(
                                    "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors shrink-0",
                                    isActive
                                        ? "bg-white text-blue-600 border-white"
                                        : isCompleted
                                            ? "bg-blue-500 border-blue-500 text-white"
                                            : "border-blue-300 text-blue-100"
                                )}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : item.step}
                            </div>

                            {/* Step Label */}
                            <div className="flex flex-col">
                                <span className={clsx("font-medium", isActive ? "text-white" : "")}>
                                    {item.label}
                                </span>
                                {item.description && isActive && (
                                    <span className="text-xs text-blue-200 mt-0.5">{item.description}</span>
                                )}
                            </div>

                            {isActive && (
                                <div className="ml-auto">
                                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default VerticalStepper
