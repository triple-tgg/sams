'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import PreviewStep from '../../thf/create/components/PreviewStep'
import { StepContext } from '../../thf/create/components/step-context'
import { X } from 'lucide-react'

interface PreviewThfModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    flightInfosId: number | null
}

export const PreviewThfModal: React.FC<PreviewThfModalProps> = ({
    open,
    onOpenChange,
    flightInfosId
}) => {
    // Dummy context values to satisfy PreviewStep's useStep hook
    const dummyContext = {
        activeStep: 5,
        currentStep: 4,
        totalSteps: 6,
        goToStep: () => {},
        goNext: () => {},
        goBack: () => {},
        onSave: () => {},
        isModal: true,
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                size="lg"
                className="max-w-[75vw] w-[1000px] max-h-[90vh] p-0 flex flex-col gap-0 border-0 shadow-none sm:rounded-xl bg-slate-50 overflow-hidden"
                onInteractOutside={(e) => {
                    e.preventDefault()
                }}
            >
                {/* Header */}
                <div className="px-8 py-5 border-b bg-white flex justify-between items-center z-10 shrink-0">
                    <div>
                        <DialogTitle className="text-xl font-bold text-slate-800">Preview</DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">Review your entries</p>
                    </div>
                    <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-5 w-5 text-slate-500" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
                    <div className="p-6 mx-auto max-w-5xl">
                        <StepContext.Provider value={dummyContext}>
                            <PreviewStep flightInfosId={flightInfosId} />
                        </StepContext.Provider>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-white p-4 px-8 flex justify-end gap-3 z-10 shrink-0">
                    <Button onClick={() => onOpenChange(false)} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
