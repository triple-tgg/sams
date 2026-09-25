import clsx from 'clsx'
import { Check, X } from 'lucide-react'
import React from 'react'

interface Step {
    label: string
    step: number
    description?: string
}

interface MobileStepperProps {
    steps: Step[]
    activeStep: number
    title?: string
    status?: string
    onStepClick?: (stepIndex: number) => void
    onClose?: () => void
}

// Compact header stepper shown on mobile & tablet (< lg) in place of the blue sidebar
const MobileStepper: React.FC<MobileStepperProps> = ({ steps, activeStep, title = "New THF", status, onStepClick, onClose }) => {
    const current = steps.find((s) => s.step === activeStep) ?? steps[0]

    return (
        <div className="bg-blue-600 text-white px-4 pt-5 pb-1.5 sm:px-6 shrink-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base leading-tight">{title}</span>
                        {status && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white capitalize">
                                {status}
                            </span>
                        )}
                    </div>
                    <div className="text-blue-100 text-xs">{`Technical Handling Form`}</div>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="shrink-0 -mr-1 flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Step indicators */}
            <div className="mt-2 flex items-center">
                {steps.map((item, index) => {
                    const isActive = activeStep === item.step
                    const isCompleted = activeStep > item.step
                    const isLast = index === steps.length - 1

                    return (
                        <React.Fragment key={item.step}>
                            <button
                                type="button"
                                disabled={!onStepClick}
                                onClick={() => onStepClick?.(index)}
                                aria-label={item.label}
                                aria-current={isActive ? 'step' : undefined}
                                className={clsx(
                                    "flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 text-[10px] sm:text-xs font-semibold transition-colors shrink-0 disabled:cursor-default",
                                    isActive
                                        ? "bg-white text-blue-600 border-white"
                                        : isCompleted
                                            ? "bg-blue-500 border-blue-300 text-white"
                                            : "border-blue-300 text-blue-100"
                                )}
                            >
                                {isCompleted ? <Check className="w-3 h-3" /> : item.step}
                            </button>
                            {!isLast && (
                                <div
                                    className={clsx(
                                        "h-0.5 flex-1 mx-1 rounded-full",
                                        isCompleted ? "bg-white/70" : "bg-blue-300/40"
                                    )}
                                />
                            )}
                        </React.Fragment>
                    )
                })}
            </div>

            {/* Current step label */}
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight truncate">{current.label}</div>
                    {current.description && (
                        <div className="text-[11px] text-blue-100 truncate">{current.description}</div>
                    )}
                </div>
                <span className="shrink-0 text-[11px] text-blue-100">
                    Step {activeStep}/{steps.length}
                </span>
            </div>
        </div>
    )
}

export default MobileStepper
