'use client'

import React, { useState, Children, ReactNode, useEffect, useRef } from 'react'
import VerticalStepper from './stepper/vertical-stepper'
import { StepContext } from './step-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

interface Step {
    label: string
    step: number
    description?: string
}

type ModalStepWrapperProps = {
    steps: Step[]
    children: ReactNode
    title?: string
    onClose?: () => void
}

const ModalStepWrapper: React.FC<ModalStepWrapperProps> = ({ steps, children, title = "New THF", onClose }) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [activeStep, setActiveStep] = useState(1) // 1-based index for display/logic matching existing components
    const [isSubmitting, setIsSubmitting] = useState(false)
    const submitHandlerRef = useRef<(() => void) | null>(null)

    // Wrapper function to set the submit handler via ref
    const setSubmitHandler = (handler: () => void) => {
        submitHandlerRef.current = handler
    }

    const totalSteps = steps.length

    useEffect(() => {
        setActiveStep(currentStep + 1)
        // Reset submitting state when step changes to prevent button getting stuck
        setIsSubmitting(false)
    }, [currentStep])

    const goToStep = (step: number) => {
        // Basic validation or jump logic if needed
        setCurrentStep(step)
    }

    const goNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1)
        }
    }

    const goBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1)
        }
    }

    const onSave = (data: any) => {
        console.log('Saving data for step', currentStep + 1, data)
    }

    // Handle "Next" or "Submit" button click from the main wrapper
    const handlePrimaryAction = () => {
        if (submitHandlerRef.current) {
            // If the step component registered a submit handler (e.g., form validation/submitting)
            submitHandlerRef.current()
        } else {
            // Default behavior: just go next extended
            // goNext()
            console.log('No submit handler registered')
        }
    }

    const CurrentComponent = Children.toArray(children)[currentStep]

    return (
        <StepContext.Provider
            value={{
                activeStep,
                currentStep,
                totalSteps,
                goToStep,
                goNext,
                goBack,
                onSave,
                setSubmitHandler,
                isModal: true,
                setIsSubmitting,
                closeModal: onClose
            }}
        >
            <div className="flex h-[80vh] w-full overflow-hidden rounded-md border bg-white shadow-xl">
                {/* Left Sidebar - Blue */}
                <div className="w-1/4 min-w-[280px] bg-blue-600 h-full flex flex-col">
                    <VerticalStepper steps={steps} activeStep={activeStep} />

                    {/* Bottom sidebar info or decoration */}
                    <div className="mt-auto p-6 text-blue-100/60 text-xs">
                        &copy; Triple-T Innovation
                    </div>
                </div>

                {/* Right Content - White */}
                <div className="flex-1 flex flex-col h-full bg-slate-50 relative">
                    {/* Header */}
                    <div className="px-8 py-5 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{steps[currentStep].label}</h2>
                            <p className="text-sm text-slate-500">
                                {steps[currentStep].description || `Complete the ${steps[currentStep].label} information`}
                            </p>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-500" />
                            </Button>
                        )}
                    </div>

                    {/* Scrollable Content Area */}
                    <ScrollArea className="flex-1 p-0">
                        <div className="px-8 py-6 pb-24">
                            {/* Additional wrapper to force max-width if needed */}
                            <div className="max-w-4xl">
                                {CurrentComponent}
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="border-t bg-white p-4 px-8 flex justify-end gap-3 sticky bottom-0 z-10">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (currentStep === 0) {
                                    onClose?.()
                                } else {
                                    goBack()
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            {currentStep === 0 ? 'Cancel' : 'Back'}
                        </Button>
                        <Button
                            onClick={handlePrimaryAction}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    <span>Saving...</span>
                                </div>
                            ) : (
                                currentStep === steps.length - 1 ? 'Submit' : 'Next Step'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </StepContext.Provider>
    )
}

export default ModalStepWrapper
