'use client'

import React, { useState, Children, ReactNode, useEffect, useRef } from 'react'
import VerticalStepper from './stepper/vertical-stepper'
import MobileStepper from './stepper/mobile-stepper'
import { StepContext, SubmitPhase } from './step-context'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ThfRevisionRecord } from '@/lib/store/useThfRevisionStore'

interface Step {
    label: string
    step: number
    description?: string
}

type ModalStepWrapperProps = {
    steps: Step[]
    children: ReactNode
    title?: string
    status?: string
    onClose?: () => void
    canNavigate?: boolean
    revisionRecord?: ThfRevisionRecord | null
}

const ModalStepWrapper: React.FC<ModalStepWrapperProps> = ({ steps, children, title = "New THF", status, onClose, canNavigate = false, revisionRecord }) => {
    const [currentStep, setCurrentStep] = useState(0)
    const [activeStep, setActiveStep] = useState(1) // 1-based index for display/logic matching existing components
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDrafting, setIsDrafting] = useState(false)
    const [submitPhase, setSubmitPhase] = useState<SubmitPhase>('idle')
    const submitHandlerRef = useRef<(() => void) | null>(null)
    const draftHandlerRef = useRef<(() => void) | null>(null)

    // Wrapper function to set the submit handler via ref
    const setSubmitHandler = (handler: () => void) => {
        submitHandlerRef.current = handler
    }

    // Wrapper function to set the draft handler via ref
    const setDraftHandler = (handler: () => void) => {
        draftHandlerRef.current = handler
    }

    const totalSteps = steps.length

    useEffect(() => {
        setActiveStep(currentStep + 1)
        // Reset submitting state when step changes to prevent button getting stuck
        setIsSubmitting(false)
        setIsDrafting(false)
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

    // Handle "Draft" button click
    const handleDraftAction = () => {
        if (draftHandlerRef.current) {
            draftHandlerRef.current()
        } else {
            console.log('No draft handler registered')
        }
    }

    const isLastStep = currentStep === steps.length - 1
    const isSuccess = submitPhase === 'success'

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
                setDraftHandler,
                isModal: true,
                setIsSubmitting,
                closeModal: onClose,
                submitPhase,
                setSubmitPhase
            }}
        >
            <div className="flex flex-col lg:flex-row h-dvh w-full overflow-hidden bg-white shadow-xl">
                {/* Mobile / Tablet Header Stepper */}
                <div className="lg:hidden">
                    <MobileStepper
                        steps={steps}
                        activeStep={activeStep}
                        title={title}
                        status={status}
                        onClose={onClose}
                        onStepClick={canNavigate ? (stepIndex: number) => goToStep(stepIndex) : undefined}
                    />
                </div>

                {/* Left Sidebar - Blue (desktop) */}
                <div className="hidden lg:flex w-1/4 min-w-[280px] bg-blue-600 h-full flex-col shrink-0">
                    <VerticalStepper
                        steps={steps}
                        activeStep={activeStep}
                        title={title}
                        status={status}
                        onStepClick={canNavigate ? (stepIndex: number) => goToStep(stepIndex) : undefined}
                    />

                    {/* Bottom sidebar info or decoration */}
                    <div className="mt-auto p-6 text-blue-100/60 text-xs">
                    </div>
                </div>

                {/* Right Content - White */}
                <div className="flex-1 flex flex-col lg:h-full min-h-0 min-w-0 bg-slate-50 relative">
                    {/* Header (desktop — mobile/tablet uses MobileStepper) */}
                    <div className="hidden lg:flex px-6 py-2 border-b bg-white justify-between items-center shrink-0">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">{steps[currentStep].label}</h2>
                            <p className="text-xs text-slate-500">
                                {steps[currentStep].description || `Complete the ${steps[currentStep].label} information`}
                            </p>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
                                <X className="w-4 h-4 text-slate-500" />
                            </Button>
                        )}
                    </div>

                    {/* Scrollable Content Area */}
                    <ScrollArea
                        className="flex-1 h-full min-h-0 p-0 [&>div>div[style]]:block! [&>div>div[style]]:min-h-full [&>[data-radix-scroll-area-viewport]]:h-full"
                        viewportClassName="h-full w-full [&>div]:min-h-full [&>div]:block!"
                    >
                        <div className="px-3 py-4 pb-6 sm:px-6 sm:py-5 lg:px-8 lg:py-6 lg:pb-8 min-h-full">
                            <div className="w-full">
                                {revisionRecord?.state === 'revision_required' && (
                                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg flex items-start gap-3 shadow-xs">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="text-xs text-amber-900 dark:text-amber-200 flex-1">
                                            <div className="font-semibold text-sm text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                                                <span>Revision Request from Accounting ({revisionRecord.requestedBy || 'Accounting'})</span>
                                                {revisionRecord.requestedAt && (
                                                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400">
                                                        {new Date(revisionRecord.requestedAt).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1.5 text-slate-800 dark:text-slate-200 font-medium bg-white/85 dark:bg-slate-900/85 p-2.5 rounded border border-amber-200/60 dark:border-amber-900/60">
                                                {revisionRecord.reason || 'Please review and update the information as requested.'}
                                            </p>
                                            {revisionRecord.category && (
                                                <div className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                                    Error Category: <span className="underline">{revisionRecord.category}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {CurrentComponent}
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="border-t bg-white px-3 py-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:py-1.5 sm:px-6 lg:px-6 flex justify-end gap-2 sm:gap-3 shrink-0 [&>button]:flex-1 sm:[&>button]:flex-none">
                        {!isSuccess && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (currentStep === 0) {
                                        onClose?.()
                                    } else {
                                        goBack()
                                    }
                                }}
                                disabled={isSubmitting || isDrafting}
                            >
                                {currentStep === 0 ? 'Cancel' : 'Back'}
                            </Button>
                        )}

                        {isLastStep && !isSuccess && (
                            <Button
                                variant="outline"
                                onClick={handleDraftAction}
                                disabled={isSubmitting || isDrafting}
                                className="min-w-[100px]"
                            >
                                {isDrafting ? (
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        <span>Saving Draft...</span>
                                    </div>
                                ) : (
                                    'Draft'
                                )}
                            </Button>
                        )}

                        {isSuccess ? (
                            <Button
                                onClick={onClose}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                            >
                                Close
                            </Button>
                        ) : (
                            <Button
                                onClick={handlePrimaryAction}
                                disabled={isSubmitting || isDrafting}
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
                        )}
                    </div>
                </div>
            </div>
        </StepContext.Provider>
    )
}

export default ModalStepWrapper
